export const definedFormulas = {};

export function defineFormula(formulaName, formulaFunction, iterative = false) {
  definedFormulas[formulaName] = {
    formulaFunction,
    iterative,
  };
}

export function defineAction(formulaName, formulaFunction, iterative = false) {
  definedFormulas[formulaName] = {
    formulaFunction,
    iterative,
    action: true
  };
}