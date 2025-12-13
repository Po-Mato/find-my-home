"use client";

import React, { useEffect, useRef, useState } from "react";

export type IsochroneParams = {
  center: { lat: number; lng: number };
  time: number;
  mode: "walking" | "driving" | "transit";
};

interface NaverMapProps {
  clientId: string;
  params?: IsochroneParams | null;
  onLoadingChange?: (loading: boolean) => void;
}

export default function NaverMap({ clientId, params, onLoadingChange }: NaverMapProps) {
  // clientId is injected from the server page to avoid exposing server env to client bundle
  const mapElRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const polygonRef = useRef<any>(null);
  const [errorVisible, setErrorVisible] = useState(false);

  const mask = (s: string) => {
    if (!s) return "";
    if (s.length <= 8) return s.replace(/.(?=.{4})/g, "*");
    return s.slice(0, 4) + "..." + s.slice(-4);
  };

  useEffect(() => {
    if (!clientId) {
      console.warn('⚠️ [NaverMap] clientId가 없습니다.');
      return;
    }

    console.log('✅ [NaverMap] 초기화 시작 — clientId:', mask(clientId));

    let attempts = 0;
    let mounted = true;

    function showAuthOverlay() {
      if (!mounted) return;
      console.error('❌ [NaverMap] 지도 로드 실패 — 인증 오류 또는 API 로드 실패');
      setErrorVisible(true);
    }

    function createMap() {
      const el = mapElRef.current;
      if (!el) {
        console.warn('⚠️ [NaverMap] DOM 요소를 찾을 수 없습니다.');
        return null;
      }
      // @ts-ignore
      if (el.__naver_map) {
        console.log('✅ [NaverMap] 캐시된 지도 인스턴스 반환');
        return el.__naver_map;
      }
      if (!(window as any).naver || !(window as any).naver.maps) {
        console.warn('⚠️ [NaverMap] naver.maps API가 아직 로드되지 않았습니다. (시도 #' + attempts + ')');
        return null;
      }
      console.log('✅ [NaverMap] naver.maps 감지됨 — 지도 인스턴스 생성 중...');
      // @ts-ignore
      const m = new (window as any).naver.maps.Map(el, {
        center: new (window as any).naver.maps.LatLng(37.5665, 126.978),
        zoom: 13,
      });
      // @ts-ignore
      el.__naver_map = m;
      console.log('✅ [NaverMap] 지도 인스턴스 생성 완료');
      return m;
    }

    function tryCreate() {
      attempts += 1;
      try {
        const m = createMap();
        if (!m) {
          if (attempts > 20) {
            console.error('❌ [NaverMap] 20회 시도 후에도 naver.maps를 로드하지 못했습니다.');
            showAuthOverlay();
            return;
          }
          setTimeout(tryCreate, 100);
          return;
        }
        mapInstanceRef.current = m;
        console.log('✅ [NaverMap] 지도 인스턴스 설정 완료 — Isochrone 그리기 시작');
        drawIsochrone(m);
      } catch (e) {
        console.error('❌ [NaverMap] 예외 발생:', e);
        if (attempts > 20) {
          showAuthOverlay();
          return;
        }
        setTimeout(tryCreate, 200);
      }
    }

    function drawIsochrone(mapInstance: any) {
      // params가 있으면 그것을 사용, 없으면 기본값 사용
      const searchParams = params || {
        center: { lat: 37.5665, lng: 126.978 },
        time: 15,
        mode: "walking" as const
      };

      console.log('📍 [NaverMap.drawIsochrone] 호출됨 — 파라미터:', searchParams);

      // 기존 폴리곤 제거
      if (polygonRef.current) {
        console.log('🗑️ [NaverMap.drawIsochrone] 기존 폴리곤 제거');
        polygonRef.current.setMap(null);
        polygonRef.current = null;
      }

      onLoadingChange?.(true);

      console.log('🔄 [NaverMap.drawIsochrone] API 호출 시작...');
      fetch('/api/isochrone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          center: searchParams.center,
          time: searchParams.time,
          mode: searchParams.mode
        })
      }).then(res => {
        console.log('📡 [NaverMap.drawIsochrone] API 응답 상태:', res.status);
        if (!res.ok) throw new Error(`API 오류: ${res.status}`);
        return res.json();
      }).then(geo => {
        console.log('✅ [NaverMap.drawIsochrone] GeoJSON 수신:', geo);
        try {
          if (!geo || !geo.geometry) {
            console.error('❌ [NaverMap.drawIsochrone] 유효하지 않은 GeoJSON:', geo);
            return;
          }
          const coords = (geo.geometry.coordinates && geo.geometry.coordinates[0]) || [];
          console.log('📍 [NaverMap.drawIsochrone] 폴리곤 좌표 개수:', coords.length);
          const path = coords.map((c: any) => new (window as any).naver.maps.LatLng(c[1], c[0]));
          
          // 폴리곤 색상을 이동수단에 따라 결정
          const colorMap = {
            walking: { fill: '#ff7f50', stroke: '#ff4500' },     // 주황색
            driving: { fill: '#1e90ff', stroke: '#00008b' },     // 파란색
            transit: { fill: '#50c878', stroke: '#228b22' }      // 초록색
          };
          const colors = colorMap[searchParams.mode];

          console.log('🎨 [NaverMap.drawIsochrone] 폴리곤 색상:', colors, '이동수단:', searchParams.mode);
          polygonRef.current = new (window as any).naver.maps.Polygon({
            map: mapInstance,
            paths: path,
            fillColor: colors.fill,
            fillOpacity: 0.25,
            strokeColor: colors.stroke,
            strokeWeight: 2
          });
          console.log('✅ [NaverMap.drawIsochrone] 폴리곤 생성 완료');
        } catch (e) {
          console.error('❌ [NaverMap.drawIsochrone] 폴리곤 생성 오류:', e);
        }
      }).catch(err => {
        console.error('❌ [NaverMap.drawIsochrone] 네트워크 또는 API 오류:', err);
        alert('도달 영역 계산 실패: ' + err.message);
      }).finally(() => {
        console.log('⏹️ [NaverMap.drawIsochrone] 완료');
        onLoadingChange?.(false);
      });
    }

    // inject callback and script
    (window as any).initNaverMap = function initNaverMap() {
      console.log('🔔 [NaverMap] initNaverMap 콜백 호출됨 — naver.maps API 로드 완료');
      tryCreate();
    };

    const mapsSrc = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&callback=initNaverMap`;
    const scriptId = 'naver-maps-js';
    console.log('📥 [NaverMap] 스크립트 로드 URL:', mapsSrc);
    
    if (!document.getElementById(scriptId)) {
      console.log('📥 [NaverMap] naver.maps 스크립트 동적 로드 시작...');
      const s = document.createElement('script');
      s.id = scriptId;
      s.src = mapsSrc;
      s.async = true;
      s.defer = true;
      s.onerror = () => {
        console.error('❌ [NaverMap] 스크립트 로드 실패:', mapsSrc);
      };
      document.head.appendChild(s);
    } else {
      console.log('✅ [NaverMap] 스크립트 이미 로드됨 — 즉시 지도 생성 시도');
      // if script already exists, try to create immediately
      tryCreate();
    }

    return () => {
      console.log('🧹 [NaverMap] cleanup 실행');
      mounted = false;
      // cleanup: do not remove global script to avoid removing for other components
      try { delete (window as any).initNaverMap; } catch {};
    };
  }, [clientId, params, onLoadingChange]);

  if (!clientId) {
    return (
      <div style={{ width: "100%", height: 200, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, background: "#fff6f6", color: "#7a1f1f", padding: 16 }}>
        <div>
          <strong>네이버 지도 클라이언트 키가 설정되어 있지 않습니다.</strong>
          <div style={{ marginTop: 8 }}>
            `.env.local`에 <code>NAVER_CLIENT_ID</code>를 추가하고 개발 서버를 재시작하세요.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <div
        id="naver-map"
        ref={mapElRef}
        data-client-id={mask(clientId)}
        style={{ width: "100%", height: "400px", borderRadius: 8, boxShadow: "0 2px 8px #0001" }}
      />
      {errorVisible && (
        <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.95)', color: '#b21f1f', padding: 16 }}>
          <div style={{ maxWidth: 640, textAlign: 'center' }}>
            <h3>지도 로드 실패</h3>
            <p>네이버 Maps 인증에 실패했거나 도메인 허용 설정이 필요합니다.<br/>콘솔에서 인증 에러와 Client ID를 확인하세요.</p>
          </div>
        </div>
      )}
    </div>
  );
}
