import { readFile, writeFile } from "node:fs/promises";
import { normalizeCollections } from "../normalize/index.js";
import { compareSourceToFigma } from "../compare/index.js";
import { buildDriftReport, buildPrSummary } from "../reports/index.js";

export async function loadJson(path) {
  const content = await readFile(path, "utf8");
  return JSON.parse(content);
}

export async function writeJson(path, data) {
  await writeFile(path, `${JSON.stringify(data, null, 2)}\n`);
}

export async function normalizeFromInputs(inputPaths, outputPath, options = {}) {
  const collections = [];
  for (const path of inputPaths) {
    collections.push(await loadJson(path));
  }
  const normalized = normalizeCollections(collections, options);
  await writeJson(outputPath, normalized);
  return normalized;
}

export async function compareAndReport(sourcePath, figmaPath, reportPath, summaryPath) {
  const sourceDoc = await loadJson(sourcePath);
  const figmaDoc = await loadJson(figmaPath);
  const comparison = compareSourceToFigma(sourceDoc, figmaDoc);
  await writeFile(reportPath, buildDriftReport(comparison));
  await writeFile(summaryPath, buildPrSummary(comparison));
  return comparison;
}
