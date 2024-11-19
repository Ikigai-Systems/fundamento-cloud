grammar formula;

statement
    : functionCall
    | expression
    ;

functionCall
    : IDENTIFIER LBRACKET (expression (COMMA expression)*)? RBRACKET
    ;

expression
    : term (operator term)*
    ;

term
    : literal
    | functionCall
    | currentValue
    | LBRACKET expression RBRACKET
    ;

operator
    : '+' | '-' | '*' | '/'
    | '>' | '>=' | '<' | '<='
    | '==' | '!='
    ;

literal
    : NUMBER
    | STRING
    ;

currentValue: 'CurrentValue';

IDENTIFIER
    : [A-Z][a-zA-Z_0-9]*
    ;

NUMBER
    : [0-9]+ ('.' [0-9]+)?
    ;

STRING
    : '"' ( '\\' [bfnrt\\/"'] | ~[\\"] )* '"'
    ;

LBRACKET
    : '('
    ;

RBRACKET
    : ')'
    ;

COMMA
    : ','
    ;

WS
    : [ \t\r\n]+ -> skip
    ;