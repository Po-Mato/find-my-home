import { NextRequest, NextResponse } from "next/server";
import computeIsochroneBMAD from "@/lib/bmad";

type Mode = "walking" | "driving" | "transit";

type IsochroneRequest = {
  center: { lat: number; lng: number };
  time: number;
  mode: Mode;
};

type NaverRoute = {
  summary?: {
    distance?: number;
    duration?: number;
    tollFare?: number;
    fuelPrice?: number;
    taxiFare?: number;
  };
  path?: number[][];
};

const SPEED_M_PER_MIN: Record<Mode, number> = {
  walking: 80,
  transit: 600,
  driving: 800,
};

function isValidLatLng(lat: number, lng: number) {
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

function metersToLat(m: number) {
  return m / 111_320;
}

function metersToLng(m: number, lat: number) {
  return m / (111_320 * Math.cos((lat * Math.PI) / 180));
}

function destinationFrom(center: { lat: number; lng: number }, bearingDeg: number, distanceM: number) {
  const rad = (bearingDeg * Math.PI) / 180;
  const dLat = metersToLat(distanceM * Math.sin(rad));
  const dLng = metersToLng(distanceM * Math.cos(rad), center.lat);
  return { lat: center.lat + dLat, lng: center.lng + dLng };
}

function toGeoJSONPolygon(coords: Array<[number, number]>) {
  const closed = coords.length > 0 && (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1])
    ? [...coords, coords[0]]
    : coords;

  return {
    type: "Feature" as const,
    geometry: {
      type: "Polygon" as const,
      coordinates: [closed],
    },
  };
}

async function fetchNaverDrivingRoute(start: { lat: number; lng: number }, goal: { lat: number; lng: number }) {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("NAVER_CLIENT_ID/NAVER_CLIENT_SECRET 환경변수가 필요합니다.");
  }

  const url = new URL("https://maps.apigw.ntruss.com/map-direction/v1/driving");
  url.searchParams.set("start", `${start.lng},${start.lat}`);
  url.searchParams.set("goal", `${goal.lng},${goal.lat}`);
  url.searchParams.set("option", "trafast");

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "X-NCP-APIGW-API-KEY-ID": clientId,
      "X-NCP-APIGW-API-KEY": clientSecret,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`네이버 Directions 호출 실패: ${res.status} ${body}`);
  }

  const data = await res.json();
  const route = (data?.route?.trafast?.[0] ?? null) as NaverRoute | null;
  if (!route?.summary?.duration || !route?.summary?.distance) {
    return null;
  }
  return route;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<IsochroneRequest>;
    const center = body.center;
    const time = body.time;
    const mode = body.mode;

    if (!center || typeof center.lat !== "number" || typeof center.lng !== "number") {
      return NextResponse.json({ error: "center(lat,lng)가 필요합니다." }, { status: 400 });
    }
    if (!isValidLatLng(center.lat, center.lng)) {
      return NextResponse.json({ error: "유효하지 않은 좌표입니다." }, { status: 400 });
    }
    if (typeof time !== "number" || !Number.isFinite(time) || time < 1 || time > 120) {
      return NextResponse.json({ error: "time은 1~120(분)이어야 합니다." }, { status: 400 });
    }
    if (mode !== "walking" && mode !== "driving" && mode !== "transit") {
      return NextResponse.json({ error: "mode는 walking|driving|transit 이어야 합니다." }, { status: 400 });
    }

    // 현재는 네이버 Directions(자동차) 기반 정밀 계산 지원
    // walking/transit은 기존 BMAD로 폴백
    if (mode !== "driving") {
      const fallback = await computeIsochroneBMAD(center, time, mode);
      return NextResponse.json({
        ...fallback,
        properties: {
          ...(fallback as any).properties,
          engine: "bmad-fallback",
          reason: "네이버 Directions는 자동차 경로 기반이므로 walking/transit은 폴백 처리",
        },
      });
    }

    const baseRadiusM = Math.max(200, time * SPEED_M_PER_MIN[mode]);
    const bearings = Array.from({ length: 16 }, (_, i) => i * 22.5);

    const sampledPoints = await Promise.all(
      bearings.map(async (bearing) => {
        const probeGoal = destinationFrom(center, bearing, baseRadiusM);
        const route = await fetchNaverDrivingRoute(center, probeGoal);

        if (!route?.summary?.duration) {
          return { bearing, point: [probeGoal.lng, probeGoal.lat] as [number, number], etaMs: null, distanceM: null };
        }

        const etaMs = route.summary.duration;
        const distanceM = route.summary.distance ?? baseRadiusM;

        const scale = Math.max(0.2, Math.min(1.2, (time * 60_000) / etaMs));
        const adjustedDistance = Math.max(100, distanceM * scale);
        const finalPoint = destinationFrom(center, bearing, adjustedDistance);

        return {
          bearing,
          point: [finalPoint.lng, finalPoint.lat] as [number, number],
          etaMs,
          distanceM,
          tollFare: route.summary.tollFare ?? 0,
          fuelPrice: route.summary.fuelPrice ?? 0,
        };
      })
    );

    const validPoints = sampledPoints.filter((p) => p.point && Number.isFinite(p.point[0]) && Number.isFinite(p.point[1]));

    if (validPoints.length < 6) {
      const fallback = await computeIsochroneBMAD(center, time, mode);
      return NextResponse.json({
        ...fallback,
        properties: {
          ...(fallback as any).properties,
          engine: "bmad-fallback",
          reason: "유효한 Directions 샘플 부족",
        },
      });
    }

    const polygon = toGeoJSONPolygon(validPoints.map((p) => p.point));
    const confidence = Math.min(1, validPoints.length / bearings.length);

    return NextResponse.json({
      ...polygon,
      properties: {
        center,
        timeMinutes: time,
        mode,
        engine: "naver-directions-sampling",
        option: "trafast",
        samples: sampledPoints,
        confidence,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
