// Generated from src/formula.g4 by ANTLR 4.13.2
// jshint ignore: start
import antlr4 from 'antlr4';
import formulaListener from './formulaListener.js';
import formulaVisitor from './formulaVisitor.js';

const serializedATN = [4,1,18,57,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,
2,5,7,5,2,6,7,6,1,0,1,0,3,0,17,8,0,1,1,1,1,1,1,1,1,1,1,5,1,24,8,1,10,1,12,
1,27,9,1,3,1,29,8,1,1,1,1,1,1,2,1,2,1,2,1,2,5,2,37,8,2,10,2,12,2,40,9,2,
1,3,1,3,1,3,1,3,1,3,1,3,1,3,3,3,49,8,3,1,4,1,4,1,5,1,5,1,6,1,6,1,6,0,0,7,
0,2,4,6,8,10,12,0,2,1,0,1,10,1,0,13,14,56,0,16,1,0,0,0,2,18,1,0,0,0,4,32,
1,0,0,0,6,48,1,0,0,0,8,50,1,0,0,0,10,52,1,0,0,0,12,54,1,0,0,0,14,17,3,2,
1,0,15,17,3,4,2,0,16,14,1,0,0,0,16,15,1,0,0,0,17,1,1,0,0,0,18,19,5,12,0,
0,19,28,5,15,0,0,20,25,3,4,2,0,21,22,5,17,0,0,22,24,3,4,2,0,23,21,1,0,0,
0,24,27,1,0,0,0,25,23,1,0,0,0,25,26,1,0,0,0,26,29,1,0,0,0,27,25,1,0,0,0,
28,20,1,0,0,0,28,29,1,0,0,0,29,30,1,0,0,0,30,31,5,16,0,0,31,3,1,0,0,0,32,
38,3,6,3,0,33,34,3,8,4,0,34,35,3,6,3,0,35,37,1,0,0,0,36,33,1,0,0,0,37,40,
1,0,0,0,38,36,1,0,0,0,38,39,1,0,0,0,39,5,1,0,0,0,40,38,1,0,0,0,41,49,3,10,
5,0,42,49,3,2,1,0,43,49,3,12,6,0,44,45,5,15,0,0,45,46,3,4,2,0,46,47,5,16,
0,0,47,49,1,0,0,0,48,41,1,0,0,0,48,42,1,0,0,0,48,43,1,0,0,0,48,44,1,0,0,
0,49,7,1,0,0,0,50,51,7,0,0,0,51,9,1,0,0,0,52,53,7,1,0,0,53,11,1,0,0,0,54,
55,5,11,0,0,55,13,1,0,0,0,5,16,25,28,38,48];


const atn = new antlr4.atn.ATNDeserializer().deserialize(serializedATN);

const decisionsToDFA = atn.decisionToState.map( (ds, index) => new antlr4.dfa.DFA(ds, index) );

const sharedContextCache = new antlr4.atn.PredictionContextCache();

export default class formulaParser extends antlr4.Parser {

    static grammarFileName = "formula.g4";
    static literalNames = [ null, "'+'", "'-'", "'*'", "'/'", "'>'", "'>='", 
                            "'<'", "'<='", "'=='", "'!='", "'CurrentValue'", 
                            null, null, null, "'('", "')'", "','" ];
    static symbolicNames = [ null, null, null, null, null, null, null, null, 
                             null, null, null, null, "IDENTIFIER", "NUMBER", 
                             "STRING", "LBRACKET", "RBRACKET", "COMMA", 
                             "WS" ];
    static ruleNames = [ "statement", "functionCall", "expression", "term", 
                         "operator", "literal", "currentValue" ];

    constructor(input) {
        super(input);
        this._interp = new antlr4.atn.ParserATNSimulator(this, atn, decisionsToDFA, sharedContextCache);
        this.ruleNames = formulaParser.ruleNames;
        this.literalNames = formulaParser.literalNames;
        this.symbolicNames = formulaParser.symbolicNames;
    }



	statement() {
	    let localctx = new StatementContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 0, formulaParser.RULE_statement);
	    try {
	        this.state = 16;
	        this._errHandler.sync(this);
	        var la_ = this._interp.adaptivePredict(this._input,0,this._ctx);
	        switch(la_) {
	        case 1:
	            this.enterOuterAlt(localctx, 1);
	            this.state = 14;
	            this.functionCall();
	            break;

	        case 2:
	            this.enterOuterAlt(localctx, 2);
	            this.state = 15;
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
	    this.enterRule(localctx, 2, formulaParser.RULE_functionCall);
	    var _la = 0;
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 18;
	        this.match(formulaParser.IDENTIFIER);
	        this.state = 19;
	        this.match(formulaParser.LBRACKET);
	        this.state = 28;
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        if((((_la) & ~0x1f) === 0 && ((1 << _la) & 63488) !== 0)) {
	            this.state = 20;
	            this.expression();
	            this.state = 25;
	            this._errHandler.sync(this);
	            _la = this._input.LA(1);
	            while(_la===17) {
	                this.state = 21;
	                this.match(formulaParser.COMMA);
	                this.state = 22;
	                this.expression();
	                this.state = 27;
	                this._errHandler.sync(this);
	                _la = this._input.LA(1);
	            }
	        }

	        this.state = 30;
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
	    this.enterRule(localctx, 4, formulaParser.RULE_expression);
	    var _la = 0;
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 32;
	        this.term();
	        this.state = 38;
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        while((((_la) & ~0x1f) === 0 && ((1 << _la) & 2046) !== 0)) {
	            this.state = 33;
	            this.operator();
	            this.state = 34;
	            this.term();
	            this.state = 40;
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
	    this.enterRule(localctx, 6, formulaParser.RULE_term);
	    try {
	        this.state = 48;
	        this._errHandler.sync(this);
	        switch(this._input.LA(1)) {
	        case 13:
	        case 14:
	            this.enterOuterAlt(localctx, 1);
	            this.state = 41;
	            this.literal();
	            break;
	        case 12:
	            this.enterOuterAlt(localctx, 2);
	            this.state = 42;
	            this.functionCall();
	            break;
	        case 11:
	            this.enterOuterAlt(localctx, 3);
	            this.state = 43;
	            this.currentValue();
	            break;
	        case 15:
	            this.enterOuterAlt(localctx, 4);
	            this.state = 44;
	            this.match(formulaParser.LBRACKET);
	            this.state = 45;
	            this.expression();
	            this.state = 46;
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
	    this.enterRule(localctx, 8, formulaParser.RULE_operator);
	    var _la = 0;
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 50;
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
	    this.enterRule(localctx, 10, formulaParser.RULE_literal);
	    var _la = 0;
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 52;
	        _la = this._input.LA(1);
	        if(!(_la===13 || _la===14)) {
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



	currentValue() {
	    let localctx = new CurrentValueContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 12, formulaParser.RULE_currentValue);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 54;
	        this.match(formulaParser.T__10);
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
formulaParser.T__10 = 11;
formulaParser.IDENTIFIER = 12;
formulaParser.NUMBER = 13;
formulaParser.STRING = 14;
formulaParser.LBRACKET = 15;
formulaParser.RBRACKET = 16;
formulaParser.COMMA = 17;
formulaParser.WS = 18;

formulaParser.RULE_statement = 0;
formulaParser.RULE_functionCall = 1;
formulaParser.RULE_expression = 2;
formulaParser.RULE_term = 3;
formulaParser.RULE_operator = 4;
formulaParser.RULE_literal = 5;
formulaParser.RULE_currentValue = 6;

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

	currentValue() {
	    return this.getTypedRuleContext(CurrentValueContext,0);
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



class CurrentValueContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = formulaParser.RULE_currentValue;
    }


	enterRule(listener) {
	    if(listener instanceof formulaListener ) {
	        listener.enterCurrentValue(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof formulaListener ) {
	        listener.exitCurrentValue(this);
		}
	}

	accept(visitor) {
	    if ( visitor instanceof formulaVisitor ) {
	        return visitor.visitCurrentValue(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	}


}




formulaParser.StatementContext = StatementContext; 
formulaParser.FunctionCallContext = FunctionCallContext; 
formulaParser.ExpressionContext = ExpressionContext; 
formulaParser.TermContext = TermContext; 
formulaParser.OperatorContext = OperatorContext; 
formulaParser.LiteralContext = LiteralContext; 
formulaParser.CurrentValueContext = CurrentValueContext; 
