import {defineFunction} from "./define-function.js";

import _ from "lodash";

// Define the Find function
defineFunction("Join", (delimiter, ...args) => {
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

defineFunction("ContainsText", (text, searchText, ignoreCase = false, ignoreAccents = false) => {
  const normalizedText = normalizeText(text, ignoreCase, ignoreAccents);
  const normalizedSearchText = normalizeText(searchText, ignoreCase, ignoreAccents);
  return normalizedText.includes(normalizedSearchText);
});

defineFunction("EndsWith", (text, suffix, ignoreCase = false, ignoreAccents = false) => {
  const normalizedText = normalizeText(text, ignoreCase, ignoreAccents);
  const normalizedSearchText = normalizeText(suffix, ignoreCase, ignoreAccents);
  return normalizedText.endsWith(normalizedSearchText);
});

defineFunction("StartsWith", (text, prefix, ignoreCase = false, ignoreAccents = false) => {
  const normalizedText = normalizeText(text, ignoreCase, ignoreAccents);
  const normalizedSearchText = normalizeText(prefix, ignoreCase, ignoreAccents);
  return normalizedText.startsWith(normalizedSearchText);
});

defineFunction("Substitute", (text, searchFor, replacementText) => {
  return text.replace(searchFor, replacementText);
});

defineFunction("SubstituteAll", (text, searchFor, replacementText) => {
  return text.replaceAll(searchFor, replacementText);
});

defineFunction("Upper", (text) => {
  return text.toUpperCase();
});

defineFunction("Lower", (text) => {
  return text.toLowerCase();
});
