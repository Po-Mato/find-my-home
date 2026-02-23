"use client";

import React, { useState, useCallback, useEffect } from "react";
import SearchForm, { IsochroneParams } from "./SearchForm";
import NaverMap from "./NaverMap";

export default function Home() {
  const [params, setParams] = useState<IsochroneParams | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // UX 개선: 기본값 변경 (광화문 중심) - 37.5701, 126.9777
  const [lat, setLat] = useState<string>("37.5701");
  const [lng, setLng] = useState<string>("126.9777");

  // Task 1-1.3: 지도 클릭 시 좌표 수신 콜백
  const handleLocationClick = useCallback((coord: { lat: number; lng: number }) => {
    console.log(`🗺️ [Home] 지도 클릭 — lat: ${coord.lat}, lng: ${coord.lng}`);
    // UX 개선: 지도 클릭 시 SearchForm의 입력 필드에 즉시 반영
    setLat(coord.lat.toString());
    setLng(coord.lng.toString());
  }, []);

  // 검색 버튼 클릭 시 호출되는 핸들러
  const handleSearch = useCallback(async (searchParams: IsochroneParams) => {
    setIsLoading(true);
    setParams(searchParams);
    // NaverMap 컴포넌트에서 부모로부터 받은 params를 감지하여 자동으로 업데이트
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold text-gray-800">🗺️ Find My Home</h1>
          <p className="text-gray-600 mt-2">특정 시간 내 도달 가능한 지역을 지도에 표시합니다</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 검색 폼 (좌측) */}
          <div className="lg:col-span-1">
            <SearchForm 
              onSearch={handleSearch} 
              isLoading={isLoading}
              lat={lat} // Lat/Lng를 SearchForm으로 전달하여 동기화 유도
              lng={lng}
            />
          </div>

          {/* 지도 (우측) */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <NaverMap
                clientId={process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID ?? ""}
                params={params}
                onLoadingChange={setIsLoading}
                onLocationClick={handleLocationClick}
              />
            </div>
            {!params && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm">
                  💡 좌측 폼에서 중심 좌표, 시간, 이동수단을 입력하고 검색 버튼을 누르세요.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-white mt-12 py-6 border-t border-gray-200">
        <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
          <p>Find My Home © 2025. Built with Next.js, React, and Naver Maps API.</p>
        </div>
      </footer>
    </div>
  );
}