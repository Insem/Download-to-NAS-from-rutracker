import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import DirectDownloadLink, { getRootContainer } from "./../content.tsx";

const mockSendToBackground = jest.fn();
jest.mock("@plasmohq/messaging", () => ({
  sendToBackground: (...args: unknown[]) => mockSendToBackground(...args),
}));

// Mock chrome.storage.local
const mockChromeStorage = {
  get: jest.fn(),
};
(global as any).chrome = {
  storage: {
    local: mockChromeStorage,
  },
};

const ERR_PREFIX = "[Download-to-NAS]";
(global as any).ERR_PREFIX = ERR_PREFIX;

// ---- Helpers ----

const defaultConfig = {
  host: "192.168.1.100:8080",
  token: "SID=abc123",
};

const defaultMagnet =
  "magnet:?xt=urn:btih:ABCDEF1234567890&dn=Test+Torrent";

function renderButton(
  overrides: {
    magnet_link?: string;
    torrent_config?: { host: string; token: string };
  } = {}
) {
  return render(
    <DirectDownloadLink
      magnet_link={overrides.magnet_link ?? defaultMagnet}
      torrent_config={overrides.torrent_config ?? defaultConfig}
    />
  );
}

// ---- Tests ----

describe("DirectDownloadLink", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSendToBackground.mockResolvedValue({ ok: true });
  });

  // -- Rendering --

  it("renders the download button", () => {
    renderButton();
    expect(
      screen.getByRole("button", { name: /скачать на nas/i })
    ).toBeInTheDocument();
  });

  // -- Click / sendToBackground --

  it("sends correct message to background on click", async () => {
    renderButton();
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(mockSendToBackground).toHaveBeenCalledTimes(1);
      expect(mockSendToBackground).toHaveBeenCalledWith({
        name: "http",
        body: {
          url: `http://${defaultConfig.host}/api/v2/torrents/add`,
          options: {
            isFormData: true,
            method: "POST",
            body: [{ field: "urls", data: defaultMagnet }],
            headers: {
              Cookie: defaultConfig.token,
            },
          },
        },
      });
    });
  });

  it("uses the provided host in the URL", async () => {
    const customConfig = { host: "10.0.0.5:9090", token: "SID=xyz" };
    renderButton({ torrent_config: customConfig });
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      const call = mockSendToBackground.mock.calls[0][0];
      expect(call.body.url).toBe(
        "http://10.0.0.5:9090/api/v2/torrents/add"
      );
    });
  });

  it("uses the provided token as Cookie header", async () => {
    const customConfig = { host: "nas:8080", token: "SID=secrettoken" };
    renderButton({ torrent_config: customConfig });
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      const call = mockSendToBackground.mock.calls[0][0];
      expect(call.body.options.headers.Cookie).toBe("SID=secrettoken");
    });
  });

  it("passes the magnet link in the form body", async () => {
    const magnet = "magnet:?xt=urn:btih:CUSTOM_HASH&dn=Custom";
    renderButton({ magnet_link: magnet });
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      const call = mockSendToBackground.mock.calls[0][0];
      expect(call.body.options.body).toEqual([
        { field: "urls", data: magnet },
      ]);
    });
  });

  it("does not call sendToBackground before click", () => {
    renderButton();
    expect(mockSendToBackground).not.toHaveBeenCalled();
  });

  it("handles multiple clicks", async () => {
    renderButton();
    const button = screen.getByRole("button");

    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockSendToBackground).toHaveBeenCalledTimes(3);
    });
  });

});

describe("getRootContainer", () => {
  let originalQuerySelector: typeof document.querySelector;
  let originalGetElementsByClassName: typeof document.getElementsByClassName;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = "";
    originalQuerySelector = document.querySelector.bind(document);
    originalGetElementsByClassName =
      document.getElementsByClassName.bind(document);
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  function setupDOM({
    magnetHref = "magnet:?xt=urn:btih:ABC123",
    includeAttach = true,
  } = {}) {
    document.body.innerHTML = `
      <div class="post_wrap">
        <a class="med magnet-link" href="${magnetHref}">Magnet</a>
        ${includeAttach
        ? '<div class="attach bordered med">Attach block</div>'
        : ""
      }
      </div>
    `;
  }

  it("returns rootContainer and magnet_link when DOM is valid", async () => {
    setupDOM({ magnetHref: "magnet:?xt=urn:btih:TEST_HASH" });

    const result = await getRootContainer();

    expect(result).toBeDefined();
    expect(result!.magnet_link).toBe("magnet:?xt=urn:btih:TEST_HASH");
    expect(result!.rootContainer).toBeInstanceOf(HTMLElement);
  });

  it("inserts container after the attach element", async () => {
    setupDOM();

    const result = await getRootContainer();

    const attachEl = document.querySelector(".attach.bordered.med");
    expect(attachEl).toBeTruthy();
    // The inserted div should be the next sibling
    expect(attachEl!.nextElementSibling).toBe(result!.rootContainer);
  });

  it("sets correct styles on the container", async () => {
    setupDOM();

    const result = await getRootContainer();
    const container = result!.rootContainer as HTMLElement;

    expect(container.style.width).toBe("95%");
    expect(container.style.margin).toBe("20px auto");
    expect(container.style.textAlign).toBe("center");
  });

  it("returns undefined and logs error when attach element is missing", async () => {
    setupDOM({ includeAttach: false });

    const result = await getRootContainer();

    expect(result).toBeUndefined();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      ERR_PREFIX,
      expect.stringContaining("Failed to get container")
    );
  });

  it("extracts magnet link from the href attribute", async () => {
    const longMagnet =
      "magnet:?xt=urn:btih:DEADBEEF&dn=Big+File&tr=udp://tracker.example.com";
    setupDOM({ magnetHref: longMagnet });

    const result = await getRootContainer();

    expect(result!.magnet_link).toBe(longMagnet);
  });
});
