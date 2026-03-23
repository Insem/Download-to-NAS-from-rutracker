import { sendToBackground } from "@plasmohq/messaging";
import { FC } from "react";
import { createRoot } from "react-dom/client";

import type TorrentConfig from "~assets/types/popup";

const DirectDownloadLink: FC<{ magnet_link: string, torrent_config: TorrentConfig }> = ({ magnet_link, torrent_config }) => {

  const handleClick = async () => {
    // console.log("Magnet URL:", magnet_link, torrent_config);
    const { host, token } = torrent_config;

    const result = await sendToBackground({
      name: "http",
      body: {
        url: `http://${host}/api/v2/torrents/add`,
        options: {
          isFormData: true,
          method: 'POST',
          body: [{ field: 'urls', data: magnet_link }],
          headers: {
            'Cookie': token,
          }
        }
      }
    });

    // console.log("--RESULT", result);

  };

  return <button style={{
    backgroundColor: "rgb(233, 233, 230)",
    width: "100%",
    margin: "20px auto",
    textAlign: "center",
    border: "1px solid #c3cbd1",
    fontSize: "30px"
  }} onClick={handleClick} > Скачать </button>
}

// console.log("--DOMAIN", window.location.hostname);

export const getRootContainer = () =>
  new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      const magnet_link_tag = document.getElementsByClassName("med magnet-link")[0];
      const magnet_link = magnet_link_tag.href;

      const container = document.createElement("div");
      container.style.width = '95%';
      container.style.margin = '20px auto';
      container.style.textAlign = 'center';

      const rootContainer = document.querySelector('.post_wrap .attach.bordered.med').insertAdjacentElement('afterend', container);
      if (rootContainer) {
        clearInterval(checkInterval)
        resolve({ rootContainer, magnet_link })
      }
    }, 137)
  })

export const render = async ({
  createRootContainer
}) => {
  const { rootContainer, magnet_link } = await createRootContainer()

  // console.log('--Root', rootContainer, magnet_link);

  const { torrent_config } = await chrome.storage.local.get(["torrent_config"]);
  const root = createRoot(rootContainer);

  root.render(<DirectDownloadLink magnet_link={magnet_link} torrent_config={torrent_config} />);

}

export default DirectDownloadLink
