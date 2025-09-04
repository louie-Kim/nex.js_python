// 이 API 라우트는 Edge 말고 Node 환경에서 실행시켜!
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";
import { crawlRelatedKeywords } from "@/crawl";



// -------- API 요청 처리 --------
export async function GET(req: NextRequest): Promise<Response> {
  // 1. 키워드를 받고
  const keyword = req.nextUrl.searchParams.get("keyword") || "";
  console.log("Received keyword::::::::::::::", keyword);

  if (!keyword.trim()) {
    return NextResponse.json(
      { error: "검색어가 비어있습니다." },
      { status: 400 }
    );
  }

  // 2. 중복키워드 Prisma DB에서 확인
  let existing: any = null;

  try {
    // ✅ Prisma DB에서 해당 키워드 존재 여부 확인
    existing = await prisma.keyword.findUnique({
      where: { keyword },
    });

    console.log(
      `DB에서 찾은 existing data >>>>>>>>>>: ${JSON.stringify(existing)}`
    );

    // ✅ 배열에서 중복키워드 객체 발견
    const found = existing;
    console.log(
      `Found existing keyword >>>>>>>>>>>>>: ${JSON.stringify(found)}`
    );

    // 중복 키워드 발견시..
    if (found) {
      // 객체 하나만 반환
      // return NextResponse.json(found); // ← 이제 항상 객체
      // ✅ 중복 키워드면 에러 메시지 + 기존 데이터 반환
      return NextResponse.json({
        error: `"${keyword}"는 이미 저장된 키워드입니다!!!.`,
        ...found, // { keyword: "...", related: [...] }
      });
    }
  } catch (err) {
    console.error("DB 조회 오류:", err);
    existing = null;
  }

  try {
    // 3. 중복 없으면 Puppeteer 스크립트 실행
    const related = await crawlRelatedKeywords(keyword);
    const data = { keyword, related };

    if (data.related.length === 0) {
      return NextResponse.json(data, { status: 400 });
    }

    // ✅ DB 저장 (최초 검색 시만)
    await prisma.keyword.create({
      data: {
        keyword: data.keyword,
        related: data.related,
      },
    });

    // ✅ 다시 JSON 형태로 보냄
    return NextResponse.json(data);
  } catch (err: unknown) {
    let detail = "알 수 없는 오류";
    // err가 객체인지 확인한 다음, "message"라는 속성이 있는지 검사
    if (err && typeof err === "object" && "message" in err) {
      // 에러 메세지를 스트링타입으로 바꿔서 detail에
      detail = String((err as any).message);
    } else if (typeof err === "string") {
      detail = err;
    }

    return NextResponse.json(
      { error: "크롤링 실행/DB 오류", detail },
      { status: 500 }
    );
  }
}
// const frequentKeywords = ["비트코인", "이더리움", "삼성전자"];
// -------- Cron Job (서버 실행 시 등록) --------
// 1분마다 frequentKeywords 자동 크롤링
// cron.schedule("*/1 * * * *", async () => {
//   console.log("⏰ 1분마다 인기 키워드 크롤링 실행");

//   for (const keyword of frequentKeywords) {
//     try {
//       const data: any = await runPython(keyword);

//       if (!data.error) {
//         await prisma.keyword.upsert({
//           where: { keyword: data.keyword },
//           update: { related: data.related },
//           create: { keyword: data.keyword, related: data.related },
//         });
//         console.log("DB 저장 완료:", data.keyword);
//       }
//     } catch (e) {
//       console.error("자동 크롤링 오류:", e);
//     }
//   }
// });
