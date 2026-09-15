# 文章 2D 圖解

自 2026-09-16 起，文章內的 3D 模型與立體圖卡改為平面 SVG，正文照片與既有文章封面不變。

- `scripts/medical-diagrams.mjs` 讀取既有 `src/data/medical-visuals.json` 的 52 篇主題與文字附註，產生 `public/medical-2d/`。
- 每篇輸出一般圖及 `-notes.svg` 附註下載版；另有 `inline/` 的 12 張內文圖。
- `MedicalVisual.astro` 顯示 2D 圖與三項可選取的 HTML 附註；手機以單欄排列。
- `medical-visuals.astro` 為 2D 索引，不再載入模型、提供 GLB 或影片下載。
- 原始 3D 資料留存以便追溯，不再由文章引用。獨立的 `/ultrasound-atlas/` 舊圖庫未在本次文章修改範圍內。
- 原圖解尚待醫師審閱的狀態維持不變。參考資料沿用原主題來源，未加入治療劑量或操作步驟。

重新生成：`node scripts/medical-diagrams.mjs`

一致性檢查：`node scripts/medical-diagrams.mjs --check`

GitHub workflow 只驗證 2D 輸出與網站建置，不再執行舊 3D 產圖或自動覆寫文章。
