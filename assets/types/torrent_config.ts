import is_valid_host from "~assets/ts/is_valid_host";

export default class TorrentConfig {
  public constructor(public host: string, public save_path: string, public token: string) {
    if (!is_valid_host(host)) {
      throw new FormValidationError("Host is incorrect")
    }

    this.host = host;
    this.save_path = save_path;
    this.token = token;
  }
}

export class FormValidationError extends Error {
  constructor(message: string, public user_err = true) {
    super(message);

    this.name = 'FormValidationError';
  }
}

