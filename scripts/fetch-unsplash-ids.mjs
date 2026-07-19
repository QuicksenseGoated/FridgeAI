const meals = {
  "creamy-garlic-pasta": "creamy-garlic-pasta",
  "chicken-curry": "chicken-curry",
  "butter-chicken": "butter-chicken",
  "beef-tacos": "beef-tacos",
  "veggie-stir-fry": "vegetable-stir-fry",
  "chicken-alfredo": "chicken-alfredo",
  "fried-rice": "fried-rice",
  "sheet-pan-salmon": "baked-salmon",
  "beef-stew": "beef-stew",
  "thai-green-curry": "thai-green-curry",
  "pad-thai": "pad-thai",
  "mushroom-risotto": "mushroom-risotto",
  "shakshuka": "shakshuka",
  "lentil-soup": "lentil-soup",
  "chili-con-carne": "chili-con-carne",
  "cheese-quesadilla": "cheese-quesadilla",
  "honey-garlic-salmon": "honey-garlic-salmon",
  "minestrone": "minestrone-soup",
  "chicken-caesar-wrap": "chicken-caesar-wrap",
  "margherita-flatbread": "margherita-pizza",
  "greek-salad-bowl": "greek-salad",
  "bbq-chicken-wings": "bbq-chicken-wings",
  "avocado-toast": "avocado-toast",
  "spaghetti-bolognese": "spaghetti-bolognese",
  "buttery-scrambled-eggs": "scrambled-eggs",
  "pan-seared-herb-chicken": "pan-seared-chicken",
  "fish-chips-home": "fish-and-chips",
  "shepherds-pie": "shepherds-pie",
  "beef-stir-fry-express": "beef-stir-fry",
  "sticky-lemon-chicken": "lemon-chicken",
  "classic-beef-burger": "beef-burger",
  "smash-burger": "smash-burger",
  "classic-carbonara": "carbonara",
  "spicy-garlic-noodles": "garlic-noodles",
  "birria-tacos": "birria-tacos",
  "korean-fried-chicken": "korean-fried-chicken",
  "chicken-parmesan": "chicken-parmesan",
  "croque-monsieur": "croque-monsieur",
  "mapo-tofu": "mapo-tofu",
  "upgraded-ramen": "ramen-bowl",
  "stovetop-mac-cheese": "mac-and-cheese",
  "cacio-e-pepe": "cacio-e-pepe",
  "weeknight-lasagna": "lasagna",
  "teriyaki-salmon-bowl": "teriyaki-salmon",
  "chicken-tikka-masala": "chicken-tikka-masala",
  "sunday-pot-roast": "pot-roast",
  "buttermilk-pancakes": "pancakes",
  "french-toast": "french-toast",
  "shakshuka-brunch": "shakshuka",
  "avocado-toast-egg": "avocado-toast-egg",
  "breakfast-burrito": "breakfast-burrito",
  "overnight-oats": "overnight-oats",
  "eggs-benedict": "eggs-benedict",
  "banana-bread-loaf": "banana-bread",
  "chocolate-layer-cake": "chocolate-cake",
  "vanilla-sponge-cake": "vanilla-cake",
  "red-velvet-cupcakes": "red-velvet-cupcakes",
  "sourdough-loaf": "sourdough-bread",
  "focaccia": "focaccia",
  "apple-pie": "apple-pie",
  "cheesecake-bake": "cheesecake",
  "chocolate-chip-cookies": "chocolate-chip-cookies",
  "brownies-fudge": "chocolate-brownies",
  "lemon-drizzle-cake": "lemon-cake",
  "cinnamon-rolls": "cinnamon-rolls",
  "carrot-cake": "carrot-cake",
  "tiramisu": "tiramisu",
  "chocolate-mousse": "chocolate-mousse",
};

const photoRe = /photo-\d+-[a-f0-9]+/g;
const titleRe = /"altDescription":"([^"]+)"/g;

async function fetchFirstPhoto(mealId, query) {
  const url = `https://unsplash.com/s/photos/${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
  });
  const html = await res.text();
  const photos = [...new Set(html.match(photoRe) ?? [])].filter((p) => !p.includes("profile"));
  const titles = [...html.matchAll(titleRe)].map((m) => m[1]);
  return { mealId, query, photos: photos.slice(0, 5), titles: titles.slice(0, 5), status: res.status };
}

const entries = Object.entries(meals);
const results = [];
for (const [mealId, query] of entries) {
  try {
    const r = await fetchFirstPhoto(mealId, query);
    results.push(r);
    console.log(JSON.stringify(r));
  } catch (e) {
    console.log(JSON.stringify({ mealId, query, error: String(e) }));
  }
  await new Promise((r) => setTimeout(r, 300));
}
