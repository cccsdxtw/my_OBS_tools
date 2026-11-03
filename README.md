# my_OBS_tools

OBS 統合工具：觀看人數、已開台時間、日期／時間、國旗、倒計時。

預設免 Twitch OAuth，不用再把會過期的 Access Token 塞進網址重驗證。

資訊條／倒計時／人數是**獨立網址**，OBS 可分開放多個瀏覽器來源。

## 功能

- **人數**：獨立頁 `viewers.html`（也可勾選黏在資訊條）；支援免驗證或 Streamlabs widget
- **開台時間**：公開實況資料（GQL，失敗改 DecAPI）
- **時鐘**：日期、時間可開關；星期為中文（週一／星期一）
- **國旗**：用國旗代表時區／地區（例如 `flag=tw`）
- **倒計時**：獨立頁 `countdown.html`（目標時間，或從現在起 N 分鐘）
- **設定頁**：`index.html` 分別複製各來源網址

## 使用

1. 開 `index.html`（或 GitHub Pages：`https://cccsdxtw.github.io/my_OBS_tools/`）
2. 填頻道、勾資訊條項目；另設倒計時
3. OBS 加「瀏覽器」來源（可分開放）：
   - 資訊條 `overlay.html`（建議寬 700–900、高 40–60）
   - 倒計時 `countdown.html`（建議寬 220–360、高 40–60）
   - 觀眾人數 `viewers.html`（建議寬 120–220、高 40–60）

也可從 [Releases](https://github.com/cccsdxtw/my_OBS_tools/releases) 下載打包檔，解壓後用瀏覽器開 `index.html`。

## 版號

見 GitHub Releases（例如 v0.1.0）。
