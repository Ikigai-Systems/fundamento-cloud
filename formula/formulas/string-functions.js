import {defineFormula} from "./define-formula.js";

import _ from "lodash";

// Define the Find function
defineFormula("Join", (delimiter, ...args) => {
  return _.join(args, delimiter);
});

function normalizeText(text, ignoreCase, ignoreAccents) {
  if (ignoreAccents) {
    text = _.deburr(text);
  }
  if (ignoreCase) {
    text = text.toLowerCase();
  }
  return text;
}

defineFormula("ContainsText", (text, searchText, ignoreCase = false, ignoreAccents = false) => {
  const normalizedText = normalizeText(text, ignoreCase, ignoreAccents);
  const normalizedSearchText = normalizeText(searchText, ignoreCase, ignoreAccents);
  return normalizedText.includes(normalizedSearchText);
});

defineFormula("EndsWith", (text, suffix, ignoreCase = false, ignoreAccents = false) => {
  const normalizedText = normalizeText(text, ignoreCase, ignoreAccents);
  const normalizedSearchText = normalizeText(suffix, ignoreCase, ignoreAccents);
  return normalizedText.endsWith(normalizedSearchText);
});

defineFormula("StartsWith", (text, prefix, ignoreCase = false, ignoreAccents = false) => {
  const normalizedText = normalizeText(text, ignoreCase, ignoreAccents);
  const normalizedSearchText = normalizeText(prefix, ignoreCase, ignoreAccents);
  return normalizedText.startsWith(normalizedSearchText);
});

defineFormula("Substitute", (text, searchFor, replacementText) => {
  return text.replace(searchFor, replacementText);
});

defineFormula("SubstituteAll", (text, searchFor, replacementText) => {
  return text.replaceAll(searchFor, replacementText);
});

defineFormula("Upper", (text) => {
  return text.toUpperCase();
});

defineFormula("Lower", (text) => {
  return text.toLowerCase();
});
