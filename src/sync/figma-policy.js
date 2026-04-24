export const ALLOWED_FIGMA_SOURCE_FILE =
  "https://www.figma.com/design/A7pWibLNKz5oDP6VilzRqC/Untitled?node-id=0-1&t=SR6KT95J5lfN3HMP-1";

export function assertAllowedFigmaSourceFile(figmaSourceFile) {
  if (figmaSourceFile !== ALLOWED_FIGMA_SOURCE_FILE) {
    throw new Error(
      `Blocked by policy: only this Figma file is allowed: ${ALLOWED_FIGMA_SOURCE_FILE}`
    );
  }
}
