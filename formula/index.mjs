import {CharStreams, CommonTokenStream} from 'antlr4';
import FormulaLexer from './antlr4/formulaLexer.js';
import FormulaParser from './antlr4/formulaParser.js';
import FormulaVisitor from './antlr4/formulaVisitor.js';
import {definedFormulas} from "./formulas/index.js";

class CurrentValueManager {
  constructor() {
    this.scopes = [{}];  // Start with a global scope
  }

  enterScope() {
    this.scopes.push({});
  }

  exitScope() {
    this.scopes.pop();
  }

  declareVariable(name, value) {
    const currentScope = this.scopes[this.scopes.length - 1];

    // if (Object.prototype.hasOwnProperty.call(currentScope, name)) {
    //   throw new Error(`Variable ${name} is already declared in this scope.`);
    // }

    currentScope[name] = value;
  }

  lookupVariable(name) {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (Object.prototype.hasOwnProperty.call(this.scopes[i], name)) {
        return this.scopes[i][name];
      }
    }
    throw new Error(`Variable ${name} is not declared.`);
  }
}

class FormulaVisitorImplementation extends FormulaVisitor {
  constructor(props) {
    super(props);
    this.currentValueManager = new CurrentValueManager();
  }

  visitFunctionCall(ctx) {
    const formulaName = ctx.IDENTIFIER().getText();
    const formulaFunction = definedFormulas[formulaName];

    if (formulaFunction) {
      if (formulaName === "Filter") {
        this.currentValueManager.enterScope();
        try {
          const formula = ctx.expression(1);
          const list = this.visit(ctx.expression(0));

          return list.filter((currentValue) => {
            this.currentValueManager.declareVariable("currentValue", currentValue);
            return this.visit(formula);
          });
        } finally {
          this.currentValueManager.exitScope();
        }
      } else if (formulaName === "ForEach") {
        this.currentValueManager.enterScope();
        try {
          const formula = ctx.expression(1);
          const list = this.visit(ctx.expression(0));

          return list.map((currentValue) => {
            this.currentValueManager.declareVariable("currentValue", currentValue);
            return this.visit(formula);
          });
        } finally {
          this.currentValueManager.exitScope();
        }
      } else {
        const visitedExpressions = ctx.expression().map(expression => this.visit(expression));

        const functionContext = {
          currentValueManager: this.currentValueManager
        };

        return formulaFunction.call(functionContext, ...visitedExpressions);
      }
    } else {
      throw new Error(`Unrecognized function: ${formulaName}`)
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
      case "<":
        return left < right;
      case "<=":
        return left <= right;
      case ">":
        return left > right;
      case ">=":
        return left >= right;
      case "==":
        return left === right;
      case "!=":
        return left !== right;
      default:
        throw new Error(`Unexpected operator in: ${ctx.getText()}`);
      }

    } else {
      return left;
    }
  }

  visitTerm(ctx) {
    if (ctx.expression(0)) {
      return this.visit(ctx.expression(0));
    } else if (ctx.literal(0)) {
      return this.visit(ctx.literal(0));
    } else if (ctx.functionCall(0)) {
      return this.visit(ctx.functionCall(0));
    } else if (ctx.currentValue(0)) {
      return this.visit(ctx.currentValue(0));
    } else {
      throw new Error(`Unexpected term found: ${ctx.getText()}`)
    }
  }

  visitCurrentValue(ctx) {
    return this.currentValueManager.lookupVariable("currentValue");
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


