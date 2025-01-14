export const definedFormulas = {};

export function defineFormula(formulaName, formulaFunction, iterative = false) {
  definedFormulas[formulaName] = {
    formulaFunction,
    iterative,
  };
}

export function defineCommand(formulaName, formulaFunction, iterative = false) {
  definedFormulas[formulaName] = {
    formulaFunction,
    iterative,
    command: true
  };
}