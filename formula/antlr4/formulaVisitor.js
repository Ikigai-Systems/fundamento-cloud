// Generated from /home/pawel/Development/Ikigai-Systems/interactive-documents-self-hosted-prototype1/formula/formula.g4 by ANTLR 4.13.1
// jshint ignore: start
import antlr4 from 'antlr4';

// This class defines a complete generic visitor for a parse tree produced by formulaParser.

export default class formulaVisitor extends antlr4.tree.ParseTreeVisitor {

	// Visit a parse tree produced by formulaParser#statement.
	visitStatement(ctx) {
	  return this.visitChildren(ctx);
	}


	// Visit a parse tree produced by formulaParser#functionCall.
	visitFunctionCall(ctx) {
	  return this.visitChildren(ctx);
	}


	// Visit a parse tree produced by formulaParser#expression.
	visitExpression(ctx) {
	  return this.visitChildren(ctx);
	}


	// Visit a parse tree produced by formulaParser#term.
	visitTerm(ctx) {
	  return this.visitChildren(ctx);
	}


	// Visit a parse tree produced by formulaParser#operator.
	visitOperator(ctx) {
	  return this.visitChildren(ctx);
	}


	// Visit a parse tree produced by formulaParser#literal.
	visitLiteral(ctx) {
	  return this.visitChildren(ctx);
	}


	// Visit a parse tree produced by formulaParser#currentValue.
	visitCurrentValue(ctx) {
	  return this.visitChildren(ctx);
	}



}