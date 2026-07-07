import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isSafari() {
  const ua = navigator.userAgent;
  return /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|Chrome/i.test(ua);
}

function isMobile() {
  return (
    isIOS() ||
    /Android/i.test(navigator.userAgent) ||
    window.matchMedia("(max-width: 768px)").matches
  );
}

function isInAppBrowser() {
  return /FBAN|FBAV|Instagram|Line\/|Twitter|Snapchat|TikTok|WhatsApp/i.test(
    navigator.userAgent,
  );
}

export function InstallApp() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalone);
  const [mobile] = useState(isMobile);

  useEffect(() => {
    document.body.classList.toggle("has-install-bar", mobile && !installed);

    return () => {
      document.body.classList.remove("has-install-bar");
    };
  }, [installed, mobile]);

  useEffect(() => {
    const onInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || !mobile) {
    return null;
  }

  if (isInAppBrowser()) {
    return (
      <div className="install-bar">
        <p className="install-bar__title">Install Fridge AI</p>
        <p className="install-bar__text">
          Open this link in <strong>Safari</strong> or <strong>Chrome</strong>{" "}
          first. In-app browsers cannot install apps.
        </p>
      </div>
    );
  }

  if (installPrompt) {
    return (
      <div className="install-bar">
        <p className="install-bar__title">Install Fridge AI</p>
        <p className="install-bar__text">
          Add it to your home screen for a full-screen app experience.
        </p>
        <button
          type="button"
          className="btn btn--primary install-bar__btn"
          onClick={async () => {
            await installPrompt.prompt();
            const choice = await installPrompt.userChoice;
            if (choice.outcome === "accepted") {
              setInstalled(true);
            }
            setInstallPrompt(null);
          }}
        >
          Install app
        </button>
      </div>
    );
  }

  if (isIOS()) {
    if (!isSafari()) {
      return (
        <div className="install-bar">
          <p className="install-bar__title">Install on iPhone</p>
          <p className="install-bar__text">
            Copy your link, open <strong>Safari</strong>, paste it, then tap{" "}
            <strong>Share</strong> → <strong>Add to Home Screen</strong>.
          </p>
        </div>
      );
    }

    return (
      <div className="install-bar">
        <p className="install-bar__title">Install on iPhone</p>
        <ol className="install-bar__steps">
          <li>
            Tap <strong>Share</strong> (square with arrow at the bottom)
          </li>
          <li>
            Scroll and tap <strong>Add to Home Screen</strong>
          </li>
          <li>
            Tap <strong>Add</strong>
          </li>
        </ol>
        <p className="install-bar__note">
          That home screen icon is the installed app. iPhone has no App Store
          download for web apps.
        </p>
      </div>
    );
  }

  return (
    <div className="install-bar">
      <p className="install-bar__title">Install Fridge AI</p>
      <p className="install-bar__text">
        Tap the browser menu <strong>⋮</strong>, then choose{" "}
        <strong>Install app</strong> or <strong>Add to Home screen</strong>.
      </p>
    </div>
  );
}
