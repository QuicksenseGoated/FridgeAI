import { useRef, type ChangeEvent } from "react";

interface PhotoCaptureProps {
  preview: string | null;
  hasFile: boolean;
  loading: boolean;
  error: string | null;
  onFile: (file: File | null) => void;
  onScan: () => void;
}

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif,image/*";

function prefersCameraCapture() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function PhotoCapture({
  preview,
  hasFile,
  loading,
  error,
  onFile,
  onScan,
}: PhotoCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => {
    if (loading) return;
    inputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    onFile(event.target.files?.[0] ?? null);
    event.target.value = "";
  };

  return (
    <section className="card">
      <input
        ref={inputRef}
        type="file"
        className="photo-input-hidden"
        accept={IMAGE_ACCEPT}
        capture={prefersCameraCapture() ? "environment" : undefined}
        onChange={handleFileChange}
        disabled={loading}
        tabIndex={-1}
        aria-hidden
      />

      <div className="card__head">
        <h2>Snap your fridge</h2>
        <p>One tap. One photo. Real meal ideas in seconds.</p>
      </div>

      {!preview ? (
        <button
          type="button"
          className="dropzone"
          onClick={openPicker}
          disabled={loading}
          aria-label="Take a photo of your fridge or pantry"
        >
          <div className="dropzone__inner">
            <div className="dropzone__icon-wrap" aria-hidden>
              <svg
                className="dropzone__icon"
                viewBox="0 0 88 96"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <ellipse cx="44" cy="88" rx="28" ry="5" fill="#4BA3F5" fillOpacity="0.18" />
                <rect x="14" y="24" width="60" height="46" rx="14" fill="#FFFFFF" stroke="#4BA3F5" strokeWidth="3.5" />
                <rect x="30" y="12" width="28" height="16" rx="7" fill="#FFFFFF" stroke="#4BA3F5" strokeWidth="3" />
                <circle cx="66" cy="34" r="5.5" fill="#FFD166" stroke="#E8A830" strokeWidth="1.5" />
                <circle cx="44" cy="47" r="17" fill="#D6EEFF" stroke="#4BA3F5" strokeWidth="3" />
                <circle cx="44" cy="47" r="12" fill="#FFFFFF" stroke="#4BA3F5" strokeWidth="2" />
                <ellipse cx="38" cy="47" rx="2.8" ry="3.2" fill="#FFFFFF" stroke="#2D3748" strokeWidth="1.6" />
                <ellipse cx="50" cy="47" rx="2.8" ry="3.2" fill="#FFFFFF" stroke="#2D3748" strokeWidth="1.6" />
                <circle cx="38.8" cy="47.5" r="1.3" fill="#2D3748" />
                <circle cx="50.8" cy="47.5" r="1.3" fill="#2D3748" />
                <circle cx="39.3" cy="46.8" r="0.55" fill="#FFFFFF" />
                <circle cx="51.3" cy="46.8" r="0.55" fill="#FFFFFF" />
                <ellipse cx="33" cy="50" rx="3.5" ry="2.2" fill="#FFB4C0" fillOpacity="0.55" />
                <ellipse cx="55" cy="50" rx="3.5" ry="2.2" fill="#FFB4C0" fillOpacity="0.55" />
                <path
                  d="M39 51.5 Q44 55 49 51.5"
                  stroke="#2D3748"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M72 17 L73.5 21 L77 22.5 L73.5 24 L72 28 L70.5 24 L67 22.5 L70.5 21 Z"
                  fill="#FFD166"
                />
              </svg>
            </div>
            <div className="dropzone__copy">
              <strong>Tap here to take a photo!</strong>
              <span>Fridge or pantry · JPG or PNG</span>
            </div>
          </div>
        </button>
      ) : (
        <div className="preview-wrap">
          <img src={preview} alt="Your fridge" className="preview" />
          <button
            type="button"
            className="preview-change"
            onClick={openPicker}
            disabled={loading}
          >
            Change photo
          </button>
        </div>
      )}

      <button
        type="button"
        className="btn btn--primary"
        onClick={onScan}
        disabled={loading || !hasFile}
      >
        {loading ? "Looking inside…" : "Get my meal ideas"}
      </button>

      {error && (
        <div className="alert alert--error" role="alert">
          <p>{error}</p>
          {error.includes("busy") && (
            <button type="button" className="btn btn--ghost alert__retry" onClick={onScan}>
              Try again
            </button>
          )}
        </div>
      )}
    </section>
  );
}
