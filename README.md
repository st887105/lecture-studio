# 車城國小｜簡報與你，同一個畫面Meet視訊分享

車城國小資訊老師製作

正式網站：https://st887105.github.io/lecture-studio/

## 三種講課方式

1. **直接操作網站**：貼入 https 教材網址，按「開啟互動網站講課」。原網站允許嵌入時，可以直接點連結、捲動與換頁，講師人物疊在同一分頁。Meet 請分享「車城國小｜互動網站講課」。若網站拒絕嵌入，瀏覽器安全限制無法由本工具解除，請改用方式 3。
2. **PDF／圖片**：匯入 PDF 或多張圖片，可在工作室、輸出頁直接點畫面左右半邊，或用方向鍵／按鈕換頁。PowerPoint 可先匯出 PDF。Meet 請分享「車城國小｜分享輸出」。
3. **原分頁／獨立 PowerPoint**：擷取原教材分頁，開啟「浮動監看」，再回教材操作。支援 Document Picture-in-Picture 的桌面 Chrome／Edge 可置頂監看；其他瀏覽器使用並排視窗。預設拒絕應用程式視窗；獨立 PowerPoint 視窗需勾選進階選項，不可選含有本站的 Chrome／Edge 視窗。

## 本人漫畫化

使用本人鏡頭的影像輪廓與色彩，做本機柔化、色階與邊緣漫畫化；AI 協助臉部定位。保留五官、髮型與眼鏡，強度可調。這不是生成式手繪人物；尚未開鏡頭時顯示示範人物。鏡頭影像不由本站上傳。

## 防鏡射與全螢幕

本站拒絕擷取整個螢幕，並在瀏覽器支援 Capture Handle 時識別及阻擋本站分頁。進階視窗擷取仍須人工選獨立應用程式，無法保證辨識所有瀏覽器不提供識別的來源。

輸出頁提供「全螢幕」與 F 快捷鍵，需使用者在該頁點擊；F11 也能隱藏瀏覽器工具列。完整構圖會依螢幕比例留邊；填滿裁切會裁掉部分教材。控制列會自動隱藏，互動網站頁可按右上角「設定」再顯示。

## 聲音測試

開啟本機收音測試後可看音量、試錄 3 秒再播放。只有按下試錄時才在本機錄音。這只能證明本機收音，不能證明 Meet 已送達。

實際講話請使用 Meet 麥克風，在 Meet 選同一支裝置。請用第二裝置加入會議、關閉第二裝置麥克風並戴耳機確認，或請學員確認，再勾選人工確認。本站不把麥克風另行送入輸出，避免重複收音；教材音訊尚未轉送。

## 部署與資料

純靜態網站，GitHub Pages 使用 main 分支 /(root)，包含 .nojekyll，不需後端或 API key。PDF.js、MediaPipe 模型與程式首次由 jsDelivr／Google Storage 載入，字型使用 Google Fonts。教材、鏡頭、錄音不由本程式上傳，Meet 分享則由 Meet 傳送。

## 驗證範圍

已通過程式檢查、防鏡射來源判斷、人物像素處理、換頁／暫停、網址驗證與音訊清理檢查。本機瀏覽器已實測兩頁 PDF 匯入與換頁，以及互動網站連結導航；也確認禁止嵌入的目的網站會被瀏覽器阻擋。攝影機實際相似程度、麥克風回放、置頂支援及 Meet 學員端收看／收音請在上課裝置再測一次。

## 官方技術依據

- https://developer.chrome.com/docs/web-platform/document-picture-in-picture
- https://developer.chrome.com/docs/web-platform/capture-handle
- https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia
- https://mozilla.github.io/pdf.js/examples/
- https://support.google.com/meet/answer/9308856?hl=zh-Hant
