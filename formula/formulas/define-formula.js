export const definedFormulas = {};

export function defineFormula(formulaName, formulaFunction) {
  definedFormulas[formulaName] = formulaFunction;
}