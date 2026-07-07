export type LoadingPhase = "reading" | "meals" | "videos";

const MESSAGES: Record<LoadingPhase, string> = {
  reading: "Reading your fridge…",
  meals: "Planning meals for your goal…",
  videos: "Finding recipe videos…",
};

interface LoadingOverlayProps {
  phase: LoadingPhase;
}

export function LoadingOverlay({ phase }: LoadingOverlayProps) {
  return (
    <div className="overlay" role="status" aria-live="polite">
      <div className="overlay__card">
        <div className="overlay__spinner" aria-hidden />
        <p className="overlay__title">{MESSAGES[phase]}</p>
        <p className="overlay__hint">This usually takes 5–15 seconds</p>
      </div>
    </div>
  );
}
