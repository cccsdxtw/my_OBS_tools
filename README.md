# my_OBS_tools

OBS 統合瀏覽器來源：觀看人數、已開台時間、日期／時間／時區、倒計時。

預設免 Twitch OAuth，不用再把會過期的 Access Token 塞進網址重驗證。

## 功能

- **人數／開台時間**：公開實況資料（GQL，失敗改 DecAPI）
- **時鐘**：日期、時間可開關；星期為中文（週一／星期一）
- **國旗**：用國旗代表時區／地區（例如 `flag=tw`）
- **倒計時**：目標時間，或從現在起 N 分鐘
- **設定頁**：`index.html` 勾選項目後複製 OBS 網址

## 使用

1. 開 `index.html`（或 GitHub Pages：`https://cccsdxtw.github.io/my_OBS_tools/`）
2. 填頻道、勾顯示項目、設倒計時（可選）
3. 複製網址 → OBS「瀏覽器」來源（建議寬 700–900、高 40–60）

實際顯示頁：`overlay.html`

也可從 [Releases](https://github.com/cccsdxtw/my_OBS_tools/releases) 下載打包檔，解壓後用瀏覽器開 `index.html`。

## 版號

見 GitHub Releases（例如 v0.1.0）。
