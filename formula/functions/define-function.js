export const definedFunctions = {};

export function defineFunction(functionName, formulaFunction) {
  definedFunctions[functionName] = formulaFunction;
}