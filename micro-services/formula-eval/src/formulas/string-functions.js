import {defineFormula} from "./define-formula.js";

import _ from "lodash";

// Define the Find function
defineFormula("Join", (delimiter, ...args) => {
  return {result: _.join(args, delimiter), commands: []};
});

defineFormula("Concatenate", (...args) => {
  return {result: _.join(args, ""), commands: []};
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
  return {result: normalizedText.includes(normalizedSearchText), commands: []};
});

defineFormula("EndsWith", (text, suffix, ignoreCase = false, ignoreAccents = false) => {
  const normalizedText = normalizeText(text, ignoreCase, ignoreAccents);
  const normalizedSearchText = normalizeText(suffix, ignoreCase, ignoreAccents);
  return {result: normalizedText.endsWith(normalizedSearchText), commands: []};
});

defineFormula("StartsWith", (text, prefix, ignoreCase = false, ignoreAccents = false) => {
  const normalizedText = normalizeText(text, ignoreCase, ignoreAccents);
  const normalizedSearchText = normalizeText(prefix, ignoreCase, ignoreAccents);
  return {result: normalizedText.startsWith(normalizedSearchText), commands: []};
});

defineFormula("Substitute", (text, searchFor, replacementText) => {
  return {result: text.replace(searchFor, replacementText), commands: []};
});

defineFormula("SubstituteAll", (text, searchFor, replacementText) => {
  return {result: text.replaceAll(searchFor, replacementText), commands: []};
});

defineFormula("Upper", (text) => {
  return {result: text.toUpperCase(), commands: []};
});

defineFormula("Lower", (text) => {
  return {result: text.toLowerCase(), commands: []};
});
