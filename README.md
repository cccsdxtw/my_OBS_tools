# my_OBS_tools

OBS 用的統合瀏覽器來源：**觀看人數 / 已開台時間 / 日期時間時區 / 倒計時**。

預設**不需要 Twitch OAuth**，不用再把 `clientID`、`accessToken` 塞進網址、過期又重驗證。

## 快速使用

1. 打開設定頁：`index.html`（GitHub Pages 啟用後為 `https://cccsdxtw.github.io/my_OBS_tools/`）
2. 填頻道、勾要顯示的項目、設倒計時（可選）
3. 複製產生的網址，在 OBS 加「瀏覽器」來源貼上  
   - 建議寬度 `700–900`、高度 `40–60`

實際顯示頁：`overlay.html`

## 跟舊工具的對應

| 以前 | 現在 |
| --- | --- |
| [livestats2](https://github.com/StinkingBanana/StinkingBanana.github.io/tree/main/livestats2) 日期／時區／開台時間 | `overlay.html` 內建（免 token） |
| Streamlabs Viewer Count widget | 改由公開實況資料抓人數；Streamlabs widget 可另開一個瀏覽器來源並行 |
| OBS 裡手寫的倒計時 | 設定頁勾「倒計時」，填目標時間或「從現在起 N 分鐘」 |

## 為什麼比較不用驗證

舊 livestats2 走 Twitch User Access Token（網址參數），過期就會 `401 Invalid OAuth token`。

這裡預設：

1. **Twitch 公開 GQL**（讀公開的 `viewersCount` / `createdAt`）
2. 失敗則改 **DecAPI**（`viewercount` / `uptime`）

日常開台不必重新授權。若 Twitch 公開介面有變，設定頁可改人數來源為 `DecAPI only`。

## Overlay 常用參數

| 參數 | 說明 |
| --- | --- |
| `login` | Twitch 頻道 login |
| `vc` / `st` / `date` / `time` / `showTz` / `cd` | `1` 顯示、`0` 隱藏 |
| `tz` | 時區，例如 `Asia/Taipei` |
| `dateFormat` / `timeFormat` | `YYYY YY MM DD HH mm ss ddd Z` |
| `countdown` | 倒計時目標（ISO 時間） |
| `cdMins` | 從載入當下起算的分鐘數 |
| `cdLabel` | 倒計時前方標籤 |
| `viewersSource` | `auto`（預設）或 `decapi` |
| `fontSize` / `color` / `bg` | 外觀 |

範例：

```text
overlay.html?login=你的頻道&vc=1&st=1&date=1&time=1&showTz=1&tz=Asia/Taipei&cd=1&cdMins=10&cdLabel=START
```

## Streamlabs 人數 widget

若仍想用原本的 Streamlabs 網址，請在 OBS **另外**加一個瀏覽器來源，不要和本工具搶同一個來源。本工具已內建人數，一般可不再依賴 Streamlabs token。

## 啟用 GitHub Pages

Repo Settings → Pages → Source 選分支 `main`（或你合併後的預設分支）／根目錄 `/`。
