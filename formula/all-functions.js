import _ from "lodash";

export const definedFunctions = {};

function defineFunction(functionName, formulaFunction) {
    definedFunctions[functionName] = formulaFunction;
}

// Define the Find function
defineFunction("Find", (arg1, arg2) => {
    return arg2.indexOf(arg1) !== -1;
});

defineFunction("CountUnique", (...args) => {
    return _.uniq(args).length;
});

defineFunction("And", (...[arg1, arg2]) => {
    return !!arg1 && !!arg2;
});

defineFunction("Not", (value) => {
    return !value;
});

defineFunction("Or", (...[arg1, arg2]) => {
    return !!arg1 || !!arg2;
});

defineFunction("True", () => {
    return true;
});

defineFunction("False", () => {
    return false;
});

defineFunction("If", (condition, ifTrue, ifFalse) => {
    if (!!condition) {
        return ifTrue;
    } else {
        return ifFalse;
    }
});

defineFunction("IfBlank", (text, ifBlank) => {
    if (text === "") {
        return ifBlank;
    } else {
        return text;
    }
});

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
