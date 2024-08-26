import {CharStreams, CommonTokenStream} from 'antlr4';
import FormulaLexer from './antlr4/formulaLexer.js';
import FormulaParser from './antlr4/formulaParser.js';
import FormulaVisitor from './antlr4/formulaVisitor.js';
import _ from "lodash";

const definedFunctions = {};

function defineFunction(functionName, formulaFunction) {
  definedFunctions[functionName] = formulaFunction;
}

// Define the Find function
defineFunction("Find", (arg1, arg2) => {
  console.log(`Find function called with arguments: ${arg1}, ${arg2}`);

  return arg2.indexOf(arg1) !== -1;
});

defineFunction("CountUnique", () => {
  return _.uniq(arguments).length;
});

defineFunction("And", (...[arg1, arg2]) => {
  return !!arg1 && !!arg2;
});

defineFunction("True", () => {
  return true;
});

defineFunction("False", () => {
  return false;
});

class FormulaVisitorImplementation extends FormulaVisitor {
  visitFunctionCall(ctx) {
    const functionName = ctx.IDENTIFIER().getText();
    // const args = ctx.expression().map(param => param.getText().replace(/"/g, ''));

    const formulaFunction = definedFunctions[functionName];

    if (formulaFunction) {
      const visitedExpressions = ctx.expression().map(expression => this.visit(expression));

      return formulaFunction(...visitedExpressions);
    } else {
      throw new Error(`Unrecognized function: ${functionName}`)
    }
  }

  visitLiteral(ctx) {
    return super.visitLiteral(ctx);
  }

  visitExpression(ctx) {
    return this.visit(ctx.term(0));
  }

  visitTerm(ctx) {
    return _.first(super.visitTerm(ctx));
  }
}

export function evaluateFormula(inputString) {
  const inputStream = CharStreams.fromString(inputString);
  const lexer = new FormulaLexer(inputStream);
  const tokenStream = new CommonTokenStream(lexer);
  const parser = new FormulaParser(tokenStream);

  const tree = parser.program(); // Assuming 'program' is your start rule

  console.log(tree.toStringTree(parser.ruleNames));

  const visitor = new FormulaVisitorImplementation();

  return visitor.visit(tree);
}


