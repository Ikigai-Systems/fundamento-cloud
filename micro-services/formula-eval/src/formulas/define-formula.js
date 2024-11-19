export const definedFormulas = {};

export function defineFormula(formulaName, formulaFunction, iterative = false) {
  definedFormulas[formulaName] = {
    formulaFunction,
    iterative,
  };
}