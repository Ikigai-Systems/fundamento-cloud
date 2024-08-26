grammar formula;

program: statement ;

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
    | LBRACKET expression RBRACKET
    ;

operator
    : '+' | '-' | '*' | '/'
    ;

literal
    : NUMBER
    | STRING
    ;

IDENTIFIER
    : [A-Z][a-zA-Z_0-9]*
    ;

NUMBER
    : [0-9]+ ('.' [0-9]+)?
    ;

STRING
    : '"' .*? '"'
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