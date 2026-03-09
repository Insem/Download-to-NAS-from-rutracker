import { FC } from "react";
import { createRoot } from "react-dom/client";
import type TorrentConfig from "~assets/types/popup";

const DirectDownloadLink: FC<{ magnet_link: string, torrent_config: TorrentConfig }> = ({ magnet_link, torrent_config }) => {

  const handleClick = async () => {
    console.log("Magnet URL:", magnet_link, torrent_config);


  };

  return <div onClick={handleClick} > Скачать </div>
}

console.log("--DOMAIN", window.location.hostname);

export const getRootContainer = () =>
  new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      const magnet_link_tag = document.getElementsByClassName("med magnet-link")[0];
      const magnet_link = magnet_link_tag.href;
      const rootContainer = magnet_link_tag.parentElement

      if (rootContainer) {
        clearInterval(checkInterval)
        resolve({ rootContainer, magnet_link })
      }
    }, 137)
  })

export const render = async ({
  createRootContainer // This creates the default root container
}) => {
  const { rootContainer, magnet_link } = await createRootContainer()

  console.log('--Root', rootContainer, magnet_link);

  const { torrent_config } = await chrome.storage.local.get(["torrent_config"]);
  const root = createRoot(rootContainer);

  root.render(<DirectDownloadLink magnet_link={magnet_link} torrent_config={torrent_config} />);

}

export default DirectDownloadLink
