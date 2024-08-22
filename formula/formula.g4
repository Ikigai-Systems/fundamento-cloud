grammar formula;

program: statement+ ;

statement
    : functionCall
    | expression
    ;

functionCall
    : IDENTIFIER '(' (parameter (',' parameter)*)? ')'
    ;

parameter
    : expression
    | IDENTIFIER '=' expression
    ;

expression
    : term (operator term)*
    ;

term
    : literal
    | functionCall
    | '(' expression ')'
    ;

binaryOperation
    : term operator term
    ;

operator
    : '+' | '-' | '*' | '/' | '='
    ;

literal
    : NUMBER
    | STRING
    ;

IDENTIFIER
    : [a-zA-Z_][a-zA-Z_0-9]*
    ;

NUMBER
    : [0-9]+ ('.' [0-9]+)?
    ;

STRING
    : '"' .*? '"'
    ;

WS
    : [ \t\r\n]+ -> skip
    ;