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
  return arg2.indexOf(arg1) !== -1;
});

defineFunction("CountUnique", (...args) => {
  return _.uniq(args).length;
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
    const formulaFunction = definedFunctions[functionName];

    if (formulaFunction) {
      const visitedExpressions = ctx.expression().map(expression => this.visit(expression));

      return formulaFunction(...visitedExpressions);
    } else {
      throw new Error(`Unrecognized function: ${functionName}`)
    }
  }

  visitLiteral(ctx) {
    if (ctx.NUMBER()) {
      return parseFloat(ctx.NUMBER().getText());
    } else if (ctx.STRING()) {
      return ctx.STRING().getText().replace(/"/g, '');
    }
    throw new Error(`Unrecognized literal found ${ctx.getText()}`)
  }

  visitExpression(ctx) {
    const left = this.visit(ctx.term(0));

    if (ctx.operator(0)) {
      const right = this.visit(ctx.term(1))
      const operator = ctx.operator(0).getText();

      switch (operator) {
      case "+":
        return left + right;
      case "*":
        return left * right;
      case "/":
        return left / right;
      case "-":
        return left - right;
      default:
        throw new Error(`Unexpected operator in: ${ctx.getText()}`);
      }

    } else {
      return left;
    }
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


