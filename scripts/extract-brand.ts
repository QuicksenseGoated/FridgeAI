import sharp from "sharp";
import path from "node:path";
import fs from "node:fs";

const OUT = path.resolve("public/brand");
const ICON_SOURCE = path.resolve("public/brand/icon-source.png");
const SHEET_SOURCE = path.resolve("public/logo-brand.png");
const PWA_SIZES = [512, 384, 192, 152, 144, 128, 96, 72, 48] as const;

const SHEET_CROPS = {
  wordmark: { left: 250, top: 830, width: 520, height: 150 },
  "icon-scan": { left: 40, top: 870, width: 150, height: 130 },
} as const;

async function main() {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

  if (!fs.existsSync(ICON_SOURCE)) {
    throw new Error("Missing public/brand/icon-source.png (your final PFP)");
  }

  const iconMeta = await sharp(ICON_SOURCE).metadata();
  console.log("Final PFP:", iconMeta.width, "x", iconMeta.height);

  // Main app icon — use the final PFP directly (max 512 for UI)
  await sharp(ICON_SOURCE)
    .resize(512, 512, { fit: "cover" })
    .png()
    .toFile(path.join(OUT, "icon.png"));
  console.log("Wrote icon.png from final PFP");

  for (const size of PWA_SIZES) {
    await sharp(ICON_SOURCE)
      .resize(size, size, { fit: "cover" })
      .png()
      .toFile(path.join(OUT, `icon-${size}.png`));
    console.log("Generated icon-" + size + ".png");
  }

  await sharp(ICON_SOURCE)
    .resize(32, 32)
    .png()
    .toFile(path.resolve("public/favicon.png"));
  console.log("Wrote favicon.png");

  // Optional extras from the old asset sheet (wordmark + scan icon)
  if (fs.existsSync(SHEET_SOURCE)) {
    for (const [name, region] of Object.entries(SHEET_CROPS)) {
      await sharp(SHEET_SOURCE)
        .extract(region)
        .png()
        .toFile(path.join(OUT, `${name}.png`));
      console.log("Extracted", name + ".png from sheet");
    }
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
