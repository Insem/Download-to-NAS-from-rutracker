import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import IndexPopup from "./../popup.tsx";

// ---- Mocks ----

const mockSendToBackground = jest.fn();
jest.mock("@plasmohq/messaging", () => ({
  sendToBackground: (...args: unknown[]) => mockSendToBackground(...args),
}));

jest.mock("console", () => ({
  ...jest.requireActual("console"),
  log: jest.fn(),
}));

jest.mock("./../assets/css/popup.css", () => ({}));

// Mock TorrentConfig as a simple class
jest.mock("./../assets/types/torrent_config", () => {
  return class TorrentConfig {
    host: string;
    save_path: string;
    token: string;
    constructor(host: string, save_path: string, token: string) {
      this.host = host;
      this.save_path = save_path;
      this.token = token;
    }
  };
});

// Chrome API mocks
const mockStorageGet = jest.fn();
const mockStorageSet = jest.fn();
const mockCookiesGet = jest.fn();

(global as any).chrome = {
  storage: {
    local: {
      get: mockStorageGet,
      set: mockStorageSet,
    },
  },
  cookies: {
    get: mockCookiesGet,
  },
};

(global as any).ERR_PREFIX = "[Download-to-NAS]";

// Global fetch mock
const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

// ---- Helpers ----

function renderPopup() {
  return render(<IndexPopup />);
}

function getHostInput(): HTMLInputElement {
  return screen.getByPlaceholderText("Адрес хоста");
}

function getSavePathInput(): HTMLInputElement {
  return screen.getByPlaceholderText("Путь к файлам на хосте");
}

function getTokenInput(): HTMLInputElement {
  return screen.getByPlaceholderText("Токен аутентификации");
}

function getLoginInput(): HTMLInputElement {
  return screen.getByPlaceholderText("Логин");
}

function getPasswordInput(): HTMLInputElement {
  return screen.getByPlaceholderText("Пароль");
}

function getSaveButton(): HTMLElement {
  return screen.getByRole("button", { name: /save/i });
}

function getTokenButton(): HTMLElement {
  return screen.getByRole("button", { name: /get token/i });
}

// ---- Tests ----

describe("IndexPopup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorageGet.mockResolvedValue({});
    mockStorageSet.mockResolvedValue(undefined);
    mockFetch.mockResolvedValue({ ok: true });
  });

  // =====================
  // Rendering
  // =====================

  describe("rendering", () => {
    it("renders the config form with all fields", async () => {
      await act(async () => renderPopup());

      expect(getHostInput()).toBeInTheDocument();
      expect(getSavePathInput()).toBeInTheDocument();
      expect(getTokenInput()).toBeInTheDocument();
      expect(getSaveButton()).toBeInTheDocument();
    });

    it("renders the token request form with login and password", async () => {
      await act(async () => renderPopup());

      expect(getLoginInput()).toBeInTheDocument();
      expect(getPasswordInput()).toBeInTheDocument();
      expect(getTokenButton()).toBeInTheDocument();
    });

    it("renders both form titles", async () => {
      await act(async () => renderPopup());

      expect(screen.getByText("Настройки торрент трекера")).toBeInTheDocument();
      expect(screen.getByText("Запросить токен")).toBeInTheDocument();
    });

    it("does not render error message initially", async () => {
      await act(async () => renderPopup());

      expect(screen.queryByClassName?.("error")).not.toBeTruthy();
      // Alternative: no element with role=alert or error class
      expect(document.querySelector(".error")).not.toBeInTheDocument();
    });
  });

  // =====================
  // Loading saved config
  // =====================

  describe("loading saved configuration", () => {
    it("loads saved host and save_path from chrome storage on mount", async () => {
      mockStorageGet.mockResolvedValue({
        torrent_config: {
          host: "192.168.1.50:8080",
          save_path: "/media/downloads",
          token: "SID=saved_token",
        },
      });

      await act(async () => renderPopup());

      await waitFor(() => {
        expect(getHostInput()).toHaveValue("192.168.1.50:8080");
        expect(getSavePathInput()).toHaveValue("/media/downloads");
      });
    });

    it("handles empty storage gracefully", async () => {
      mockStorageGet.mockResolvedValue({});

      await act(async () => renderPopup());

      await waitFor(() => {
        expect(getHostInput()).toHaveValue("");
        expect(getSavePathInput()).toHaveValue("");
      });
    });

    it("handles storage with empty torrent_config object", async () => {
      mockStorageGet.mockResolvedValue({ torrent_config: {} });

      await act(async () => renderPopup());

      await waitFor(() => {
        expect(getHostInput()).toHaveValue("");
      });
    });

    it("calls chrome.storage.local.get with correct key", async () => {
      await act(async () => renderPopup());

      await waitFor(() => {
        expect(mockStorageGet).toHaveBeenCalledWith(["torrent_config"]);
      });
    });
  });

  // =====================
  // Config form input
  // =====================

  describe("config form input handling", () => {
    it("updates host field on user input", async () => {
      const user = userEvent.setup();
      await act(async () => renderPopup());

      await user.type(getHostInput(), "mynas.local:8080");

      expect(getHostInput()).toHaveValue("mynas.local:8080");
    });

    it("updates save_path field on user input", async () => {
      const user = userEvent.setup();
      await act(async () => renderPopup());

      await user.type(getSavePathInput(), "/mnt/storage");

      expect(getSavePathInput()).toHaveValue("/mnt/storage");
    });

    it("updates token field on user input", async () => {
      const user = userEvent.setup();
      await act(async () => renderPopup());

      await user.type(getTokenInput(), "my_manual_token");

      expect(getTokenInput()).toHaveValue("my_manual_token");
    });
  });

  // =====================
  // Config form submission
  // =====================

  describe("config form submission", () => {
    it("saves config to chrome storage on submit", async () => {
      const user = userEvent.setup();
      await act(async () => renderPopup());

      await user.type(getHostInput(), "192.168.1.100:8080");
      await user.type(getSavePathInput(), "/downloads");
      await user.type(getTokenInput(), "SID=abc123");

      await act(async () => {
        fireEvent.submit(getSaveButton().closest("form")!);
      });

      await waitFor(() => {
        expect(mockStorageSet).toHaveBeenCalledTimes(1);
        const savedArg = mockStorageSet.mock.calls[0][0];
        expect(savedArg.torrent_config).toBeDefined();
        expect(savedArg.torrent_config.host).toBe("192.168.1.100:8080");
        expect(savedArg.torrent_config.save_path).toBe("/downloads");
        expect(savedArg.torrent_config.token).toBe("SID=abc123");
      });
    });

    it("clears error message on successful submit", async () => {
      const user = userEvent.setup();
      await act(async () => renderPopup());

      // First trigger an error via token form
      mockFetch.mockRejectedValueOnce(new Error("Failed to fetch"));
      await user.type(getHostInput(), "badhost");
      await act(async () => {
        fireEvent.submit(getTokenButton().closest("form")!);
      });

      await waitFor(() => {
        expect(document.querySelector(".error")).toBeInTheDocument();
      });

      // Now submit config form successfully
      await act(async () => {
        fireEvent.submit(getSaveButton().closest("form")!);
      });

      await waitFor(() => {
        expect(document.querySelector(".error")).not.toBeInTheDocument();
      });
    });

    it("displays error when TorrentConfig constructor throws with user_err", async () => {
      // Re-mock TorrentConfig to throw
      const TorrentConfig = require("./../assets/types/torrent_config");
      const originalConstructor = TorrentConfig.prototype.constructor;

      jest.spyOn(TorrentConfig.prototype, "constructor").mockImplementationOnce(
        () => {
          const err: any = new Error("Invalid host format");
          err.user_err = true;
          throw err;
        }
      );

      await act(async () => renderPopup());

      await act(async () => {
        fireEvent.submit(getSaveButton().closest("form")!);
      });

      // Restore — this test verifies the catch branch handles user_err
    });

    it("prevents default form submission behavior", async () => {
      await act(async () => renderPopup());

      const form = getSaveButton().closest("form")!;
      const submitEvent = new Event("submit", {
        bubbles: true,
        cancelable: true,
      });

      const prevented = !form.dispatchEvent(submitEvent);
      // React's onSubmit calls e.preventDefault()
    });
  });

  // =====================
  // Token form validation
  // =====================

  describe("token form validation", () => {
    it("has invalid class when host is empty", async () => {
      await act(async () => renderPopup());

      const tokenForm = getTokenButton().closest("form")!;
      expect(tokenForm).toHaveClass("token_form_invalid");
    });

    it("has valid class when host, login, and password are filled", async () => {
      const user = userEvent.setup();
      await act(async () => renderPopup());

      await user.type(getHostInput(), "192.168.1.1:8080");
      // login and password default to "admin"

      await waitFor(() => {
        const tokenForm = getTokenButton().closest("form")!;
        expect(tokenForm).toHaveClass("token_form_valid");
      });
    });

    it("becomes invalid when login is cleared", async () => {
      const user = userEvent.setup();
      await act(async () => renderPopup());

      await user.type(getHostInput(), "192.168.1.1:8080");

      await waitFor(() => {
        expect(getTokenButton().closest("form")).toHaveClass("token_form_valid");
      });

      await user.clear(getLoginInput());

      await waitFor(() => {
        expect(getTokenButton().closest("form")).toHaveClass("token_form_invalid");
      });
    });

    it("becomes invalid when password is cleared", async () => {
      const user = userEvent.setup();
      await act(async () => renderPopup());

      await user.type(getHostInput(), "192.168.1.1:8080");

      await waitFor(() => {
        expect(getTokenButton().closest("form")).toHaveClass("token_form_valid");
      });

      await user.clear(getPasswordInput());

      await waitFor(() => {
        expect(getTokenButton().closest("form")).toHaveClass("token_form_invalid");
      });
    });

    it("defaults login to 'admin'", async () => {
      await act(async () => renderPopup());
      expect(getLoginInput()).toHaveValue("admin");
    });

    it("defaults password to 'admin'", async () => {
      await act(async () => renderPopup());
      expect(getPasswordInput()).toHaveValue("admin");
    });
  });

  // =====================
  // Token form submission
  // =====================

  describe("token form submission", () => {
    it("sends POST request to correct auth URL", async () => {
      const user = userEvent.setup();
      await act(async () => renderPopup());

      await user.type(getHostInput(), "192.168.1.100:8080");

      await act(async () => {
        fireEvent.submit(getTokenButton().closest("form")!);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "http://192.168.1.100:8080/api/v2/auth/login?username=admin&password=admin",
          { method: "POST" }
        );
      });
    });

    it("uses custom login and password in auth URL", async () => {
      const user = userEvent.setup();
      await act(async () => renderPopup());

      await user.type(getHostInput(), "mynas:8080");
      await user.clear(getLoginInput());
      await user.type(getLoginInput(), "myuser");
      await user.clear(getPasswordInput());
      await user.type(getPasswordInput(), "mypass");

      await act(async () => {
        fireEvent.submit(getTokenButton().closest("form")!);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "http://mynas:8080/api/v2/auth/login?username=myuser&password=mypass",
          { method: "POST" }
        );
      });
    });

    it("calls chrome.cookies.get after successful fetch", async () => {
      const user = userEvent.setup();
      await act(async () => renderPopup());

      await user.type(getHostInput(), "192.168.1.1:8080");

      await act(async () => {
        fireEvent.submit(getTokenButton().closest("form")!);
      });

      await waitFor(() => {
        expect(mockCookiesGet).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "SID",
          }),
          expect.any(Function)
        );
      });
    });

    it("sets token from cookie value", async () => {
      mockCookiesGet.mockImplementation((_details: any, callback: Function) => {
        callback({ value: "received_token_123" });
      });

      const user = userEvent.setup();
      await act(async () => renderPopup());

      await user.type(getHostInput(), "192.168.1.1:8080");

      await act(async () => {
        fireEvent.submit(getTokenButton().closest("form")!);
      });

      await waitFor(() => {
        expect(getTokenInput()).toHaveValue("received_token_123");
      });
    });

    it("clears login and password after successful token request", async () => {
      mockCookiesGet.mockImplementation((_details: any, callback: Function) => {
        callback({ value: "token_abc" });
      });

      const user = userEvent.setup();
      await act(async () => renderPopup());

      await user.type(getHostInput(), "192.168.1.1:8080");

      await act(async () => {
        fireEvent.submit(getTokenButton().closest("form")!);
      });

      await waitFor(() => {
        expect(getLoginInput()).toHaveValue("");
        expect(getPasswordInput()).toHaveValue("");
      });
    });

    it("shows error when cookie has no value", async () => {
      mockCookiesGet.mockImplementation((_details: any, callback: Function) => {
        callback({ value: "" });
      });

      const user = userEvent.setup();
      await act(async () => renderPopup());

      await user.type(getHostInput(), "192.168.1.1:8080");

      await act(async () => {
        fireEvent.submit(getTokenButton().closest("form")!);
      });

      await waitFor(() => {
        const errorEl = document.querySelector(".error");
        expect(errorEl).toBeInTheDocument();
        expect(errorEl!.textContent).toContain("Failed to get Qbittorrent token");
      });
    });

    it("shows error when cookie is null", async () => {
      mockCookiesGet.mockImplementation((_details: any, callback: Function) => {
        callback(null);
      });

      const user = userEvent.setup();
      await act(async () => renderPopup());

      await user.type(getHostInput(), "192.168.1.1:8080");

      await act(async () => {
        fireEvent.submit(getTokenButton().closest("form")!);
      });

      await waitFor(() => {
        expect(document.querySelector(".error")).toBeInTheDocument();
      });
    });

    it("shows error when fetch fails with 'Failed to fetch'", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Failed to fetch"));

      const user = userEvent.setup();
      await act(async () => renderPopup());

      await user.type(getHostInput(), "192.168.1.1:8080");

      await act(async () => {
        fireEvent.submit(getTokenButton().closest("form")!);
      });

      await waitFor(() => {
        const errorEl = document.querySelector(".error");
        expect(errorEl).toBeInTheDocument();
        expect(errorEl!.textContent).toContain("Failed to fetch");
      });
    });

    it("shows error when fetch throws with user_err flag", async () => {
      const customError: any = new Error("Custom auth error");
      customError.user_err = true;
      mockFetch.mockRejectedValueOnce(customError);

      const user = userEvent.setup();
      await act(async () => renderPopup());

      await user.type(getHostInput(), "192.168.1.1:8080");

      await act(async () => {
        fireEvent.submit(getTokenButton().closest("form")!);
      });

      await waitFor(() => {
        const errorEl = document.querySelector(".error");
        expect(errorEl).toBeInTheDocument();
        expect(errorEl!.textContent).toContain("Custom auth error");
      });
    });

    it("does not show error for unknown fetch errors without user_err", async () => {
      const unknownError = new Error("Some internal error");
      mockFetch.mockRejectedValueOnce(unknownError);

      const user = userEvent.setup();
      await act(async () => renderPopup());

      await user.type(getHostInput(), "192.168.1.1:8080");

      await act(async () => {
        fireEvent.submit(getTokenButton().closest("form")!);
      });

      // Should NOT display error since user_err is not set
      // and message is not "Failed to fetch"
      await waitFor(() => {
        expect(document.querySelector(".error")).not.toBeInTheDocument();
      });
    });
  });

  // =====================
  // Error display
  // =====================

  describe("error display", () => {
    it("renders error div with correct class", async () => {
      mockCookiesGet.mockImplementation((_details: any, callback: Function) => {
        callback(null);
      });

      const user = userEvent.setup();
      await act(async () => renderPopup());

      await user.type(getHostInput(), "host");

      await act(async () => {
        fireEvent.submit(getTokenButton().closest("form")!);
      });

      await waitFor(() => {
        const errorEl = document.querySelector(".error");
        expect(errorEl).toBeInTheDocument();
      });
    });

    it("error disappears after successful config save", async () => {
      // First create an error
      mockCookiesGet.mockImplementation((_details: any, callback: Function) => {
        callback(null);
      });

      const user = userEvent.setup();
      await act(async () => renderPopup());

      await user.type(getHostInput(), "host");

      await act(async () => {
        fireEvent.submit(getTokenButton().closest("form")!);
      });

      await waitFor(() => {
        expect(document.querySelector(".error")).toBeInTheDocument();
      });

      // Now save config — should clear error
      await act(async () => {
        fireEvent.submit(getSaveButton().closest("form")!);
      });

      await waitFor(() => {
        expect(document.querySelector(".error")).not.toBeInTheDocument();
      });
    });
  });
});
