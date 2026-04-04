import { sendToBackground } from "@plasmohq/messaging";
import { log } from "console";
import { useEffect, useState } from "react"

import TorrentConfig from "~assets/types/torrent_config";
import "~assets/css/popup.css"

function IndexPopup() {
  let [host, setHost] = useState("")
  const [save_path, setSavePath] = useState("")
  const [token, setToken] = useState("")
  const [login, setLogin] = useState("admin")
  const [password, setPassword] = useState("admin")
  const [err, setErr] = useState(null)
  const [token_form_valid, setTokenFormValid] = useState(false);


  useEffect(() => {
    async function loadSavedConfig() {
      const saved_config = await get_saved_torrent_config();

      if (saved_config) {
        setHost(saved_config.host);
        setSavePath(saved_config.save_path);
      }
    };

    loadSavedConfig();
  }, []);

  useEffect(() => {
    if (host == "" || !host || login == "" || !login || password == "" || !password) {
      setTokenFormValid(false)
    } else {
      setTokenFormValid(true)
    }

  }, [host, login, password]);

  const handleConfigSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const torrent_config = new TorrentConfig(
        host, save_path, token
      );

      console.log('Отправленные данные:', torrent_config);

      await chrome.storage.local.set({ torrent_config });

      setErr(null)
    } catch (e: Record<string, unknown>) {
      if (e.user_err) {
        setErr(e.message);
      }

      console.error(ERR_PREFIX, e);
    }
  };

  const handleTokenSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const url = `http://${host}/api/v2/auth/login?username=${login}&password=${password}`;
      console.log('--Token', host, login, password, url);
      await fetch(url, {
        method: 'POST'
      });

      chrome.cookies.get({ url, name: 'SID' }, function(cookie) {
        const token = cookie?.value;
        if (!token || token == "") {
          return setErr("Failed to get Qbittorrent token. Check correctnes of your host")
        }

        setToken(cookie?.value);
      });

      setLogin("");
      setPassword("");
    } catch (e: Record<string, unknown>) {
      if (e.user_err || e.message == "Failed to fetch") {
        setErr(e.message);
      }

      console.dir(ERR_PREFIX, e);
    }
  };

  return (
    <div className="container">
      <form onSubmit={handleConfigSubmit}>
        <div className="formTitle">Настройки торрент трекера</div>
        <input placeholder="Адрес хоста" onChange={(e) => setHost(e.target.value)} value={host} />
        <input placeholder="Путь к файлам на хосте" onChange={(e) => setSavePath(e.target.value)} value={save_path} />
        <input placeholder="Токен аутентификации" onChange={(e) => setToken(e.target.value)} value={token} />

        <button type="submit">save</button>
      </form>
      <div className="divider"></div>
      <form onSubmit={handleTokenSubmit} className={token_form_valid ? "token_form_valid" : "token_form_invalid"}>
        <div className="formTitle">Запросить токен</div>
        <input placeholder="Логин" onChange={(e) => setLogin(e.target.value)} value={login} />
        <input placeholder="Пароль" onChange={(e) => setPassword(e.target.value)} value={password} />

        <button type="submit">Get token</button>
      </form>

      {err && (
        <div className="error">
          {err}
        </div>
      )}
    </div>
  )
}

async function get_saved_torrent_config(): Promise<TorrentConfig | null> {

  let { torrent_config } = await chrome.storage.local.get(["torrent_config"]);

  if (!torrent_config || Object.keys(torrent_config).length === 0) {
    return null
  }
  return torrent_config;
}

export default IndexPopup
