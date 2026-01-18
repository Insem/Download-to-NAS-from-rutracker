import type TorrentConfig from "~assets/types/popup";

export { }

chrome.storage.local.get(["torrent_config"]).then(
  (result) => {
    console.log(
      "--Extension", result);
  }
);
