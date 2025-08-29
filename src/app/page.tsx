"use client";

import { useState } from "react";

export default function Home() {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!keyword.trim()) return;
    setLoading(true);
    setError("");
    setResults([]);
    /**
     * fetch()가 주는 Response 객체의 특성
     * res.json()은 내부적으로 JON.parse를 해주기 때문에, 다시 JSON.parse 할 필요가 없어요
     */

    try {
      const res = await fetch(`/api?keyword=${encodeURIComponent(keyword)}`);

      const data = await res.json(); // ✅ 여기서 route.ts 의 JSON 응답을 받음
      /**
       * 프론트에서데이어 확인
       * {"keyword":"장마",
       * "related":["장마기간","장마","장만옥","장마 끝"...]}
       */
      alert(data); // [object Object]
      
      // 파싱 된거를 다시 JSON.stringify로 문자열화
      alert(`프론트에서데이어 확인 ${JSON.stringify(data)}`);

      if (data.error) {
        setError(data.error);
      } else {
        if (data.keyword === keyword) {
          alert(`${data.keyword} is already exists: `);
        } else {
          setResults(data.related || []);

        }
      }
    } catch (err: any) {
      setError("검색 중 오류 발생");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-8 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">네이버 연관검색어</h1>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="검색어 입력"
          className="border px-3 py-2 rounded-md w-64"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
        />
        <button
          onClick={handleSearch}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        >
          검색
        </button>
      </div>

      {loading && <p>불러오는 중...</p>}
      {error && <p className="text-red-300">{error}</p>}

      <ul className="bg-white shadow-md rounded-md p-4 w-96">
        {results.map((r, i) => (
          <li key={i} className="border-b py-2 last:border-none">
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}
