import { useEffect, useState } from "react"
import TorrentConfig from "~assets/types/popup";

function IndexPopup() {
  const [host, setHost] = useState("")
  const [save_path, setSavePath] = useState("")
  const [err, setErr] = useState("")

  useEffect(() => {
    console.log('--Saved conf 1');
    async function loadSavedConfig() {
      const saved_config = await get_saved_torrent_config();
      if (saved_config) {
        console.log('--Saved conf', saved_config);
        setHost(saved_config.host);
        setSavePath(saved_config.save_path);
      }
    };

    loadSavedConfig();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const torrent_config = new TorrentConfig(
        host, save_path
      );

      console.log('Отправленные данные:', torrent_config);

      await chrome.storage.local.set({ torrent_config });
    } catch (e: Record<string, unknown>) {
      if (e.user_err) {
        setErr(e.message);
      }

      console.error(e);
    }
  };

  return (
    <div
      style={{
        padding: 16
      }}>
      <h2>
        Welcome to your{" "}
        <a href="https://www.plasmo.com" target="_blank">
          Plasmo
        </a>{" "}
        Extension!
      </h2>
      <form onSubmit={handleSubmit}>
        <input placeholder="Default host" onChange={(e) => setHost(e.target.value)} value={host} />
        <input placeholder="Save file path" onChange={(e) => setSavePath(e.target.value)} value={save_path} />

        <button type="submit">save</button>
      </form>

      <h5>{host}</h5>
    </div>
  )
}

async function get_saved_torrent_config(): TorrentConfig | null {

  let torrent_config = await chrome.storage.local.get(["torrent_config"]);

  if (!torrent_config || Object.keys(torrent_config).length === 0) {
    return null
  }

  return torrent_config as TorrentConfig;
}

export default IndexPopup
