// Generated from /home/pawel/Development/Ikigai-Systems/interactive-documents-self-hosted-prototype1/formula/formula.g4 by ANTLR 4.13.1
// jshint ignore: start
import antlr4 from 'antlr4';
import formulaListener from './formulaListener.js';
import formulaVisitor from './formulaVisitor.js';

const serializedATN = [4,1,17,56,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,
2,5,7,5,2,6,7,6,1,0,1,0,1,1,1,1,3,1,19,8,1,1,2,1,2,1,2,1,2,1,2,5,2,26,8,
2,10,2,12,2,29,9,2,3,2,31,8,2,1,2,1,2,1,3,1,3,1,3,1,3,5,3,39,8,3,10,3,12,
3,42,9,3,1,4,1,4,1,4,1,4,1,4,1,4,3,4,50,8,4,1,5,1,5,1,6,1,6,1,6,0,0,7,0,
2,4,6,8,10,12,0,2,1,0,1,10,1,0,12,13,54,0,14,1,0,0,0,2,18,1,0,0,0,4,20,1,
0,0,0,6,34,1,0,0,0,8,49,1,0,0,0,10,51,1,0,0,0,12,53,1,0,0,0,14,15,3,2,1,
0,15,1,1,0,0,0,16,19,3,4,2,0,17,19,3,6,3,0,18,16,1,0,0,0,18,17,1,0,0,0,19,
3,1,0,0,0,20,21,5,11,0,0,21,30,5,14,0,0,22,27,3,6,3,0,23,24,5,16,0,0,24,
26,3,6,3,0,25,23,1,0,0,0,26,29,1,0,0,0,27,25,1,0,0,0,27,28,1,0,0,0,28,31,
1,0,0,0,29,27,1,0,0,0,30,22,1,0,0,0,30,31,1,0,0,0,31,32,1,0,0,0,32,33,5,
15,0,0,33,5,1,0,0,0,34,40,3,8,4,0,35,36,3,10,5,0,36,37,3,8,4,0,37,39,1,0,
0,0,38,35,1,0,0,0,39,42,1,0,0,0,40,38,1,0,0,0,40,41,1,0,0,0,41,7,1,0,0,0,
42,40,1,0,0,0,43,50,3,12,6,0,44,50,3,4,2,0,45,46,5,14,0,0,46,47,3,6,3,0,
47,48,5,15,0,0,48,50,1,0,0,0,49,43,1,0,0,0,49,44,1,0,0,0,49,45,1,0,0,0,50,
9,1,0,0,0,51,52,7,0,0,0,52,11,1,0,0,0,53,54,7,1,0,0,54,13,1,0,0,0,5,18,27,
30,40,49];


const atn = new antlr4.atn.ATNDeserializer().deserialize(serializedATN);

const decisionsToDFA = atn.decisionToState.map( (ds, index) => new antlr4.dfa.DFA(ds, index) );

const sharedContextCache = new antlr4.atn.PredictionContextCache();

export default class formulaParser extends antlr4.Parser {

    static grammarFileName = "formula.g4";
    static literalNames = [ null, "'+'", "'-'", "'*'", "'/'", "'>'", "'>='", 
                            "'<'", "'<='", "'=='", "'!='", null, null, null, 
                            "'('", "')'", "','" ];
    static symbolicNames = [ null, null, null, null, null, null, null, null, 
                             null, null, null, "IDENTIFIER", "NUMBER", "STRING", 
                             "LBRACKET", "RBRACKET", "COMMA", "WS" ];
    static ruleNames = [ "program", "statement", "functionCall", "expression", 
                         "term", "operator", "literal" ];

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
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 14;
	        this.statement();
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
	        this.state = 18;
	        this._errHandler.sync(this);
	        var la_ = this._interp.adaptivePredict(this._input,0,this._ctx);
	        switch(la_) {
	        case 1:
	            this.enterOuterAlt(localctx, 1);
	            this.state = 16;
	            this.functionCall();
	            break;

	        case 2:
	            this.enterOuterAlt(localctx, 2);
	            this.state = 17;
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
	        this.state = 20;
	        this.match(formulaParser.IDENTIFIER);
	        this.state = 21;
	        this.match(formulaParser.LBRACKET);
	        this.state = 30;
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        if((((_la) & ~0x1f) === 0 && ((1 << _la) & 30720) !== 0)) {
	            this.state = 22;
	            this.expression();
	            this.state = 27;
	            this._errHandler.sync(this);
	            _la = this._input.LA(1);
	            while(_la===16) {
	                this.state = 23;
	                this.match(formulaParser.COMMA);
	                this.state = 24;
	                this.expression();
	                this.state = 29;
	                this._errHandler.sync(this);
	                _la = this._input.LA(1);
	            }
	        }

	        this.state = 32;
	        this.match(formulaParser.RBRACKET);
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
	    this.enterRule(localctx, 6, formulaParser.RULE_expression);
	    var _la = 0;
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 34;
	        this.term();
	        this.state = 40;
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        while((((_la) & ~0x1f) === 0 && ((1 << _la) & 2046) !== 0)) {
	            this.state = 35;
	            this.operator();
	            this.state = 36;
	            this.term();
	            this.state = 42;
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
	    this.enterRule(localctx, 8, formulaParser.RULE_term);
	    try {
	        this.state = 49;
	        this._errHandler.sync(this);
	        switch(this._input.LA(1)) {
	        case 12:
	        case 13:
	            this.enterOuterAlt(localctx, 1);
	            this.state = 43;
	            this.literal();
	            break;
	        case 11:
	            this.enterOuterAlt(localctx, 2);
	            this.state = 44;
	            this.functionCall();
	            break;
	        case 14:
	            this.enterOuterAlt(localctx, 3);
	            this.state = 45;
	            this.match(formulaParser.LBRACKET);
	            this.state = 46;
	            this.expression();
	            this.state = 47;
	            this.match(formulaParser.RBRACKET);
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



	operator() {
	    let localctx = new OperatorContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 10, formulaParser.RULE_operator);
	    var _la = 0;
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 51;
	        _la = this._input.LA(1);
	        if(!((((_la) & ~0x1f) === 0 && ((1 << _la) & 2046) !== 0))) {
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
	    this.enterRule(localctx, 12, formulaParser.RULE_literal);
	    var _la = 0;
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 53;
	        _la = this._input.LA(1);
	        if(!(_la===12 || _la===13)) {
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
formulaParser.T__8 = 9;
formulaParser.T__9 = 10;
formulaParser.IDENTIFIER = 11;
formulaParser.NUMBER = 12;
formulaParser.STRING = 13;
formulaParser.LBRACKET = 14;
formulaParser.RBRACKET = 15;
formulaParser.COMMA = 16;
formulaParser.WS = 17;

formulaParser.RULE_program = 0;
formulaParser.RULE_statement = 1;
formulaParser.RULE_functionCall = 2;
formulaParser.RULE_expression = 3;
formulaParser.RULE_term = 4;
formulaParser.RULE_operator = 5;
formulaParser.RULE_literal = 6;

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

	statement() {
	    return this.getTypedRuleContext(StatementContext,0);
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

	LBRACKET() {
	    return this.getToken(formulaParser.LBRACKET, 0);
	};

	RBRACKET() {
	    return this.getToken(formulaParser.RBRACKET, 0);
	};

	expression = function(i) {
	    if(i===undefined) {
	        i = null;
	    }
	    if(i===null) {
	        return this.getTypedRuleContexts(ExpressionContext);
	    } else {
	        return this.getTypedRuleContext(ExpressionContext,i);
	    }
	};

	COMMA = function(i) {
		if(i===undefined) {
			i = null;
		}
	    if(i===null) {
	        return this.getTokens(formulaParser.COMMA);
	    } else {
	        return this.getToken(formulaParser.COMMA, i);
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

	LBRACKET() {
	    return this.getToken(formulaParser.LBRACKET, 0);
	};

	expression() {
	    return this.getTypedRuleContext(ExpressionContext,0);
	};

	RBRACKET() {
	    return this.getToken(formulaParser.RBRACKET, 0);
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
formulaParser.ExpressionContext = ExpressionContext; 
formulaParser.TermContext = TermContext; 
formulaParser.OperatorContext = OperatorContext; 
formulaParser.LiteralContext = LiteralContext; 
