---
title: Writing a intepreter from scratch
---
Curiosity is a amazing gift when you can freely explore the subjects pertinent to your interest.

This summer I wondered how actually do programming languages work. 
Luckily in college I learned a rough idea: code enter as string, gets chopped into tokens, 
tokens undergo syntax analysis then they are either fed to a VM or translated to machine code.

Fascinating, yet I felt that my knowledge is superficial, I couldn't implement a compiler 
tomorrow if I wanted. 

<!--more-->

Therefore I ran for help, specifically I read "Writing an interpreter in Go". 
Amazing book that teaches you step by step how to build an interpreter and at the 
same time taught me a bunch about Golang it self.

By the last chapter I had a working functional programming language, my curiosity 
should've been satisfied. Unfortunately it wasn't the case. I was not impressed by 
my self, reading and typing some code from a book won't translate into actual knowledge on 
the subject, one has to get hands dirty.

I then embarked on a journey to expand the language by adding class support and OOP.
You can test the language at [this website](https://monkey.mrdima98.dev), see the code 
[on my git repository](https://github.com/MRdima98/interpreter) and follow the technical breakdown on my [blog](https://blog.mrdima98.dev) or my [youtube video](asdf).


## Back to school
We all could use little revision on how interpreters work. 

The input is read as one continuous string, naturally that is hard to work with 
therefore it's a clever idea to chop it into a more convenient form.

### Tokenization
The input is read char by char, until one valid token is found, then this token gets add to an 
array which contains a Type token. This type saves both the name of the token as well 
as the literal representation of the string. Say we want to parse an "if" string, the 
correct token to represent it should be type:'IF', literal: 'if'. Of course in this case looks silly 
to save twice an if, but suppose we want to save an identifier (like a variable) 'value' the 
token would be: type: 'IDENT', literal:'value'.

Currently we out an array of tokens; which we know are correct on their own that is.
However we cannot tell if semantically they are correct. Say let a = 5; is a correct 
statement in javascript, however let let a = 5; will lead to an error.

### Semantic analysis
The next step is similar to the precedent, we want to read the tokens one by one 
and make sure that their order makes sense. Now we could benefit from a little help 
function: peekNextToken. This function will tells us which is the next token. This 
is very useful, we can check if the next identifier is valid and return the statement.
Say we have a token 'LET' then there is no other possible next token rather than 
'IDENT', however 'IDENT' could be followed either by a semicolon or a equal sign. 
Finally the equal sign should be followed by any kind of expression, or a set of 
operations, to end on a semicolon or EOF.

Examples perhaps could help:
```javascript
// In js because anyone under the sun can read a bit of js
let a; // valid
let a =; // NOT valid
let a = 5; // valid
let a == 5; // NOT valid
```

This time we have in our hands a program that is a set of statements, to be more 
precise we have a tree, to be even preciser we have an AST.
The reason for such a data structure is simple, we can later descend this tree 
and actually execute such operations.

### Execution
As our last step we have to naturally run this bad boy. In my opinion this is the 
best step. Contrary to compiled languages, which compile to a binary in machine code, 
interpreted languages typically will run on a VM. 

The VM will then translate the code on the fly and execute it. 

## Monkey language
This is the designated name of the language by the author of "Writing an interpreter in Go", 
the man is quiet funny.

I won't waste time going again throw the syntax, you can check it [github](https://github.com/MRdima98/interpreter) or 
on his [website](https://monkey.mrdima98.dev). What I think is cool is how I 
went about adding class and OOP.

### The idea
The objective is to add a class keyword and a new keyword.
As in any other OOP language you can define attributes and methods inside the class, 
which can then be called from the object as a dot.

### Lexing
This proved to be the simplest step, since the author done a amazing job at the 
lexer I just had to add some constants here and there and update the test cases.
```go
# token.go
const (
...
	STRING    = "STRING"
	COLON     = ":"
	CLASS     = "CLASS"
	NEW       = "NEW"
	DOT       = "DOT"
	PRIVATE   = "PRIVATE"
)
var keywords = map[string]TokenType{
...
	"class":   CLASS,
	"new":     NEW,
	"private": PRIVATE,
}
```

```go
# lexer.go
switch l.ch 
var keywords = map[string]TokenType{
...
	case ':':
		tok = newToken(token.COLON, l.ch)
	case '.':
		tok = newToken(token.DOT, l.ch)
...
}
```

An just like that it's done! I just updated the test cases and we run green.

### Parsing
This however was quite challenging. My first instinct was to copy functions statements, 
after all both are just a collection of variables and functions.
I was partially correct. The big difference is that classes are defined then called,
but classes are define, the initialized and finally called. This detailed 
broke my ankles a bit. 

First step we have to add class statements and expressions to the ast.go.

```go
# ast.go
type ClassStatement struct {
	Token     token.Token
	Father    *Identifier
	ClassName *Identifier
	Name      *Identifier
	Block     []Statement
}

...

type ClassExpression struct {
	Token    token.Token
	Function *CallExpression
	Variable Expression
}

...
```

