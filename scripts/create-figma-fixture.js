import { mkdir, writeFile } from "node:fs/promises";
import { loadJson } from "../src/sync/index.js";

const source = await loadJson("tokens/source/tokens.json");
const fixture = JSON.parse(JSON.stringify(source));
fixture.externalInput = "figma-variables-export-fixture";
fixture.figmaSourceFile =
  "https://www.figma.com/design/A7pWibLNKz5oDP6VilzRqC/Untitled?node-id=0-1&t=SR6KT95J5lfN3HMP-1";

const color = fixture.tokens.color;
const spacing = fixture.tokens.spacing;
const typography = fixture.tokens.typography;

// 1) value change
if (color["color.brand.primary.midnight-green.midnight-green-950"]) {
  color["color.brand.primary.midnight-green.midnight-green-950"].value = {
    r: 0.02,
    g: 0.24,
    b: 0.27,
    a: 1
  };
}

// 2) missing token
delete spacing["spacing.space-12"];

// 3) extra token
color["color.brand.experimental.neon-lime-500"] = {
  value: { r: 0.85, g: 0.95, b: 0.15, a: 1 },
  description: "Experimental Figma-only token.",
  owner: "design-system",
  deprecated: false,
  replacement: null,
  figmaVariableId: "figma-only:1"
};

// 4) renamed token candidate (same value, different key)
if (color["color.text.primary-text"]) {
  color["color.text.main-primary"] = {
    ...color["color.text.primary-text"],
    figmaVariableId: "figma-renamed:1"
  };
  delete color["color.text.primary-text"];
}

// 5) mode mismatch
if (typography["typography.text-styles.size.heading-1-bold"]) {
  typography["typography.text-styles.size.heading-1-bold"].modes = {
    "mobile(base)": 24,
    tablets: 27,
    "laptops/small-desktop": 28
  };
}

await mkdir("fixtures/figma", { recursive: true });
await writeFile("fixtures/figma/variables-export.json", `${JSON.stringify(fixture, null, 2)}\n`);
console.log("Figma fixture generated.");
