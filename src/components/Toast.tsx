import { useEffect, useState } from "react";

interface ToastProps {
  message: string | null;
  onClear: () => void;
}

export function Toast({ message, onClear }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) return;

    setVisible(true);
    const timer = window.setTimeout(() => {
      setVisible(false);
      window.setTimeout(onClear, 220);
    }, 2400);

    return () => window.clearTimeout(timer);
  }, [message, onClear]);

  if (!message) return null;

  return (
    <div className={`toast${visible ? " toast--visible" : ""}`} role="status" aria-live="polite">
      {message}
    </div>
  );
}
