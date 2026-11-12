// 由「入口」找到／手動設定本場直播後自動覆寫。OBS 子頁會定期讀取。
// 請勿手改成語法錯誤；清除本場直播時會寫回空的 videoId。
window.__MY_OBS_YT_LIVE__ = {
  videoId: null,
  channelId: "",
  title: "",
  ts: 0
};
