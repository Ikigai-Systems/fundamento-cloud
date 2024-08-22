import {CharStreams, CommonTokenStream} from 'antlr4';
import FormulaLexer from './antlr4/formulaLexer.js';
import FormulaParser from './antlr4/formulaParser.js';
import FormulaVisitor from './antlr4/formulaVisitor.js';

// Define the Find function
function Find(arg1, arg2) {
  console.log(`Find function called with arguments: ${arg1}, ${arg2}`);

  return arg2.indexOf(arg1) !== -1;
}

class FormulaVisitorImplementation extends FormulaVisitor {
  visitFunctionCall(ctx) {
    const functionName = ctx.IDENTIFIER().getText();
    const args = ctx.parameter().map(param => param.getText().replace(/"/g, ''));
    if (functionName === 'Find') {
      return Find(...args);
    }
    return this.visitChildren(ctx);
  }
}

export function evaluateFormula(inputString) {
  const inputStream = CharStreams.fromString(inputString);
  const lexer = new FormulaLexer(inputStream);
  const tokenStream = new CommonTokenStream(lexer);
  const parser = new FormulaParser(tokenStream);

  const tree = parser.program(); // Assuming 'program' is your start rule

  // console.log(tree.toStringTree(parser.ruleNames));

  const visitor = new FormulaVisitorImplementation();

  return visitor.visit(tree);
}


