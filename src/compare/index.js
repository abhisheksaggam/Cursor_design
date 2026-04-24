function flattenTokenTree(tokens) {
  const flattened = {};
  for (const [group, groupTokens] of Object.entries(tokens)) {
    for (const [name, token] of Object.entries(groupTokens || {})) {
      flattened[name] = { group, ...token };
    }
  }
  return flattened;
}

function stringifyValue(value) {
  return JSON.stringify(value);
}

function valueChanged(sourceToken, figmaToken) {
  return stringifyValue(sourceToken.value) !== stringifyValue(figmaToken.value);
}

function modeMismatch(sourceToken, figmaToken) {
  const sourceModes = sourceToken.modes || null;
  const figmaModes = figmaToken.modes || null;
  return stringifyValue(sourceModes) !== stringifyValue(figmaModes);
}

export function compareSourceToFigma(sourceDoc, figmaDoc) {
  const source = flattenTokenTree(sourceDoc.tokens || {});
  const figma = flattenTokenTree(figmaDoc.tokens || {});
  const sourceKeys = Object.keys(source);
  const figmaKeys = Object.keys(figma);

  const missingInFigma = sourceKeys.filter((key) => !figma[key]);
  const extraInFigma = figmaKeys.filter((key) => !source[key]);

  const valueChanges = sourceKeys
    .filter((key) => figma[key] && valueChanged(source[key], figma[key]))
    .map((key) => ({
      token: key,
      sourceValue: source[key].value,
      figmaValue: figma[key].value
    }));

  const modeMismatches = sourceKeys
    .filter((key) => figma[key] && modeMismatch(source[key], figma[key]))
    .map((key) => ({
      token: key,
      sourceModes: source[key].modes || null,
      figmaModes: figma[key].modes || null
    }));

  const renamedCandidates = [];
  for (const sourceKey of missingInFigma) {
    for (const figmaKey of extraInFigma) {
      if (stringifyValue(source[sourceKey].value) === stringifyValue(figma[figmaKey].value)) {
        renamedCandidates.push({
          sourceToken: sourceKey,
          figmaToken: figmaKey
        });
      }
    }
  }

  const breaking =
    missingInFigma.length > 0 ||
    valueChanges.length > 0 ||
    modeMismatches.length > 0 ||
    renamedCandidates.length > 0;

  return {
    summary: {
      missingInFigma: missingInFigma.length,
      extraInFigma: extraInFigma.length,
      valueChanges: valueChanges.length,
      modeMismatches: modeMismatches.length,
      renamedCandidates: renamedCandidates.length,
      breaking
    },
    missingInFigma,
    extraInFigma,
    valueChanges,
    modeMismatches,
    renamedCandidates
  };
}
