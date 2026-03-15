import { sendToBackground } from "@plasmohq/messaging";
import { log } from "console";
import { useEffect, useState } from "react"
import TorrentConfig from "~assets/types/popup";

function IndexPopup() {
  let [host, setHost] = useState("")
  const [save_path, setSavePath] = useState("")
  const [token, setToken] = useState("")
  const [login, setLogin] = useState("admin")
  const [password, setPassword] = useState("admin")
  const [err, setErr] = useState("")
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
    } catch (e: Record<string, unknown>) {
      if (e.user_err) {
        setErr(e.message);
      }

      console.error(e);
    }
  };

  const handleTokenSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      host = "192.168.0.120:8080"
      const url = `http://${host}/api/v2/auth/login?username=${login}&password=${password}`;
      console.log('--Token', host, login, password, url);
      const result = await fetch(url, {
        method: 'POST'
      });
      const options = {
        method: "POST",
        headers: {
        }
      }
      //const cookies = token_res.headers
      // console.log("TOKEN", chrome.cookies.get("SID"));

      chrome.cookies.get({ url, name: 'SID' }, function(cookie) {
        // do something with the cookie
        const token = cookie?.value;
        if (!token || token == "") {
          return setErr("Failed to get Qbittorrent token. Check correctnes of your host")
        }

        setToken(cookie?.value);
      });

      setLogin("");
      setPassword("");
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
      <form onSubmit={handleConfigSubmit}>
        <input placeholder="Default host" onChange={(e) => setHost(e.target.value)} value={host} />
        <input placeholder="Save file path" onChange={(e) => setSavePath(e.target.value)} value={save_path} />
        <input placeholder="Auth token" onChange={(e) => setToken(e.target.value)} value={token} />

        <button type="submit">save</button>
      </form>

      <form onSubmit={handleTokenSubmit} className={token_form_valid ? "token_form_valid" : "token_form_invalid"}>
        <input placeholder="Login" onChange={(e) => setLogin(e.target.value)} value={login} />
        <input placeholder="Password" onChange={(e) => setPassword(e.target.value)} value={password} />

        <button type="submit">Get token</button>
      </form>

      <h5>{err}</h5>
    </div>
  )
}

async function get_saved_torrent_config(): TorrentConfig | null {

  let { torrent_config } = await chrome.storage.local.get(["torrent_config"]);

  if (!torrent_config || Object.keys(torrent_config).length === 0) {
    return null
  }
  console.log('--GET saved', torrent_config);
  return torrent_config;
}

export default IndexPopup
