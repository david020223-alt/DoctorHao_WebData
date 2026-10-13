# 閱讀統計

於 2026-10-13 啟用。沿用 Workers 與 SQLite Durable Objects，不建立 GA4 或第三方廣告追蹤。

## 指標定義

- 每次可見且有焦點的頁面載入算一次，不是使用者或 session 數。
- 有效停留：可見且有焦點；操作後 60 秒內累計，一小時封頂。切到背景不計。
- 正文深度：`.article__body .prose` 可視底緣的位置；每次載入取最大值。
- 閱讀投入：有效停留至少 30 秒，且正文深度至少 50%；不是理解或完讀的證明。
- 來源是每次頁面載入的 referrer 分類，不保存原始來源網址，不能視為首次獲客來源。
- 門診點擊包含門診頁、電話、文字包含掛號／預約的連結；延伸閱讀點擊包含文章頁上的其他文章／分類連結。並非掛號完成量。

## 儲存與存取

`VisitCounter` 類別的 `reading` 實例使用新資料表，原有 `website` 實例的計數不受影響。讀取報表須使用 `READING_REPORT_KEY` Worker secret。

- `reading_loads` 保存每次載入的隨機 ID 與累計快照，兩日後於下一次收集清除。請求最長僅接受 24 小時內開始的瀏覽。
- `reading_daily` 保存每日／頁面／來源彙總，保留約 180 日。
- 寫入使用交易與累計差值，支援重送與亂序，不重複計算瀏覽、門檻或點擊。
- 客戶端每 30 秒及隱藏／離開／點擊時回傳；網路、阻擋程式、DNT、停用、閒置計算會使結果低於既有計數器。
- 無 Cookie 或跨頁識別碼；不保存 IP、姓名、URL query 或完整 referrer。Cloudflare 本身的連線安全資料處理見其政策。

## 私人報表

從 website 執行 `node scripts/reading-report.mjs 30` 可查最近 30 日（1–180）。金鑰預設讀取專案外的工作區 `.tools/reading-report-key.txt`，也可用 `READING_REPORT_KEY_FILE` 指定檔案。

輸出至工作區 `output/網站閱讀統計.html` 及 `output/reading-statistics.json`。報表不含金鑰。工作區根目錄另有「更新閱讀報表.cmd」，可雙擊更新並開啟。

請勿將金鑰、私人報表、測試資料目錄提交至公開 GitHub；金鑰遺失時應重新設定 Worker secret 及本機檔案。請勿把網站正式資料用於自動測試。

## 驗證

以 Wrangler 本機模式在 port 8790 啟動，使用新的 `--persist-to` 測試目錄與 `--var READING_REPORT_KEY:local-test-only`，再執行 `node scripts/test-reading.mjs`。

測試包含私人 API 存取、跨來源阻擋、資料上限、爬蟲排除、去重與乱序、既有计數器獨立，以及前端背景／閒置／恢復、DNT、停用和正文深度。使用 fresh persistence，避免上一輪測試資料影響断言。
