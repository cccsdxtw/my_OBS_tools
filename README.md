# 拉基的OBS工具箱

OBS 統合工具：觀看人數、已開台時間、日期／時間、國旗、倒計時。

預設免 Twitch OAuth，不用再把會過期的 Access Token 塞進網址重驗證。

資訊條／倒計時／人數／聊天室是**獨立網址**，OBS 可分開放多個瀏覽器來源。

## 功能

- **人數**：獨立頁 `viewers.html`，同時支援 **Twitch + YouTube**（平台圖示＋人數；可自訂圖示網址）
- **開台時間**：Twitch 公開實況資料（GQL，失敗改 DecAPI）
- **時鐘**：日期、時間可開關；星期為中文（週一／星期一）
- **國旗**：用國旗代表時區／地區（例如 `flag=tw`）
- **倒計時**：獨立頁 `countdown.html`（目標時間，或從現在起 N 分鐘）
- **聊天室**：獨立頁 `chat.html`（Twitch 匿名 IRC＋YouTube live chat；合併／分欄、方向、存活秒數、來源標籤、自訂 CSS）
- **設定頁**：`index.html` 最上方填共用帳號，再分別複製各來源網址；支援黑夜模式

## 使用

1. 開 `index.html`（或 GitHub Pages：`https://cccsdxtw.github.io/my_OBS_tools/`）
2. 最上方填 Twitch／YouTube 帳號與 API Key；再調各橫列樣式
3. OBS 加「瀏覽器」來源（可分開放）：
   - 資訊條 `overlay.html`（建議寬 700–900、高 40–60）
   - 倒計時 `countdown.html`（建議寬 220–360、高 40–60）
   - 觀眾人數 `viewers.html`（建議寬 220–420、高 40–60）
   - 聊天室 `chat.html`（建議寬 360–480、高 500–720）

也可從 [Releases](https://github.com/cccsdxtw/my_OBS_tools/releases) 下載打包檔，解壓後用瀏覽器開 `index.html`。

## YouTube API Key

設定頁最上方「Twitch／YouTube 帳號」區塊已有步驟與跳轉按鈕：

1. 開 Cloud Console  
2. 啟用 YouTube Data API v3  
3. 建立／複製 API Key  

金鑰申請一次即可。可填 `@handle`／`UC…` 自動找 live，或直接填直播影片 ID。

## 版號

見 GitHub Releases（目前最新例如 v0.1.21）。

版號會**跳過含「4」的數字**（例如沒有 v0.1.4、v0.1.14；4 之後接 5，13 之後接 15）。
