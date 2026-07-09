import { useState } from "react";
import { StarRating } from "./StarRating";
import type { PersonaId } from "../types/app";
import { PERSONAS } from "../types/app";

interface OnboardingProps {
  persona: PersonaId;
  onPersonaSelect: (persona: PersonaId) => void;
  onComplete: () => void;
}

const STEPS = [
  {
    title: "Snap your fridge",
    copy: "One photo is all it takes. Fridge AI spots what you have inside.",
    emoji: "📸",
  },
  {
    title: "Get meal ideas",
    copy: "We suggest 3–5 meals tailored to your goal — in seconds.",
    emoji: "🍳",
  },
  {
    title: "Watch & cook",
    copy: "Each meal comes with recipe videos so you know exactly what to do.",
    emoji: "▶️",
  },
];

export function Onboarding({ persona, onPersonaSelect, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const totalSteps = STEPS.length + 2;
  const isGoalStep = step === STEPS.length;
  const isLastStep = step === STEPS.length + 1;

  return (
    <div className="onboarding" role="dialog" aria-modal="true" aria-label="Welcome to Fridge AI">
      <div className="onboarding__card">
        <img
          src="/brand/mascot.svg"
          alt=""
          className="onboarding__mascot"
          width={88}
          height={88}
          aria-hidden
        />

        {!isGoalStep && !isLastStep && (
          <>
            <p className="onboarding__step-label">
              Step {step + 1} of {totalSteps}
            </p>
            <h2 className="onboarding__title">
              <span aria-hidden>{STEPS[step].emoji}</span> {STEPS[step].title}
            </h2>
            <p className="onboarding__copy">{STEPS[step].copy}</p>
          </>
        )}

        {isGoalStep && (
          <>
            <p className="onboarding__step-label">
              Step {step + 1} of {totalSteps}
            </p>
            <h2 className="onboarding__title">What&apos;s your goal?</h2>
            <p className="onboarding__copy">
              Top apps like Mealime personalize every suggestion. Pick yours:
            </p>
            <div className="onboarding__goals">
              {PERSONAS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`onboarding__goal${persona === item.id ? " onboarding__goal--active" : ""}`}
                  onClick={() => onPersonaSelect(item.id)}
                  aria-pressed={persona === item.id}
                >
                  <span aria-hidden>{item.emoji}</span> {item.label}
                </button>
              ))}
            </div>
          </>
        )}

        {isLastStep && (
          <>
            <p className="onboarding__step-label">You&apos;re all set!</p>
            <h2 className="onboarding__title">Ready to cook smarter?</h2>
            <p className="onboarding__copy">
              Join home cooks using AI to turn fridge photos into real dinners — with video recipes included.
            </p>
            <div className="social-proof social-proof--rate">
              <StarRating size="medium" />
              <span className="social-proof__copy">Tap to rate — loved by busy families</span>
            </div>
          </>
        )}

        <div className="onboarding__actions">
          {step > 0 && (
            <button
              type="button"
              className="btn btn--secondary onboarding__btn"
              onClick={() => setStep((value) => value - 1)}
            >
              Back
            </button>
          )}
          {!isLastStep ? (
            <button
              type="button"
              className="btn btn--primary onboarding__btn"
              onClick={() => setStep((value) => value + 1)}
            >
              {isGoalStep ? "Continue" : "Next"}
            </button>
          ) : (
            <button type="button" className="btn btn--primary onboarding__btn" onClick={onComplete}>
              Start scanning
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
