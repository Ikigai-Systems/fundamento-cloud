import {CharStreams, CommonTokenStream} from 'antlr4';
import FormulaLexer from './antlr4/formulaLexer.js';
import FormulaParser from './antlr4/formulaParser.js';
import FormulaVisitor from './antlr4/formulaVisitor.js';
import {definedFormulas} from "./formulas/index.js";
import _ from "lodash";

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
  constructor(context) {
    super();

    this.context = context;
    this.currentValueManager = new CurrentValueManager();
  }

  visitStatement(ctx) {
    return _.first(super.visitStatement(ctx));
  }

  visitFunctionCall(ctx) {
    const formulaName = ctx.IDENTIFIER().getText();
    const formulaDefinition = definedFormulas[formulaName];

    if (formulaDefinition) {
      const {formulaFunction, iterative} = formulaDefinition;

      const functionContext = {
        ...this.context,
      };

      if (iterative) {
        this.currentValueManager.enterScope();
        try {
          const formula = ctx.expression(1);
          if (formula === null) {
            throw new Error(`Missing arguments in ${formulaName} formula`);
          }
          const {result, commands} = this.visit(ctx.expression(0));

          const called = formulaFunction.call(functionContext, result, (currentValue) => {
            this.currentValueManager.declareVariable("currentValue", currentValue);
            return this.visit(formula);
          });
          return called;
        } finally {
          this.currentValueManager.exitScope();
        }
      } else {
        const visitedExpressions = ctx.expression().map((expression, index) => {
          if (formulaName === "AddOrUpdateRows" && index === 1) {
            const rawText = expression.getText();
            const resultText = (rawText.indexOf("CurrentValue") !== -1)
              ? rawText.replaceAll("CurrentValue", `"${this.currentValueManager.lookupVariable("currentValue")}"`)
              : rawText;
            return {result: resultText, commands: []};
          } else {
            return this.visit(expression);
          }
        });

        const formulaResult = formulaFunction.call(functionContext, ...visitedExpressions.map(visitedExpression => visitedExpression.result));
        return {
          result: formulaResult.result,
          commands: [...visitedExpressions.flatMap(visitedExpression => visitedExpression.commands), ...formulaResult.commands],
        };
      }
    } else {
      throw new Error(`Unrecognized formula: ${formulaName}`)
    }
  }

  visitLiteral(ctx) {
    if (ctx.NUMBER()) {
      return {result: parseFloat(ctx.NUMBER().getText()), commands: []};
    } else if (ctx.STRING()) {
      // Use JSON.parse to handle escape characters
      return {result: JSON.parse(ctx.STRING().getText()), commands: []};
    }
    throw new Error(`Unrecognized literal found ${ctx.getText()}`)
  }

  visitReference(ctx) {
    const referenceName = ctx.IDENTIFIER().getText();
    if (Object.hasOwn(this.context, referenceName)) {
      return {
        result: this.context[referenceName],
        commands: []
      }
    } else {
      throw new Error(`Unrecognized reference found ${referenceName}`)
    }
  }

  visitExpression(ctx) {
    const left = this.visit(ctx.term(0));

    if (ctx.operator(0)) {
      const right = this.visit(ctx.term(1));
      const operator = ctx.operator(0).getText();
      const commands = [...left.commands, ...right.commands];
      let result;

      switch (operator) {
      case "+":
        result = left.result + right.result; break;
      case "*":
        result = left.result * right.result; break;
      case "/":
        result = left.result / right.result; break;
      case "-":
        result = left.result - right.result; break;
      case "<":
        result = left.result < right.result; break;
      case "<=":
        result = left.result <= right.result; break;
      case ">":
        result = left.result > right.result; break;
      case ">=":
        result = left.result >= right.result; break;
      case "==":
        result = left.result === right.result; break;
      case "!=":
        result = left.result !== right.result; break;
      default:
        throw new Error(`Unexpected operator in: ${ctx.getText()}`);
      }
      return {result, commands}
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
    } else if (ctx.reference(0)) {
      return this.visit(ctx.reference(0));
    } else {
      throw new Error(`Unexpected term found: ${ctx.getText()}`)
    }
  }

  visitCurrentValue(ctx) {
    return {result: this.currentValueManager.lookupVariable("currentValue"), commands: []};
  }
}

export default function evaluateFormula(inputString, context = {}) {
  const inputStream = CharStreams.fromString(inputString);
  const lexer = new FormulaLexer(inputStream);
  const tokenStream = new CommonTokenStream(lexer);
  const parser = new FormulaParser(tokenStream);

  const tree = parser.statement();

  console.log(tree.toStringTree(parser.ruleNames));

  const visitor = new FormulaVisitorImplementation(context);

  return visitor.visit(tree);
}


