export const ALLOWED_FIGMA_SOURCE_FILE =
  "https://www.figma.com/design/zFN780oP27DS6zOAhdRSU7/Cursor?node-id=1-777&t=JDkt7LLCh9P0uIBS-1";

export function assertAllowedFigmaSourceFile(figmaSourceFile) {
  if (figmaSourceFile !== ALLOWED_FIGMA_SOURCE_FILE) {
    throw new Error(
      `Blocked by policy: only this Figma file is allowed: ${ALLOWED_FIGMA_SOURCE_FILE}`
    );
  }
}
