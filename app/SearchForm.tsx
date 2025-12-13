"use client";

import React, { useState } from "react";

export type IsochroneParams = {
  center: { lat: number; lng: number };
  time: number; // 분
  mode: "walking" | "driving" | "transit";
};

interface SearchFormProps {
  onSearch: (params: IsochroneParams) => void;
  isLoading?: boolean;
}

export default function SearchForm({ onSearch, isLoading = false }: SearchFormProps) {
  // 기본값: 서울 중심 (광화문)
  const [lat, setLat] = useState<string>("37.5728");
  const [lng, setLng] = useState<string>("126.9774");
  const [time, setTime] = useState<string>("15");
  const [mode, setMode] = useState<"walking" | "driving" | "transit">("walking");

  // 사용자가 검색 버튼을 누르면 부모 컴포넌트에 데이터 전달
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 입력값 검증
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const timeNum = parseInt(time, 10);

    if (isNaN(latNum) || isNaN(lngNum) || isNaN(timeNum)) {
      alert("올바른 좌표와 시간을 입력해주세요.");
      return;
    }

    if (timeNum <= 0) {
      alert("시간은 1분 이상이어야 합니다.");
      return;
    }

    onSearch({
      center: { lat: latNum, lng: lngNum },
      time: timeNum,
      mode,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">도달 가능 영역 검색</h2>

      {/* 위도 입력 */}
      <div className="mb-4">
        <label htmlFor="lat" className="block text-sm font-medium text-gray-700 mb-1">
          위도 (Latitude)
        </label>
        <input
          id="lat"
          type="number"
          step="0.0001"
          value={lat}
          onChange={(e) => setLat(e.target.value)}
          disabled={isLoading}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          placeholder="37.5665"
        />
      </div>

      {/* 경도 입력 */}
      <div className="mb-4">
        <label htmlFor="lng" className="block text-sm font-medium text-gray-700 mb-1">
          경도 (Longitude)
        </label>
        <input
          id="lng"
          type="number"
          step="0.0001"
          value={lng}
          onChange={(e) => setLng(e.target.value)}
          disabled={isLoading}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          placeholder="126.9784"
        />
      </div>

      {/* 시간 입력 */}
      <div className="mb-4">
        <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
          도달 시간 (분)
        </label>
        <input
          id="time"
          type="number"
          min="1"
          max="120"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          disabled={isLoading}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          placeholder="15"
        />
      </div>

      {/* 이동 수단 선택 */}
      <div className="mb-6">
        <label htmlFor="mode" className="block text-sm font-medium text-gray-700 mb-1">
          이동 수단
        </label>
        <select
          id="mode"
          value={mode}
          onChange={(e) => setMode(e.target.value as "walking" | "driving" | "transit")}
          disabled={isLoading}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        >
          <option value="walking">도보</option>
          <option value="driving">자동차</option>
          <option value="transit">대중교통</option>
        </select>
      </div>

      {/* 검색 버튼 */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
      >
        {isLoading ? "계산 중..." : "검색"}
      </button>

      {/* 간편 선택지 */}
      <div className="mt-4 pt-4 border-t border-gray-300">
        <p className="text-xs text-gray-600 mb-2">빠른 선택:</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setLat("37.5665");
              setLng("126.9784");
              setTime("15");
              setMode("walking");
            }}
            className="text-xs bg-gray-100 hover:bg-gray-200 py-1 px-2 rounded transition-colors"
          >
            서울역 (도보 15분)
          </button>
          <button
            type="button"
            onClick={() => {
              setLat("37.4979");
              setLng("127.0276");
              setTime("30");
              setMode("driving");
            }}
            className="text-xs bg-gray-100 hover:bg-gray-200 py-1 px-2 rounded transition-colors"
          >
            강남역 (차량 30분)
          </button>
        </div>
      </div>
    </form>
  );
}
