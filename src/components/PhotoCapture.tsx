interface PhotoCaptureProps {
  preview: string | null;
  hasFile: boolean;
  loading: boolean;
  error: string | null;
  onFile: (file: File | null) => void;
  onScan: () => void;
}

export function PhotoCapture({
  preview,
  hasFile,
  loading,
  error,
  onFile,
  onScan,
}: PhotoCaptureProps) {
  return (
    <section className="card">
      <div className="card__head">
        <h2>Show us your fridge</h2>
        <p>Open the door, good light, snap one clear photo.</p>
      </div>

      {!preview ? (
        <label className="dropzone">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            disabled={loading}
          />
          <div className="dropzone__inner">
            <div className="dropzone__icon-wrap" aria-hidden>
              <svg
                className="dropzone__icon"
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="6"
                  y="10"
                  width="36"
                  height="28"
                  rx="4"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <circle cx="18" cy="22" r="4" stroke="currentColor" strokeWidth="2" />
                <path
                  d="M6 32l9-9 7 7 6-6 14 14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M30 6v8M26 10h8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="dropzone__copy">
              <strong>Tap to take or upload a photo</strong>
              <span>JPG or PNG · fridge or pantry</span>
            </div>
          </div>
        </label>
      ) : (
        <div className="preview-wrap">
          <img src={preview} alt="Your fridge" className="preview" />
          <label className="preview-change">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
              disabled={loading}
            />
            Change photo
          </label>
        </div>
      )}

      <button
        type="button"
        className="btn btn--primary"
        onClick={onScan}
        disabled={loading || !hasFile}
      >
        {loading ? "Scanning…" : "Generate meal ideas"}
      </button>

      {error && (
        <div className="alert alert--error" role="alert">
          {error}
        </div>
      )}
    </section>
  );
}
