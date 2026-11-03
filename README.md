# 拉基的OBS工具箱

OBS 統合工具：觀看人數、已開台時間、日期／時間、國旗、倒計時。

預設免 Twitch OAuth，不用再把會過期的 Access Token 塞進網址重驗證。

資訊條／倒計時／人數／聊天室是**獨立網址**，OBS 可分開放多個瀏覽器來源。

## 功能

- **人數**：獨立頁 `viewers.html`，同時支援 **Twitch + YouTube**（平台圖示＋人數；可自訂圖示網址）
- **開台時間**：Twitch 公開實況資料（GQL，失敗改 DecAPI）
- **時鐘**：日期、時間可開關；星期為中文（週一／星期一）
- **國旗**：用國旗代表時區／地區（例如 `flag=tw`）
- **左右順序**：資訊條模組、觀眾人數 TW／YT 一律用 ↑↓（列表上＝左邊）
- **圖示**：可貼 Google Material Symbol 名稱（如 `Timer`），自動載入 Google Fonts；也可貼圖片網址
- **倒計時**：獨立頁 `countdown.html`（目標時間，或從現在起 N 分鐘）
- **聊天室**：獨立頁 `chat.html`（合併＝一頁；分開＝TW／YT 各一頁兩個 OBS 來源；存活秒數、方向、自訂 CSS、來源標籤）
- **回覆**：建議用 [Restream Chat](https://chat.restream.io/)（授權由 Restream 維持、可一次回兩邊）；備選本機 `chat-reply.html`（自貼 token，會過期）
- **設定頁**：最上方填共用帳號與預設字級／文字色；各橫列可覆寫（空白＝用預設）；支援黑夜模式

## 使用

1. 開 `index.html`（或 GitHub Pages：`https://cccsdxtw.github.io/my_OBS_tools/`）
2. 最上方填 Twitch／YouTube 帳號與 API Key；再調各橫列樣式
3. OBS 加「瀏覽器」來源（可分開放）：
   - 資訊條 `overlay.html`（建議寬 700–900、高 40–60）
   - 倒計時 `countdown.html`（建議寬 220–360、高 40–60）
   - 觀眾人數 `viewers.html`（建議寬 220–420、高 40–60）
   - 聊天室 `chat.html`（建議寬 360–480、高 500–720）
   - 回覆：優先開 Restream Chat；或備選 `chat-reply.html`（都不要丟 OBS）

也可從 [Releases](https://github.com/cccsdxtw/my_OBS_tools/releases) 下載打包檔，解壓後用瀏覽器開 `index.html`。

## 跟 Restream 怎麼搭配

- **推流／回覆**：繼續用 Restream（或 Restream Chat），連過的 Twitch／YouTube 不用在本工具重授權。
- **OBS 覆蓋**：用本工具的人數／時鐘／倒計時／聊天室顯示頁（免把會過期的 token 塞進 OBS 網址）。
- 也就是：Restream 負責「講」、本工具負責「給觀眾看的條」。



## YouTube API Key

設定頁最上方「Twitch／YouTube 帳號」區塊已有步驟與跳轉按鈕：

1. 開 Cloud Console  
2. 啟用 YouTube Data API v3  
3. 建立／複製 API Key  

金鑰申請一次即可。可填 `@handle`／`UC…` 自動找 live，或直接填直播影片 ID。

## 版號

見 GitHub Releases（目前最新例如 v0.1.33）。

版號會**跳過含「4」的數字**（例如沒有 v0.1.4、v0.1.14；4 之後接 5，13 之後接 15）。
