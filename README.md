# 拉基的OBS工具箱

OBS 統合工具：觀看人數、已開台時間、日期／時間、國旗、倒計時、倒數天數、遊戲名稱、聊天室、贊助條、計數器、媒體播放。

預設免 Twitch OAuth，不用再把會過期的 Access Token 塞進網址重驗證。

資訊條／倒計時／倒數天數／人數／遊戲名稱／聊天室／贊助條／計數器是**獨立網址**，OBS 可分開放多個瀏覽器來源。

## 目錄

```
入口.html          ← 設定頁（請開這個）
index.html         ← 自動轉到入口
子頁/              ← OBS 覆蓋頁（overlay／viewers／countdown／game／chat…）
圖片/              ← 自訂圖示、底圖
資料/帳號.txt      ← Twitch／YouTube 帳號與 API Key
fonts/             ← Material 圖示本機備援字型
material-icons.js  ← Google Fonts 優先、失敗改本機字型
panel-bg.js        ← 各覆蓋頁共用底圖／顯示方式／外推
```

## 功能

- **人數**：`子頁/viewers.html`，同時支援 **Twitch + YouTube**（平台圖示＋人數；可自訂圖示）
- **開台時間**：Twitch 公開實況資料（GQL，失敗改 DecAPI）
- **時鐘**：日期、時間可開關；星期為中文（週一／星期一）
- **國旗**：用國旗代表時區／地區（例如 `flag=tw`）
- **左右順序**：資訊條模組、觀眾人數 TW／YT 一律用 ↑↓（列表上＝左邊）
- **圖示**：可貼 Google Material Symbol 名稱（如 `Timer`），優先 Google Fonts、失敗用內建字型；也可貼 `圖片/xxx.png` 或網址。各圖示可勾選顯示（勾了沒填＝預設，沒勾＝隱藏）
- **圖示色**：入口頁可選 Material 圖示顏色（貼圖片則不套用）
- **預設樣式**：最上方統一設字級／文字色／圖示色／底色／底圖／顯示方式／外推；各窗空白沿用
- **底圖**：各覆蓋窗可套底圖；顯示方式＝拉伸填滿／完整顯示／裁切填滿；可設外推避開圖框裝飾
- **底色／底圖折疊**：各項目與頂部預設的底色／底圖收成二階選項，可單獨展開／收合
- **倒計時**：`子頁/countdown.html`
- **倒數天數**：`子頁/days.html`（目標日期離今天還有幾天；圖示可選）
- **遊戲名稱**：`子頁/game.html`（格式「遊戲名稱： 平台 - 遊戲名」；可記住最近組合）
- **聊天室**：`子頁/chat.html`
  - TW + YT 合併或分開兩頁；可連動多台
  - 留言來源改平台圖示（預設同人數圖，可自訂圖與顏色）
  - 留言區底圖、每一則留言底（底圖／底色）、外推、顯示方式
  - 可命名儲存／套用樣式預設（一併進備份）
- **贊助條**：`子頁/sponsor.html`（Twitch 小奇點 IRC＋YouTube 超留）
  - 可設時段／時長、TW+YT 合併目標
  - 多基金關鍵字路由（較長優先、一筆只進一基金）
  - 手動補登可多筆確認加入
- **計數器**：`子頁/counter.html`（可多組；可勾台主／槌子／劍／VIP／粉絲）
  - 有指令名：`!死`＝+1，也可 `!死+2`／`!死-1`／`!死=3`；無指令名用 `!+1`
  - 預設一組「死亡／死」；每組獨立 OBS 網址與本機數字
  - 入口展示與 OBS 正式數字分開（展示不寫入正式）
- **媒體播放**：`子頁/media.html`（影片／YouTube／網站清單）
  - 一行一個網址或本機路徑；模式＝循環／順序／隨機
  - 網站與 YouTube 用停留秒數切下一則；清單可寫入 `資料/media-playlist.js`
- **贊助條／計數器預覽**：示範模式與正式 localStorage 隔離
- **升級**：入口「覆蓋並重開」一次寫齊（含 `panel-bg.js`、計數器）；選對資料夾後會記住，開頁不再誤報缺檔
- **回覆**：建議用 [Restream Chat](https://chat.restream.io/)；備選 `子頁/chat-reply.html`
- **帳號**：存 localStorage，並可同步到 `資料/帳號.txt`（換機帶這份檔；入口開頁會讀入）
- **備份／還原**：完整設定 JSON（含樣式預設、遊戲紀錄等）

## 使用

1. 開 `入口.html`（或 GitHub Pages：`https://cccsdxtw.github.io/my_OBS_tools/`）
2. 編輯 `資料/帳號.txt`，或在入口最上方填 Twitch／YouTube／API Key
3. 自訂圖放到 `圖片/`，圖示／底圖欄可貼例如 `圖片/twitch.png`
4. 先調最上方「預設樣式／底圖」，再於各橫列微調
5. OBS 加「瀏覽器」來源（入口頁右側會給完整網址）：
   - 資訊條 `子頁/overlay.html`
   - 倒計時 `子頁/countdown.html`
   - 倒數天數 `子頁/days.html`
   - 觀看人數 `子頁/viewers.html`
   - 遊戲名稱 `子頁/game.html`
   - 聊天室 `子頁/chat.html`
   - 贊助條 `子頁/sponsor.html`（TW 小奇點／YT 超留）
   - 計數器 `子頁/counter.html`（MOD／台主留言 +N／=N）
   - 媒體播放 `子頁/media.html`（清單依序／循環／隨機）

也可從 [Releases](https://github.com/cccsdxtw/my_OBS_tools/releases) 下載打包檔，解壓後開 `入口.html`。

## 跟 Restream 怎麼搭配

- **推流／回覆**：繼續用 Restream（或 Restream Chat）
- **OBS 覆蓋**：用本工具的人數／時鐘／倒計時／遊戲名稱／聊天室顯示頁

## YouTube API Key

入口頁最上方「共用設定」區塊已有步驟與跳轉按鈕；也可寫在 `資料/帳號.txt` 的 `YouTube_API_Key=`。

## 版號

見 GitHub Releases（目前最新例如 v1.5.12）。

版號會**跳過含「4」的數字**（例如沒有 v0.1.4、v0.1.14；4 之後接 5，13 之後接 15）。
