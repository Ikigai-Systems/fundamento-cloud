// Generated from /home/pawel/Development/Ikigai-Systems/interactive-documents-self-hosted-prototype1/formula/formula.g4 by ANTLR 4.13.1
// jshint ignore: start
import antlr4 from 'antlr4';
import formulaListener from './formulaListener.js';
import formulaVisitor from './formulaVisitor.js';

const serializedATN = [4,1,12,73,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,
2,5,7,5,2,6,7,6,2,7,7,7,2,8,7,8,1,0,4,0,20,8,0,11,0,12,0,21,1,1,1,1,3,1,
26,8,1,1,2,1,2,1,2,1,2,1,2,5,2,33,8,2,10,2,12,2,36,9,2,3,2,38,8,2,1,2,1,
2,1,3,1,3,1,3,1,3,3,3,46,8,3,1,4,1,4,1,4,1,4,5,4,52,8,4,10,4,12,4,55,9,4,
1,5,1,5,1,5,1,5,1,5,1,5,3,5,63,8,5,1,6,1,6,1,6,1,6,1,7,1,7,1,8,1,8,1,8,0,
0,9,0,2,4,6,8,10,12,14,16,0,2,1,0,4,8,1,0,10,11,71,0,19,1,0,0,0,2,25,1,0,
0,0,4,27,1,0,0,0,6,45,1,0,0,0,8,47,1,0,0,0,10,62,1,0,0,0,12,64,1,0,0,0,14,
68,1,0,0,0,16,70,1,0,0,0,18,20,3,2,1,0,19,18,1,0,0,0,20,21,1,0,0,0,21,19,
1,0,0,0,21,22,1,0,0,0,22,1,1,0,0,0,23,26,3,4,2,0,24,26,3,8,4,0,25,23,1,0,
0,0,25,24,1,0,0,0,26,3,1,0,0,0,27,28,5,9,0,0,28,37,5,1,0,0,29,34,3,6,3,0,
30,31,5,2,0,0,31,33,3,6,3,0,32,30,1,0,0,0,33,36,1,0,0,0,34,32,1,0,0,0,34,
35,1,0,0,0,35,38,1,0,0,0,36,34,1,0,0,0,37,29,1,0,0,0,37,38,1,0,0,0,38,39,
1,0,0,0,39,40,5,3,0,0,40,5,1,0,0,0,41,46,3,8,4,0,42,43,5,9,0,0,43,44,5,4,
0,0,44,46,3,8,4,0,45,41,1,0,0,0,45,42,1,0,0,0,46,7,1,0,0,0,47,53,3,10,5,
0,48,49,3,14,7,0,49,50,3,10,5,0,50,52,1,0,0,0,51,48,1,0,0,0,52,55,1,0,0,
0,53,51,1,0,0,0,53,54,1,0,0,0,54,9,1,0,0,0,55,53,1,0,0,0,56,63,3,16,8,0,
57,63,3,4,2,0,58,59,5,1,0,0,59,60,3,8,4,0,60,61,5,3,0,0,61,63,1,0,0,0,62,
56,1,0,0,0,62,57,1,0,0,0,62,58,1,0,0,0,63,11,1,0,0,0,64,65,3,10,5,0,65,66,
3,14,7,0,66,67,3,10,5,0,67,13,1,0,0,0,68,69,7,0,0,0,69,15,1,0,0,0,70,71,
7,1,0,0,71,17,1,0,0,0,7,21,25,34,37,45,53,62];


const atn = new antlr4.atn.ATNDeserializer().deserialize(serializedATN);

const decisionsToDFA = atn.decisionToState.map( (ds, index) => new antlr4.dfa.DFA(ds, index) );

const sharedContextCache = new antlr4.atn.PredictionContextCache();

export default class formulaParser extends antlr4.Parser {

    static grammarFileName = "formula.g4";
    static literalNames = [ null, "'('", "','", "')'", "'='", "'+'", "'-'", 
                            "'*'", "'/'" ];
    static symbolicNames = [ null, null, null, null, null, null, null, null, 
                             null, "IDENTIFIER", "NUMBER", "STRING", "WS" ];
    static ruleNames = [ "program", "statement", "functionCall", "parameter", 
                         "expression", "term", "binaryOperation", "operator", 
                         "literal" ];

    constructor(input) {
        super(input);
        this._interp = new antlr4.atn.ParserATNSimulator(this, atn, decisionsToDFA, sharedContextCache);
        this.ruleNames = formulaParser.ruleNames;
        this.literalNames = formulaParser.literalNames;
        this.symbolicNames = formulaParser.symbolicNames;
    }



	program() {
	    let localctx = new ProgramContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 0, formulaParser.RULE_program);
	    var _la = 0;
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 19; 
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        do {
	            this.state = 18;
	            this.statement();
	            this.state = 21; 
	            this._errHandler.sync(this);
	            _la = this._input.LA(1);
	        } while((((_la) & ~0x1f) === 0 && ((1 << _la) & 3586) !== 0));
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	statement() {
	    let localctx = new StatementContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 2, formulaParser.RULE_statement);
	    try {
	        this.state = 25;
	        this._errHandler.sync(this);
	        var la_ = this._interp.adaptivePredict(this._input,1,this._ctx);
	        switch(la_) {
	        case 1:
	            this.enterOuterAlt(localctx, 1);
	            this.state = 23;
	            this.functionCall();
	            break;

	        case 2:
	            this.enterOuterAlt(localctx, 2);
	            this.state = 24;
	            this.expression();
	            break;

	        }
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	functionCall() {
	    let localctx = new FunctionCallContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 4, formulaParser.RULE_functionCall);
	    var _la = 0;
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 27;
	        this.match(formulaParser.IDENTIFIER);
	        this.state = 28;
	        this.match(formulaParser.T__0);
	        this.state = 37;
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        if((((_la) & ~0x1f) === 0 && ((1 << _la) & 3586) !== 0)) {
	            this.state = 29;
	            this.parameter();
	            this.state = 34;
	            this._errHandler.sync(this);
	            _la = this._input.LA(1);
	            while(_la===2) {
	                this.state = 30;
	                this.match(formulaParser.T__1);
	                this.state = 31;
	                this.parameter();
	                this.state = 36;
	                this._errHandler.sync(this);
	                _la = this._input.LA(1);
	            }
	        }

	        this.state = 39;
	        this.match(formulaParser.T__2);
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	parameter() {
	    let localctx = new ParameterContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 6, formulaParser.RULE_parameter);
	    try {
	        this.state = 45;
	        this._errHandler.sync(this);
	        var la_ = this._interp.adaptivePredict(this._input,4,this._ctx);
	        switch(la_) {
	        case 1:
	            this.enterOuterAlt(localctx, 1);
	            this.state = 41;
	            this.expression();
	            break;

	        case 2:
	            this.enterOuterAlt(localctx, 2);
	            this.state = 42;
	            this.match(formulaParser.IDENTIFIER);
	            this.state = 43;
	            this.match(formulaParser.T__3);
	            this.state = 44;
	            this.expression();
	            break;

	        }
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	expression() {
	    let localctx = new ExpressionContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 8, formulaParser.RULE_expression);
	    var _la = 0;
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 47;
	        this.term();
	        this.state = 53;
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        while((((_la) & ~0x1f) === 0 && ((1 << _la) & 496) !== 0)) {
	            this.state = 48;
	            this.operator();
	            this.state = 49;
	            this.term();
	            this.state = 55;
	            this._errHandler.sync(this);
	            _la = this._input.LA(1);
	        }
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	term() {
	    let localctx = new TermContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 10, formulaParser.RULE_term);
	    try {
	        this.state = 62;
	        this._errHandler.sync(this);
	        switch(this._input.LA(1)) {
	        case 10:
	        case 11:
	            this.enterOuterAlt(localctx, 1);
	            this.state = 56;
	            this.literal();
	            break;
	        case 9:
	            this.enterOuterAlt(localctx, 2);
	            this.state = 57;
	            this.functionCall();
	            break;
	        case 1:
	            this.enterOuterAlt(localctx, 3);
	            this.state = 58;
	            this.match(formulaParser.T__0);
	            this.state = 59;
	            this.expression();
	            this.state = 60;
	            this.match(formulaParser.T__2);
	            break;
	        default:
	            throw new antlr4.error.NoViableAltException(this);
	        }
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	binaryOperation() {
	    let localctx = new BinaryOperationContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 12, formulaParser.RULE_binaryOperation);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 64;
	        this.term();
	        this.state = 65;
	        this.operator();
	        this.state = 66;
	        this.term();
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	operator() {
	    let localctx = new OperatorContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 14, formulaParser.RULE_operator);
	    var _la = 0;
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 68;
	        _la = this._input.LA(1);
	        if(!((((_la) & ~0x1f) === 0 && ((1 << _la) & 496) !== 0))) {
	        this._errHandler.recoverInline(this);
	        }
	        else {
	        	this._errHandler.reportMatch(this);
	            this.consume();
	        }
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	literal() {
	    let localctx = new LiteralContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 16, formulaParser.RULE_literal);
	    var _la = 0;
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 70;
	        _la = this._input.LA(1);
	        if(!(_la===10 || _la===11)) {
	        this._errHandler.recoverInline(this);
	        }
	        else {
	        	this._errHandler.reportMatch(this);
	            this.consume();
	        }
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}


}

formulaParser.EOF = antlr4.Token.EOF;
formulaParser.T__0 = 1;
formulaParser.T__1 = 2;
formulaParser.T__2 = 3;
formulaParser.T__3 = 4;
formulaParser.T__4 = 5;
formulaParser.T__5 = 6;
formulaParser.T__6 = 7;
formulaParser.T__7 = 8;
formulaParser.IDENTIFIER = 9;
formulaParser.NUMBER = 10;
formulaParser.STRING = 11;
formulaParser.WS = 12;

formulaParser.RULE_program = 0;
formulaParser.RULE_statement = 1;
formulaParser.RULE_functionCall = 2;
formulaParser.RULE_parameter = 3;
formulaParser.RULE_expression = 4;
formulaParser.RULE_term = 5;
formulaParser.RULE_binaryOperation = 6;
formulaParser.RULE_operator = 7;
formulaParser.RULE_literal = 8;

class ProgramContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = formulaParser.RULE_program;
    }

	statement = function(i) {
	    if(i===undefined) {
	        i = null;
	    }
	    if(i===null) {
	        return this.getTypedRuleContexts(StatementContext);
	    } else {
	        return this.getTypedRuleContext(StatementContext,i);
	    }
	};

	enterRule(listener) {
	    if(listener instanceof formulaListener ) {
	        listener.enterProgram(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof formulaListener ) {
	        listener.exitProgram(this);
		}
	}

	accept(visitor) {
	    if ( visitor instanceof formulaVisitor ) {
	        return visitor.visitProgram(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	}


}



class StatementContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = formulaParser.RULE_statement;
    }

	functionCall() {
	    return this.getTypedRuleContext(FunctionCallContext,0);
	};

	expression() {
	    return this.getTypedRuleContext(ExpressionContext,0);
	};

	enterRule(listener) {
	    if(listener instanceof formulaListener ) {
	        listener.enterStatement(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof formulaListener ) {
	        listener.exitStatement(this);
		}
	}

	accept(visitor) {
	    if ( visitor instanceof formulaVisitor ) {
	        return visitor.visitStatement(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	}


}



class FunctionCallContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = formulaParser.RULE_functionCall;
    }

	IDENTIFIER() {
	    return this.getToken(formulaParser.IDENTIFIER, 0);
	};

	parameter = function(i) {
	    if(i===undefined) {
	        i = null;
	    }
	    if(i===null) {
	        return this.getTypedRuleContexts(ParameterContext);
	    } else {
	        return this.getTypedRuleContext(ParameterContext,i);
	    }
	};

	enterRule(listener) {
	    if(listener instanceof formulaListener ) {
	        listener.enterFunctionCall(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof formulaListener ) {
	        listener.exitFunctionCall(this);
		}
	}

	accept(visitor) {
	    if ( visitor instanceof formulaVisitor ) {
	        return visitor.visitFunctionCall(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	}


}



class ParameterContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = formulaParser.RULE_parameter;
    }

	expression() {
	    return this.getTypedRuleContext(ExpressionContext,0);
	};

	IDENTIFIER() {
	    return this.getToken(formulaParser.IDENTIFIER, 0);
	};

	enterRule(listener) {
	    if(listener instanceof formulaListener ) {
	        listener.enterParameter(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof formulaListener ) {
	        listener.exitParameter(this);
		}
	}

	accept(visitor) {
	    if ( visitor instanceof formulaVisitor ) {
	        return visitor.visitParameter(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	}


}



class ExpressionContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = formulaParser.RULE_expression;
    }

	term = function(i) {
	    if(i===undefined) {
	        i = null;
	    }
	    if(i===null) {
	        return this.getTypedRuleContexts(TermContext);
	    } else {
	        return this.getTypedRuleContext(TermContext,i);
	    }
	};

	operator = function(i) {
	    if(i===undefined) {
	        i = null;
	    }
	    if(i===null) {
	        return this.getTypedRuleContexts(OperatorContext);
	    } else {
	        return this.getTypedRuleContext(OperatorContext,i);
	    }
	};

	enterRule(listener) {
	    if(listener instanceof formulaListener ) {
	        listener.enterExpression(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof formulaListener ) {
	        listener.exitExpression(this);
		}
	}

	accept(visitor) {
	    if ( visitor instanceof formulaVisitor ) {
	        return visitor.visitExpression(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	}


}



class TermContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = formulaParser.RULE_term;
    }

	literal() {
	    return this.getTypedRuleContext(LiteralContext,0);
	};

	functionCall() {
	    return this.getTypedRuleContext(FunctionCallContext,0);
	};

	expression() {
	    return this.getTypedRuleContext(ExpressionContext,0);
	};

	enterRule(listener) {
	    if(listener instanceof formulaListener ) {
	        listener.enterTerm(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof formulaListener ) {
	        listener.exitTerm(this);
		}
	}

	accept(visitor) {
	    if ( visitor instanceof formulaVisitor ) {
	        return visitor.visitTerm(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	}


}



class BinaryOperationContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = formulaParser.RULE_binaryOperation;
    }

	term = function(i) {
	    if(i===undefined) {
	        i = null;
	    }
	    if(i===null) {
	        return this.getTypedRuleContexts(TermContext);
	    } else {
	        return this.getTypedRuleContext(TermContext,i);
	    }
	};

	operator() {
	    return this.getTypedRuleContext(OperatorContext,0);
	};

	enterRule(listener) {
	    if(listener instanceof formulaListener ) {
	        listener.enterBinaryOperation(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof formulaListener ) {
	        listener.exitBinaryOperation(this);
		}
	}

	accept(visitor) {
	    if ( visitor instanceof formulaVisitor ) {
	        return visitor.visitBinaryOperation(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	}


}



class OperatorContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = formulaParser.RULE_operator;
    }


	enterRule(listener) {
	    if(listener instanceof formulaListener ) {
	        listener.enterOperator(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof formulaListener ) {
	        listener.exitOperator(this);
		}
	}

	accept(visitor) {
	    if ( visitor instanceof formulaVisitor ) {
	        return visitor.visitOperator(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	}


}



class LiteralContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = formulaParser.RULE_literal;
    }

	NUMBER() {
	    return this.getToken(formulaParser.NUMBER, 0);
	};

	STRING() {
	    return this.getToken(formulaParser.STRING, 0);
	};

	enterRule(listener) {
	    if(listener instanceof formulaListener ) {
	        listener.enterLiteral(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof formulaListener ) {
	        listener.exitLiteral(this);
		}
	}

	accept(visitor) {
	    if ( visitor instanceof formulaVisitor ) {
	        return visitor.visitLiteral(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	}


}




formulaParser.ProgramContext = ProgramContext; 
formulaParser.StatementContext = StatementContext; 
formulaParser.FunctionCallContext = FunctionCallContext; 
formulaParser.ParameterContext = ParameterContext; 
formulaParser.ExpressionContext = ExpressionContext; 
formulaParser.TermContext = TermContext; 
formulaParser.BinaryOperationContext = BinaryOperationContext; 
formulaParser.OperatorContext = OperatorContext; 
formulaParser.LiteralContext = LiteralContext; 
