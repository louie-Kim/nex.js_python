// # # render.com에서 파이썬 제공안함 -> Puppeteer로 교체

// # from selenium import webdriver
// # from selenium.webdriver.common.by import By
// # from selenium.webdriver.chrome.options import Options
// # from selenium.webdriver.support.ui import WebDriverWait
// # from selenium.webdriver.support import expected_conditions as EC
// # import json
// # import os
// # import sys
// # import time
// # import logging

// # logging.basicConfig(
// #     level=logging.INFO,  # 출력할 로그 레벨 (DEBUG < INFO < WARNING < ERROR < CRITICAL)
// #     format="%(asctime)s - %(levelname)s - %(message)s",
// #     filename="app.log",  # 로그를 저장할 파일 (생략하면 콘솔에만 출력)
// #     filemode="a",  # "a" = append (추가 기록), "w" = 덮어쓰기
// #     encoding="utf-8",  # 한글 로그 깨짐 방지
// # )

// # def crawl_related_keywords(keyword: str):
// #     options = Options()
// #     options.add_argument("--window-size=800,600")
// #     options.add_experimental_option("detach", True)
// #     options.add_argument("--headless=new")
// #     options.add_argument("--no-sandbox")
// #     options.add_argument("--disable-dev-shm-usage")

// #     driver = webdriver.Chrome(options=options)
// #     wait = WebDriverWait(driver, 10)

// #     related_keywords = []

// #     try:
// #         driver.get("https://www.naver.com")

// #         query = wait.until(EC.presence_of_element_located((By.ID, "query")))
// #         query.send_keys(keyword)
// #         time.sleep(2)

// #         container_sel = "#atcmp_keyword ul.kwd_lst"
// #         wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, container_sel)))
// #         time.sleep(2)

// #         keyword_sel = "#atcmp_keyword ul.kwd_lst li a.kwd span.kwd_txt"
// #         wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, keyword_sel)))

// #         # driver.find_elements() 여러 개의 요소가져옴 => items 은 리스트
// #         # strip()은 문자열 양쪽 공백을 제거
// #         items = driver.find_elements(By.CSS_SELECTOR, keyword_sel)
// #         related_keywords = [item.text.strip() for item in items if item.text.strip()]

// #         # JSON 누적 저장 (삭제됨)

// #     finally:
// #         driver.quit()

// #     return related_keywords  # list[str] 반환

// # # 여기서 stdout으로 JSON을 내보냄 :
// # if __name__ == "__main__":

// #     logging.info("crawl.py가 직접 실행되었습니다>>>>>>>>>.")
// #     logging.info(f"sys.argv 전체>>>>>>>>>>>>>>>>>>: {sys.argv}")

// #     if len(sys.argv) < 2:
// #         print(json.dumps({"error": "Usage: python crawl.py <keyword>"}))
// #     else:
// #         keyword = sys.argv[1]
// #         result = crawl_related_keywords(keyword)
// #         # ✅ 여기서 JSON으로 전달 : 객체
// #         print(json.dumps({"keyword": keyword, "related": result}, ensure_ascii=False, indent=2))

