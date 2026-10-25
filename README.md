# 映講 Studio

把簡報、攝影機或 AI 似顏繪合成到同一個畫面，在 Google Meet 分享獨立輸出分頁。

這是可直接部署至 **GitHub Pages** 的純靜態版本，不需要後端、API key 或 ChatGPT 登入。

## GitHub Pages 部署

1. 建立 GitHub 儲存庫（例如 `lecture-studio`）。免費方案可使用公開儲存庫。
2. 將此資料夾的**內容**上傳至儲存庫根目錄，讓 `index.html` 直接位於根目錄。不要再包一層資料夾。
3. 到 **Settings → Pages → Build and deployment**。
4. Source 選 **Deploy from a branch**，Branch 選 **main**，資料夾選 **/(root)**，按 **Save**。
5. 等待 Pages 部署成功，開啟該頁顯示的網站網址。專案網站通常是 `https://帳號.github.io/儲存庫名稱/`。

根目錄包含 `.nojekyll`，不需要安裝依賴或執行建置。所有程式和輸出分頁均使用相對路徑，支援 GitHub Pages 的儲存庫子路徑。

GitHub 官方部署說明：<https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site>

## 使用

1. 用桌面版 Chrome／Edge 開啟 HTTPS 網址。
2. 選擇簡報／PDF 所在視窗，或匯入投影片圖片。
3. 開啟攝影機、選擇真人或 AI 似顏繪，調整人物與版型。
4. 按「開啟分享輸出」，保留工作室與輸出分頁。
5. 進入 Meet，在「立即分享 → 分頁」選取「映講｜分享輸出」。

聲音使用 Meet 麥克風。本版本只合成影像，不轉送教材音訊。工作室預覽代表本機構圖；要確認學員收到的品質，請用第二裝置測試。

## AI 與隱私

- MediaPipe Face Landmarker 在瀏覽器端辨識臉部比例、眨眼、張嘴、微笑與頭部傾斜，驅動程式繪製的 2D 人物。
- 髮型、顏色及配件可手動調整；這不是生成式真人卡通轉繪，不保證與本人高度相似。
- 初次載入會從 jsDelivr／Google Storage 下載 AI 程式、WASM 和模型；字型使用 Google Fonts。
- 本程式不把攝影機影像、臉部追蹤結果或教材上傳至伺服器。您在 Meet 分享的內容由 Meet 傳送。
- 公開儲存庫與 GitHub Pages 會公開網站原始碼及介面；不會因此公開訪客在自己電腦上選取的攝影機或教材。

## 限制與驗證

已檢查 JavaScript 語法、換頁、暫停／恢復、版型切換、Meet 連結驗證及乾淨輸出頁面。原版本已做線上介面測試；仍需在使用者裝置上測試攝影機、AI 真實推論、螢幕擷取與 Meet 接收。

網站會另開 Meet，需手動加入及選取分享來源。本網站不提供系統虛擬攝影機。瀏覽器背景節流、裝置效能或企業政策可能影響使用；請保留工作室與輸出視窗，正式研習前先完整測試。

完整操作說明：[使用說明](使用說明.md)。

## 檔案

| 檔案 | 用途 |
| --- | --- |
| `index.html`、`style.css` | 工作室介面 |
| `app.js` | 教材擷取、攝影機、構圖與設定 |
| `face-worker.js` | 瀏覽器端 AI 臉部追蹤 |
| `output.html`、`output.js` | 可在 Meet 分享的純輸出 |
| `.nojekyll` | 告知 Pages 直接發布靜態檔案 |

需要本機測試時可在此資料夾執行 `python -m http.server 4173`，再開啟 `http://localhost:4173`。請勿直接雙擊 HTML 使用攝影機或 AI 功能。
