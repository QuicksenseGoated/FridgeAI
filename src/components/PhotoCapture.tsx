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
        <h2>Snap your fridge</h2>
        <p>One tap. One photo. Real meal ideas in seconds.</p>
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
                <rect x="10" y="6" width="28" height="36" rx="6" fill="#FFFFFF" stroke="currentColor" strokeWidth="2.5"/>
                <rect x="10" y="6" width="28" height="14" rx="6" fill="#D6EEFF"/>
                <line x1="10" y1="20" x2="38" y2="20" stroke="currentColor" strokeWidth="2"/>
                <rect x="30" y="10" width="4" height="8" rx="2" fill="#FFD166"/>
                <rect x="30" y="26" width="4" height="12" rx="2" fill="#FFD166"/>
                <circle cx="18" cy="32" r="3" fill="#FFFFFF" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="28" cy="32" r="3" fill="#FFFFFF" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="19" cy="32.5" r="1.2" fill="currentColor"/>
                <circle cx="29" cy="32.5" r="1.2" fill="currentColor"/>
                <path d="M20 35 Q23 37 26 35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="dropzone__copy">
              <strong>Tap here to take a photo!</strong>
              <span>Fridge or pantry · JPG or PNG</span>
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
