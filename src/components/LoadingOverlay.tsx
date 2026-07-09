export type LoadingPhase = "reading" | "meals" | "videos";

const MESSAGES: Record<LoadingPhase, string> = {
  reading: "Peeking inside your fridge…",
  meals: "Cooking up meal ideas for you…",
  videos: "Finding fun recipe videos…",
};

interface LoadingOverlayProps {
  phase: LoadingPhase;
}

export function LoadingOverlay({ phase }: LoadingOverlayProps) {
  return (
    <div className="overlay" role="status" aria-live="polite">
      <div className="overlay__card">
        <img
          src="/brand/mascot.svg"
          alt=""
          className="overlay__mascot"
          width={88}
          height={88}
          aria-hidden
        />
        <p className="overlay__title">{MESSAGES[phase]}</p>
        <p className="overlay__hint">
          {phase === "meals"
            ? "Can take up to a minute if AI is busy — hang tight!"
            : "Just a few seconds — hang tight!"}
        </p>
      </div>
    </div>
  );
}
