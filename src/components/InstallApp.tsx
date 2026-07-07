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

export function InstallApp() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalone);
  const [dismissed, setDismissed] = useState(false);

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

  if (installed || dismissed) {
    return null;
  }

  if (installPrompt) {
    return (
      <div className="install-banner">
        <p className="install-banner__text">
          Install Fridge AI for a full-screen app on your home screen.
        </p>
        <div className="install-banner__actions">
          <button
            type="button"
            className="btn btn--primary install-banner__btn"
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
          <button
            type="button"
            className="install-banner__dismiss"
            onClick={() => setDismissed(true)}
          >
            Not now
          </button>
        </div>
      </div>
    );
  }

  if (isIOS()) {
    return (
      <div className="install-banner install-banner--ios">
        <p className="install-banner__text">
          Tap <strong>Share</strong> → <strong>Add to Home Screen</strong> to
          install Fridge AI like a real app.
        </p>
        <button
          type="button"
          className="install-banner__dismiss"
          onClick={() => setDismissed(true)}
        >
          Got it
        </button>
      </div>
    );
  }

  return null;
}
