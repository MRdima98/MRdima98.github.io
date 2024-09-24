---
title: Writing a intepreter from scratch
---
Curiosity is an amazing gift when you can freely explore the subjects pertinent to your interest.

This summer I wondered how do programming languages actually work.
Luckily, in college, I got a rough idea: code enters as string, gets chopped into tokens, 
tokens undergo syntax analysis then they are either fed to a VM or translated to machine code.

Although fascinating, I realized my knowledge was superficial; I couldn't implement a compiler even if I tried.

<!--more-->

Therefore I sought help, specifically I read "Writing an interpreter in Go". 
Amazing book that teaches you step by step how to build an interpreter and at the 
same time taught me a bunch about Golang itself.

By the last chapter I had a working functional programming language, my curiosity 
should've been satisfied. Unfortunately it wasn't the case. I was not impressed with 
myself, reading and typing some code from a book won't translate into actual knowledge on 
the subject, you have to your his hands dirty.

I then embarked on a journey to expand the language by adding class support and OOP.
You can test the language at [this website](https://monkey.mrdima98.dev), see the code 
[on my git repository](https://github.com/MRdima98/interpreter) and follow the technical breakdown on my [blog](https://blog.mrdima98.dev) or my [youtube video](https://www.youtube.com/watch?v=RWEmozaBVjA).


## Back to school
We all could use little revision on how interpreters work. 

The input is read as one continuous string, naturally that is hard to work with. 
It is a great idea to parse it into a more convenient form, like an array of objects.

### Tokenization
The input is read char by char, until one valid token is found, then this token gets add to an 
array which contains a Type token. This type saves both the name of the token as well 
as the literal representation of the string. Say we want to parse an "if" string, the 
correct token to represent it should be `Token{type:'IF', literal: 'if'}`. Of course in this case looks silly 
to save twice an if, but suppose we want to save an identifier (like a variable) 'value' the 
	token would be: `Token{type: 'IDENT', literal:'value'}`.

By the end of this process we own an array of tokens.
This guarantees us that the input contains valid syntax.
However we cannot tell if semantically they are correct.

Say `let a = 5;` is a correct 
statement in javascript, however `let let a = 5;` will lead to an error.

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
I also added the private keyword for attributes.

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

And just like that it's done! I just updated the test cases and we run green.

### Parsing
This however was quite challenging. My first instinct was to copy functions statements, 
after all both are just a collection of variables and functions.
I was partially correct. The big difference is that classes are defined then called,
but classes are define, the initialized and finally called. This detailed 
ended my plan.

First step we have to add class statements and expressions to the ast.go.

A class is a collection of statements (attributes and methods). 
We need to save the class name, his father class and the name of the objects.
If the Name is nil it means this is a class statement rather than an object.
Class expression is the representation of a class call.
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

Now we need to add a parseFunction, which will parse our definition.
When we find a class token it should be followed by a identifier, otherwise 
we return nil.

If the next token is a colon, we have inheritance in this case, the class father name 
should be saved.

Finally the next token is bound to be a left bracket, which means we have to parse 
one by one each statement.
```go
# parser.go
func (p *Parser) parseClassStatement() ast.Statement {
	stmt := &ast.ClassStatement{Token: p.curToken}

	if !p.expectPeek(token.IDENT) {
		return nil
	}

	stmt.ClassName = &ast.Identifier{Token: p.curToken, Value: p.curToken.Literal}
	if p.peekTokenIs(token.COLON) {
		p.nextToken()
		p.nextToken()
		stmt.Father = &ast.Identifier{Token: p.curToken, Value: p.curToken.Literal}
	}

	if !p.expectPeek(token.LBRACE) {
		return nil
	}
	p.nextToken()

	for {
		if p.curTokenIs(token.RBRACE) {
			break
		}
		stmt.Block = append(stmt.Block, p.parseLetStatement())
		p.nextToken()
	}

	if p.peekTokenIs(token.SEMICOLON) {
		p.nextToken()
	}

	return stmt
}
```
In order to parse the initialization we have to add a branch to out parser function for let.
If there is a private token after the let, we should set the flag private to true.

If we encounter a 'new' token we have to save both the class name and the identifier 
name. We then return since this is no ordinary let.
```go
# parser.go
func (p *Parser) parseLetStatement() ast.Statement {
...
	if p.peekTokenIs(token.PRIVATE) {
		stmt.Private = true
		p.nextToken()
	} else {
		stmt.Private = false
	}

...
	if p.curTokenIs(token.NEW) {
		stmt2 := &ast.ClassStatement{Token: token.Token{Type: token.CLASS}}
		p.nextToken()
		stmt2.ClassName = &ast.Identifier{Token: p.curToken, Value: p.curToken.Literal}
		stmt2.Name = stmt.Name
		p.nextToken()
		p.nextToken()
		if p.peekTokenIs(token.SEMICOLON) {
			p.nextToken()
		}
		return stmt2
	}

...
	return stmt
}
```
Finally was born the monstrosity that copies the definition of the class inside 
the assigned object.
Not my proudest code I admit. However concession shall be made. 

I save each class inside the classes object, and then loop over it. Anytime 
there is class with a name I should search for his class definition and copy everything 
inside.
Afterwards I search again for all the fathers, if I find any I shall once again copy 
this statements, but only if said statement isn't already present.
```go
func (p *Parser) ParseProgram() *ast.Program {
	program := &ast.Program{}
	program.Statements = []ast.Statement{}
	classes := &ast.Program{}
	classes.Statements = []ast.Statement{}

	for p.curToken.Type != token.EOF {
		stmt := p.parseStatement()
		if stmt != nil {
			program.Statements = append(program.Statements, stmt)
		}
		if _, ok := stmt.(*ast.ClassStatement); ok {
			classes.Statements = append(classes.Statements, stmt)
		}
		p.nextToken()
	}

	for _, class := range classes.Statements {
		class := class.(*ast.ClassStatement)
		for _, stmt := range program.Statements {
			stmt, ok := stmt.(*ast.ClassStatement)
			if !ok {
				continue
			}
			if stmt.Name != nil && len(stmt.Block) == 0 && stmt.ClassName.String() == class.ClassName.String() {
				stmt.Block = append(stmt.Block, class.Block...)
				if class.Father != nil {
					stmt.Father = class.Father
				}
			}
		}
	}

	for _, class := range classes.Statements {
		class := class.(*ast.ClassStatement)
		for _, stmt := range program.Statements {
			stmt, ok := stmt.(*ast.ClassStatement)
			if !ok {
				continue
			}
			if stmt.Father == nil {
				continue
			}
			if stmt.Name == nil && stmt.Father.String() == class.ClassName.String() {
				continue
			}
			for _, fatherAttr := range class.Block {
				present := false
				for _, sonAttr := range stmt.Block {
					if fatherAttr.TokenLiteral() == sonAttr.TokenLiteral() {
						present = true
					}
				}
				if !present {
					stmt.Block = append(stmt.Block, fatherAttr)
				}
			}
		}
	}

	return program
}
```
### Execution
At this point we can easily parse both syntax and semantics correctly. Time 
to actually run this program. In this language everything is an object, therefore 
we are to define the class object.
```go
type Class struct {
	Body []ast.Statement
	Env  *Environment
}
```
We also need to update our environment, since classes can be initialized later on. 
Unlike functions, we need to have the definitions floating in our environment.
```go
func NewClassEnv(outer *Environment) *Environment {
	env := NewEnvironment()
	env.outer = outer
	return env
}

type Environment struct {
	store map[string]Object
	outer *Environment
	class map[string]*Environment
}

func (e *Environment) SetClassEnv(classEnv *Environment, className string) *Environment {
	if e.class == nil {
		e.class = map[string]*Environment{}
	}
	e.class[className] = classEnv
	return e
}

func (e *Environment) GetClassEnv(className string) *Environment {
	return e.class[className]
}
```

Finally evaluate the and return the evaluation. Which in simple terms will unwrap 
the object and perform each and every operation needed.
```go
...
	case *ast.ClassStatement:
		if node.Name == nil {
			return nil
		}
		classEnv := object.NewEnclosedEnvironment(env)
		for _, stmt := range node.Block {
			classEnv.Set(node.Name.String(), Eval(stmt, classEnv))
		}
		env.SetClassEnv(classEnv, node.Name.TokenLiteral())
		return nil

	case ast.ClassExpression:
		if node.Variable != nil {
			privateObj, ok := env.GetClassEnv(node.TokenLiteral()).Get("private" + node.Variable.TokenLiteral())
			if ok {
				private := privateObj.(*object.Boolean)
				if private.Value {
					return newError("No attribute like this!")
				}
			}
			return Eval(node.Variable, env.GetClassEnv(node.TokenLiteral()))
		}
		if node.Function != nil {
			return Eval(node.Function, env.GetClassEnv(node.TokenLiteral()))
		}
	}
...
```

We are up and running! As mentioned in the begging you can check it out for
yourself and play around.
The website that allows you to play with language simply takes the input and
runs the program like an executable.

## Closing thoughts

This a fast and quicker than I though project.
I learned a bunch about interpreter, cleared some of my personal misconceptions and worked in a
medium sized Go project.
I highly suggest to try out at least the book.

Hope you enjoyed reading as much as I enjoyed writing it.
