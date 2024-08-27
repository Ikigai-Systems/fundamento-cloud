// Generated from /home/pawel/Development/Ikigai-Systems/interactive-documents-self-hosted-prototype1/formula/formula.g4 by ANTLR 4.13.1
// jshint ignore: start
import antlr4 from 'antlr4';
import formulaListener from './formulaListener.js';
import formulaVisitor from './formulaVisitor.js';

const serializedATN = [4,1,18,61,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,
2,5,7,5,2,6,7,6,2,7,7,7,1,0,1,0,1,1,1,1,3,1,21,8,1,1,2,1,2,1,2,1,2,1,2,5,
2,28,8,2,10,2,12,2,31,9,2,3,2,33,8,2,1,2,1,2,1,3,1,3,1,3,1,3,5,3,41,8,3,
10,3,12,3,44,9,3,1,4,1,4,1,4,1,4,1,4,1,4,1,4,3,4,53,8,4,1,5,1,5,1,6,1,6,
1,7,1,7,1,7,0,0,8,0,2,4,6,8,10,12,14,0,2,1,0,1,10,1,0,13,14,59,0,16,1,0,
0,0,2,20,1,0,0,0,4,22,1,0,0,0,6,36,1,0,0,0,8,52,1,0,0,0,10,54,1,0,0,0,12,
56,1,0,0,0,14,58,1,0,0,0,16,17,3,2,1,0,17,1,1,0,0,0,18,21,3,4,2,0,19,21,
3,6,3,0,20,18,1,0,0,0,20,19,1,0,0,0,21,3,1,0,0,0,22,23,5,12,0,0,23,32,5,
15,0,0,24,29,3,6,3,0,25,26,5,17,0,0,26,28,3,6,3,0,27,25,1,0,0,0,28,31,1,
0,0,0,29,27,1,0,0,0,29,30,1,0,0,0,30,33,1,0,0,0,31,29,1,0,0,0,32,24,1,0,
0,0,32,33,1,0,0,0,33,34,1,0,0,0,34,35,5,16,0,0,35,5,1,0,0,0,36,42,3,8,4,
0,37,38,3,10,5,0,38,39,3,8,4,0,39,41,1,0,0,0,40,37,1,0,0,0,41,44,1,0,0,0,
42,40,1,0,0,0,42,43,1,0,0,0,43,7,1,0,0,0,44,42,1,0,0,0,45,53,3,12,6,0,46,
53,3,4,2,0,47,53,3,14,7,0,48,49,5,15,0,0,49,50,3,6,3,0,50,51,5,16,0,0,51,
53,1,0,0,0,52,45,1,0,0,0,52,46,1,0,0,0,52,47,1,0,0,0,52,48,1,0,0,0,53,9,
1,0,0,0,54,55,7,0,0,0,55,11,1,0,0,0,56,57,7,1,0,0,57,13,1,0,0,0,58,59,5,
11,0,0,59,15,1,0,0,0,5,20,29,32,42,52];


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
    static ruleNames = [ "program", "statement", "functionCall", "expression", 
                         "term", "operator", "literal", "currentValue" ];

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
	        this.state = 16;
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
	        this.state = 20;
	        this._errHandler.sync(this);
	        var la_ = this._interp.adaptivePredict(this._input,0,this._ctx);
	        switch(la_) {
	        case 1:
	            this.enterOuterAlt(localctx, 1);
	            this.state = 18;
	            this.functionCall();
	            break;

	        case 2:
	            this.enterOuterAlt(localctx, 2);
	            this.state = 19;
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
	        this.state = 22;
	        this.match(formulaParser.IDENTIFIER);
	        this.state = 23;
	        this.match(formulaParser.LBRACKET);
	        this.state = 32;
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        if((((_la) & ~0x1f) === 0 && ((1 << _la) & 63488) !== 0)) {
	            this.state = 24;
	            this.expression();
	            this.state = 29;
	            this._errHandler.sync(this);
	            _la = this._input.LA(1);
	            while(_la===17) {
	                this.state = 25;
	                this.match(formulaParser.COMMA);
	                this.state = 26;
	                this.expression();
	                this.state = 31;
	                this._errHandler.sync(this);
	                _la = this._input.LA(1);
	            }
	        }

	        this.state = 34;
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
	        this.state = 36;
	        this.term();
	        this.state = 42;
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        while((((_la) & ~0x1f) === 0 && ((1 << _la) & 2046) !== 0)) {
	            this.state = 37;
	            this.operator();
	            this.state = 38;
	            this.term();
	            this.state = 44;
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
	        this.state = 52;
	        this._errHandler.sync(this);
	        switch(this._input.LA(1)) {
	        case 13:
	        case 14:
	            this.enterOuterAlt(localctx, 1);
	            this.state = 45;
	            this.literal();
	            break;
	        case 12:
	            this.enterOuterAlt(localctx, 2);
	            this.state = 46;
	            this.functionCall();
	            break;
	        case 11:
	            this.enterOuterAlt(localctx, 3);
	            this.state = 47;
	            this.currentValue();
	            break;
	        case 15:
	            this.enterOuterAlt(localctx, 4);
	            this.state = 48;
	            this.match(formulaParser.LBRACKET);
	            this.state = 49;
	            this.expression();
	            this.state = 50;
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
	        this.state = 54;
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
	        this.state = 56;
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
	    this.enterRule(localctx, 14, formulaParser.RULE_currentValue);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 58;
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

formulaParser.RULE_program = 0;
formulaParser.RULE_statement = 1;
formulaParser.RULE_functionCall = 2;
formulaParser.RULE_expression = 3;
formulaParser.RULE_term = 4;
formulaParser.RULE_operator = 5;
formulaParser.RULE_literal = 6;
formulaParser.RULE_currentValue = 7;

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




formulaParser.ProgramContext = ProgramContext; 
formulaParser.StatementContext = StatementContext; 
formulaParser.FunctionCallContext = FunctionCallContext; 
formulaParser.ExpressionContext = ExpressionContext; 
formulaParser.TermContext = TermContext; 
formulaParser.OperatorContext = OperatorContext; 
formulaParser.LiteralContext = LiteralContext; 
formulaParser.CurrentValueContext = CurrentValueContext; 
