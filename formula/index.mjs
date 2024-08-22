import {CharStreams, CommonTokenStream} from 'antlr4';
import MyGrammarLexer from './antlr4/formulaLexer.js';
import MyGrammarParser from './antlr4/formulaParser.js';
import FormulaVisitor from './antlr4/formulaVisitor.js';

const input = 'Find("world", "hello world")';
const inputStream = CharStreams.fromString(input);
const lexer = new MyGrammarLexer(inputStream);
const tokenStream = new CommonTokenStream(lexer);
const parser = new MyGrammarParser(tokenStream);

const tree = parser.program(); // Assuming 'program' is your start rule

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

console.log(tree.toStringTree(parser.ruleNames));

const visitor = new FormulaVisitorImplementation();

console.log(visitor.visit(tree));