# 拉基的OBS工具箱

OBS 統合工具：觀看人數、已開台時間、日期／時間、國旗、倒計時、遊戲名稱。

預設免 Twitch OAuth，不用再把會過期的 Access Token 塞進網址重驗證。

資訊條／倒計時／人數／遊戲名稱／聊天室是**獨立網址**，OBS 可分開放多個瀏覽器來源。

## 目錄

```
入口.html          ← 設定頁（請開這個）
index.html         ← 自動轉到入口
子頁/              ← OBS 覆蓋頁（overlay／viewers／countdown／game／chat…）
圖片/              ← 自訂圖示、封面圖
資料/帳號.txt      ← Twitch／YouTube 帳號與 API Key
fonts/             ← Material 圖示本機備援字型
material-icons.js  ← Google Fonts 優先、失敗改本機字型
```

## 功能

- **人數**：`子頁/viewers.html`，同時支援 **Twitch + YouTube**（平台圖示＋人數；可自訂圖示）
- **開台時間**：Twitch 公開實況資料（GQL，失敗改 DecAPI）
- **時鐘**：日期、時間可開關；星期為中文（週一／星期一）
- **國旗**：用國旗代表時區／地區（例如 `flag=tw`）
- **左右順序**：資訊條模組、觀眾人數 TW／YT 一律用 ↑↓（列表上＝左邊）
- **圖示**：可貼 Google Material Symbol 名稱（如 `Timer`），優先 Google Fonts、失敗用內建字型；也可貼 `圖片/xxx.png` 或網址
- **圖示色**：入口頁可選 Material 圖示顏色（貼圖片則不套用）
- **倒計時**：`子頁/countdown.html`
- **遊戲名稱**：`子頁/game.html`（格式「遊戲名稱： 平台 - 遊戲名」）
- **聊天室**：`子頁/chat.html`
- **回覆**：建議用 [Restream Chat](https://chat.restream.io/)；備選 `子頁/chat-reply.html`
- **帳號**：存 localStorage，並可同步到 `資料/帳號.txt`（換機帶這份檔；入口開頁會讀入）

## 使用

1. 開 `入口.html`（或 GitHub Pages：`https://cccsdxtw.github.io/my_OBS_tools/`）
2. 編輯 `資料/帳號.txt`，或在入口最上方填 Twitch／YouTube／API Key
3. 自訂圖放到 `圖片/`，圖示欄可貼例如 `圖片/twitch.png`
4. OBS 加「瀏覽器」來源（入口頁右側會給完整網址）：
   - 資訊條 `子頁/overlay.html`
   - 倒計時 `子頁/countdown.html`
   - 觀眾人數 `子頁/viewers.html`
   - 遊戲名稱 `子頁/game.html`
   - 聊天室 `子頁/chat.html`

也可從 [Releases](https://github.com/cccsdxtw/my_OBS_tools/releases) 下載打包檔，解壓後開 `入口.html`。

## 跟 Restream 怎麼搭配

- **推流／回覆**：繼續用 Restream（或 Restream Chat）
- **OBS 覆蓋**：用本工具的人數／時鐘／倒計時／遊戲名稱／聊天室顯示頁

## YouTube API Key

入口頁最上方「Twitch／YouTube 帳號」區塊已有步驟與跳轉按鈕；也可寫在 `資料/帳號.txt` 的 `YouTube_API_Key=`。

## 版號

見 GitHub Releases（目前最新例如 v1.1.5）。

版號會**跳過含「4」的數字**（例如沒有 v0.1.4、v0.1.14；4 之後接 5，13 之後接 15）。
