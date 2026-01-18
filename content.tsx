
import { PlasmoCSConfig, PlasmoGetInlineAnchor } from "plasmo";

// (async () => {
//   const { torrent_config } = await chrome.storage.local.get(["torrent_config"]);
//
//   console.log("--TorrentConfig", torrent_config, magnet_link_tag);
//
//   if (magnet_link_tag) {
//     // magnet_link_tag.innerHTML = ''
//     const root = createRoot(magnet_link_tag);
//
//     root.render(<DirectlyDownloadLink />);
//   }
// })();

export const config: PlasmoCSConfig = {
  run_at: "document_end"
}
type MagnetButtonProps = {
  magnetUrl: string
  originalElement?: Element
}
export const getInlineAnchor: PlasmoGetInlineAnchor = async () => {
  // Find the first magnet link on the page
  const magnet_link_tag = document.getElementsByClassName("med magnet-link")[0];

  if (!magnet_link_tag) return null

  return {
    ttttt: "rgdfgfdf",
    element: magnet_link_tag.parentNode,
    props: {
      magnetUrl: magnet_link_tag.href,
      originalElement: magnet_link_tag
    }
  } as MagnetButtonProps
}

const DirectDownloadLink = (props: MagnetButtonProps) => {

  const handleClick = () => {
    console.log("Magnet URL:", props)
  };

  return <div onClick={ handleClick } > Скачать < /div>
}

export const getShadowHostId = () => "my-unique-magnet-replacer"

export default DirectDownloadLink
