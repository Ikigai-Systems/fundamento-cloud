// Generated from /home/pawel/Development/Ikigai-Systems/interactive-documents-self-hosted-prototype1/formula/formula.g4 by ANTLR 4.13.1
// jshint ignore: start
import antlr4 from 'antlr4';


const serializedATN = [4,0,11,73,6,-1,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,
4,7,4,2,5,7,5,2,6,7,6,2,7,7,7,2,8,7,8,2,9,7,9,2,10,7,10,1,0,1,0,1,1,1,1,
1,2,1,2,1,3,1,3,1,4,1,4,5,4,34,8,4,10,4,12,4,37,9,4,1,5,4,5,40,8,5,11,5,
12,5,41,1,5,1,5,4,5,46,8,5,11,5,12,5,47,3,5,50,8,5,1,6,1,6,5,6,54,8,6,10,
6,12,6,57,9,6,1,6,1,6,1,7,1,7,1,8,1,8,1,9,1,9,1,10,4,10,68,8,10,11,10,12,
10,69,1,10,1,10,1,55,0,11,1,1,3,2,5,3,7,4,9,5,11,6,13,7,15,8,17,9,19,10,
21,11,1,0,4,1,0,65,90,4,0,48,57,65,90,95,95,97,122,1,0,48,57,3,0,9,10,13,
13,32,32,78,0,1,1,0,0,0,0,3,1,0,0,0,0,5,1,0,0,0,0,7,1,0,0,0,0,9,1,0,0,0,
0,11,1,0,0,0,0,13,1,0,0,0,0,15,1,0,0,0,0,17,1,0,0,0,0,19,1,0,0,0,0,21,1,
0,0,0,1,23,1,0,0,0,3,25,1,0,0,0,5,27,1,0,0,0,7,29,1,0,0,0,9,31,1,0,0,0,11,
39,1,0,0,0,13,51,1,0,0,0,15,60,1,0,0,0,17,62,1,0,0,0,19,64,1,0,0,0,21,67,
1,0,0,0,23,24,5,43,0,0,24,2,1,0,0,0,25,26,5,45,0,0,26,4,1,0,0,0,27,28,5,
42,0,0,28,6,1,0,0,0,29,30,5,47,0,0,30,8,1,0,0,0,31,35,7,0,0,0,32,34,7,1,
0,0,33,32,1,0,0,0,34,37,1,0,0,0,35,33,1,0,0,0,35,36,1,0,0,0,36,10,1,0,0,
0,37,35,1,0,0,0,38,40,7,2,0,0,39,38,1,0,0,0,40,41,1,0,0,0,41,39,1,0,0,0,
41,42,1,0,0,0,42,49,1,0,0,0,43,45,5,46,0,0,44,46,7,2,0,0,45,44,1,0,0,0,46,
47,1,0,0,0,47,45,1,0,0,0,47,48,1,0,0,0,48,50,1,0,0,0,49,43,1,0,0,0,49,50,
1,0,0,0,50,12,1,0,0,0,51,55,5,34,0,0,52,54,9,0,0,0,53,52,1,0,0,0,54,57,1,
0,0,0,55,56,1,0,0,0,55,53,1,0,0,0,56,58,1,0,0,0,57,55,1,0,0,0,58,59,5,34,
0,0,59,14,1,0,0,0,60,61,5,40,0,0,61,16,1,0,0,0,62,63,5,41,0,0,63,18,1,0,
0,0,64,65,5,44,0,0,65,20,1,0,0,0,66,68,7,3,0,0,67,66,1,0,0,0,68,69,1,0,0,
0,69,67,1,0,0,0,69,70,1,0,0,0,70,71,1,0,0,0,71,72,6,10,0,0,72,22,1,0,0,0,
7,0,35,41,47,49,55,69,1,6,0,0];


const atn = new antlr4.atn.ATNDeserializer().deserialize(serializedATN);

const decisionsToDFA = atn.decisionToState.map( (ds, index) => new antlr4.dfa.DFA(ds, index) );

export default class formulaLexer extends antlr4.Lexer {

    static grammarFileName = "formula.g4";
    static channelNames = [ "DEFAULT_TOKEN_CHANNEL", "HIDDEN" ];
	static modeNames = [ "DEFAULT_MODE" ];
	static literalNames = [ null, "'+'", "'-'", "'*'", "'/'", null, null, null, 
                         "'('", "')'", "','" ];
	static symbolicNames = [ null, null, null, null, null, "IDENTIFIER", "NUMBER", 
                          "STRING", "LBRACKET", "RBRACKET", "COMMA", "WS" ];
	static ruleNames = [ "T__0", "T__1", "T__2", "T__3", "IDENTIFIER", "NUMBER", 
                      "STRING", "LBRACKET", "RBRACKET", "COMMA", "WS" ];

    constructor(input) {
        super(input)
        this._interp = new antlr4.atn.LexerATNSimulator(this, atn, decisionsToDFA, new antlr4.atn.PredictionContextCache());
    }
}

formulaLexer.EOF = antlr4.Token.EOF;
formulaLexer.T__0 = 1;
formulaLexer.T__1 = 2;
formulaLexer.T__2 = 3;
formulaLexer.T__3 = 4;
formulaLexer.IDENTIFIER = 5;
formulaLexer.NUMBER = 6;
formulaLexer.STRING = 7;
formulaLexer.LBRACKET = 8;
formulaLexer.RBRACKET = 9;
formulaLexer.COMMA = 10;
formulaLexer.WS = 11;



