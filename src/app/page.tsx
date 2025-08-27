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

    try {
      const res = await fetch(`/api?keyword=${encodeURIComponent(keyword)}`);

      const data = await res.json();
      //  {"related":["봉지욱","봉지욱 기자","봉지욱 프로필","뉴스타파 봉지욱"]}
      alert(`프론트에서데이어 왁인 ${JSON.stringify(data)}`);
      if (data.error) {
        setError(data.error);
      } else {
        setResults(data.related || []);
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
      {error && <p className="text-red-500">{error}</p>}

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
