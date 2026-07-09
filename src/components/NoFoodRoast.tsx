interface NoFoodRoastProps {
  message: string;
  detectedObject?: string;
  preview: string | null;
  onScanAgain: () => void;
}

export function NoFoodRoast({
  message,
  detectedObject,
  preview,
  onScanAgain,
}: NoFoodRoastProps) {
  return (
    <section className="no-food-roast">
      <div className="no-food-roast__card card">
        <img
          src="/brand/mascot.svg"
          alt=""
          className="no-food-roast__mascot"
          width={72}
          height={72}
          aria-hidden
        />
        <p className="no-food-roast__badge">Plot twist!</p>
        <h2>We need your fridge, not {detectedObject ? "that" : "this"}</h2>
        {detectedObject && (
          <p className="no-food-roast__object">
            You showed us: <strong>{detectedObject}</strong>
          </p>
        )}
        <p className="no-food-roast__message">{message}</p>
        {preview && (
          <img src={preview} alt="" className="no-food-roast__thumb" aria-hidden />
        )}
        <button type="button" className="btn btn--primary" onClick={onScanAgain}>
          Got it — scan my fridge
        </button>
      </div>
    </section>
  );
}
