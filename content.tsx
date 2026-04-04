import { sendToBackground } from "@plasmohq/messaging";
import { FC } from "react";
import { createRoot } from "react-dom/client";

import type TorrentConfig from "~assets/types/torrent_config";

const DirectDownloadLink: FC<{ magnet_link: string, torrent_config: TorrentConfig }> = ({ magnet_link, torrent_config }) => {
  const handleClick = async () => {
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

  };

  return <button style={{
    backgroundColor: "rgb(233, 233, 230)",
    width: "100%",
    margin: "20px auto",
    textAlign: "center",
    border: "1px solid #c3cbd1",
    fontSize: "30px"
  }} onClick={handleClick} > Скачать на NAS </button>
}

export const getRootContainer = async () => {
  const magnet_link_tag = document.getElementsByClassName("med magnet-link")[0];
  const magnet_link = magnet_link_tag.href;

  const container = document.createElement("div");
  container.style.width = '95%';
  container.style.margin = '20px auto';
  container.style.textAlign = 'center';

  const _rootContainer = document.querySelector('.post_wrap .attach.bordered.med')
  if (!_rootContainer) {
    console.error(ERR_PREFIX, "Failed to get container for doenload button");
    return
  }
  const rootContainer = _rootContainer.insertAdjacentElement('afterend', container);

  return { rootContainer, magnet_link }
}

export const render = async ({
  createRootContainer
}) => {
  const { rootContainer, magnet_link } = await createRootContainer()

  const { torrent_config } = await chrome.storage.local.get(["torrent_config"]);
  const root = createRoot(rootContainer);

  root.render(<DirectDownloadLink magnet_link={magnet_link} torrent_config={torrent_config} />);

}

export default DirectDownloadLink
