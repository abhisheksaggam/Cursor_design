import { mkdir, copyFile } from "node:fs/promises";

await mkdir("tokens/input", { recursive: true });
await copyFile("/Users/abhishek/Downloads/Colours.json", "tokens/input/Colours.json");
await copyFile("/Users/abhishek/Downloads/Spacing.json", "tokens/input/Spacing.json");
await copyFile("/Users/abhishek/Downloads/Typography.json", "tokens/input/Typography.json");
console.log("Copied provided JSON files into tokens/input.");
