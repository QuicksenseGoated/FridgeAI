export type StepPhase = "prep" | "cook" | "finish" | "serve";

export interface StepVisual {
  phase: StepPhase;
  emoji: string;
  scene: string;
  tip: string;
  timer?: string;
  ingredients: string[];
}

const ACTION_EMOJIS: [RegExp, string][] = [
  [/boil|simmer|blanch/i, "🫕"],
  [/bake|oven|roast|broil/i, "🔥"],
  [/fry|sear|saut[eé]|brown|crisp|deep.?fry/i, "🍳"],
  [/mix|stir|toss|whisk|fold|combine|blend/i, "🥄"],
  [/chop|dice|slice|cut|mince|peel|trim/i, "🔪"],
  [/season|salt|pepper|spice|marinate/i, "🧂"],
  [/serve|plate|garnish|top with/i, "🍽️"],
  [/drain|strain|pat dry/i, "💧"],
  [/rest|cool|chill|refrigerat/i, "⏳"],
  [/grill|char/i, "♨️"],
  [/knead|roll|dough/i, "🥖"],
  [/pour|ladle|drizzle/i, "🫗"],
  [/cover|lid|wrap/i, "🫕"],
  [/preheat|heat|warm/i, "🌡️"],
];

const PHASE_SCENES: Record<StepPhase, string[]> = {
  prep: ["Gather & prep", "Get everything ready", "Mise en place"],
  cook: ["On the heat", "Cooking now", "At the stove"],
  finish: ["Almost there", "Final touches", "Finishing up"],
  serve: ["Ready to serve", "Plate it up", "Time to eat"],
};

const PHASE_TIPS: Record<StepPhase, string[]> = {
  prep: [
    "Read the full step before you start — saves mistakes mid-cook.",
    "Lay out ingredients within arm's reach.",
    "Sharp knife, clean board — prep goes faster.",
  ],
  cook: [
    "Lower heat beats rushing — you can always turn it up.",
    "Taste as you go and adjust seasoning at the end.",
    "Don't crowd the pan — food needs room to brown.",
  ],
  finish: [
    "A minute of resting lets flavors settle.",
    "Check doneness with a thermometer when in doubt.",
    "Keep the heat gentle for the last minute.",
  ],
  serve: [
    "Serve hot — plates warm in a low oven if you have time.",
    "Fresh herbs or a squeeze of lemon lifts everything.",
    "Take a photo before the first bite — you earned it.",
  ],
};

function detectPhase(step: string, index: number, total: number): StepPhase {
  const lower = step.toLowerCase();
  if (/serve|plate|garnish|top with|enjoy/i.test(lower)) return "serve";
  if (index === total - 1) return "serve";
  if (/chop|dice|slice|cut|mince|peel|season|marinate|mix|combine|prepare/i.test(lower) && index < total * 0.35) {
    return "prep";
  }
  if (/rest|cool|set aside|finish|adjust/i.test(lower) && index >= total * 0.7) return "finish";
  return "cook";
}

function detectEmoji(step: string, mealEmoji: string): string {
  for (const [pattern, emoji] of ACTION_EMOJIS) {
    if (pattern.test(step)) return emoji;
  }
  return mealEmoji;
}

function detectTimer(step: string): string | undefined {
  const match = step.match(/(\d+\s*[–-]\s*\d+|\d+)\s*(minutes?|mins?|hours?|hrs?|seconds?|secs?)/i);
  return match ? match[0].replace(/\s+/g, " ") : undefined;
}

function ingredientsForStep(step: string, uses: string[]): string[] {
  const lower = step.toLowerCase();
  return uses.filter((item) => {
    const key = item.toLowerCase();
    const words = key.split(/\s+/).filter((word) => word.length > 3);
    return words.some((word) => lower.includes(word)) || lower.includes(key);
  });
}

function sceneLabel(phase: StepPhase, index: number): string {
  const options = PHASE_SCENES[phase];
  return options[index % options.length];
}

function tipForStep(phase: StepPhase, index: number): string {
  const options = PHASE_TIPS[phase];
  return options[index % options.length];
}

export function getStepVisual(
  step: string,
  stepIndex: number,
  totalSteps: number,
  mealEmoji: string,
  uses: string[]
): StepVisual {
  const phase = detectPhase(step, stepIndex, totalSteps);
  const mentioned = ingredientsForStep(step, uses);

  return {
    phase,
    emoji: detectEmoji(step, mealEmoji),
    scene: sceneLabel(phase, stepIndex),
    tip: tipForStep(phase, stepIndex),
    timer: detectTimer(step),
    ingredients: mentioned.length > 0 ? mentioned : uses.slice(0, Math.min(4, uses.length)),
  };
}
