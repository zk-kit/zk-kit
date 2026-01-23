import tokenize from "../src/tokenize"
import { precedence, applyOperator, evaluate } from "../src/evaluate"

describe("Logical Expressions", () => {
    describe("# tokenize", () => {
        it("Should tokenize a logical expression", () => {
            const expression = "true and false or ( true and true )"

            const tokens = tokenize(expression)

            const result = ["true", "and", "false", "or", "(", "true", "and", "true", ")"]

            expect(tokens).toStrictEqual(result)
        })
    })
    describe("# precedence", () => {
        it("Should return the precedence of the and operator", () => {
            const result = precedence("and")

            expect(result).toBe(1)
        })
        it("Should return the precedence of the or operator", () => {
            const result = precedence("or")

            expect(result).toBe(1)
        })
        it("Should return the precedence of the xor operator", () => {
            const result = precedence("xor")

            expect(result).toBe(1)
        })
        it("Should return the precedence of the not operator", () => {
            const result = precedence("not")

            expect(result).toBe(2)
        })
        it("Should return 0 if the operator is not supported", () => {
            const result = precedence("op")

            expect(result).toBe(0)
        })
    })
    describe("# applyOperator", () => {
        it("Should apply the and operator", () => {
            const operator = "and"

            const a = true

            const b = false

            const result = applyOperator(operator, a, b)

            expect(result).toBeFalsy()
        })
        it("Should apply the or operator", () => {
            const operator = "or"

            const a = true

            const b = false

            const result = applyOperator(operator, a, b)

            expect(result).toBeTruthy()
        })
        it("Should apply the not operator", () => {
            const operator = "not"

            const a = true

            const result = applyOperator(operator, a)

            expect(result).toBeFalsy()
        })
        it("Should apply the xor operator", () => {
            const operator = "xor"

            const a = true

            const b = true

            const result = applyOperator(operator, a, b)

            expect(result).toBeFalsy()
        })
        it("Should throw an error if the operator is not supported", () => {
            const operator = "op"

            const a = true

            const b = false

            const fun = () => applyOperator(operator, a, b)

            expect(fun).toThrow("Unknown operator: 'op'")
        })
        it("Should throw an error if there is a missing argument for the and operator", () => {
            const operator = "and"

            const a = true

            const fun = () => applyOperator(operator, a)

            expect(fun).toThrow("The operator 'and' requires two values")
        })
        it("Should throw an error if there is a missing argument for the or operator", () => {
            const operator = "or"

            const a = true

            const fun = () => applyOperator(operator, a)

            expect(fun).toThrow("The operator 'or' requires two values")
        })
        it("Should throw an error if there is a missing argument for the xor operator", () => {
            const operator = "xor"

            const a = true

            const fun = () => applyOperator(operator, a)

            expect(fun).toThrow("The operator 'xor' requires two values")
        })
        it("Should throw an error if there is an extra argument for the not operator", () => {
            const operator = "not"

            const a = true

            const b = true

            const fun = () => applyOperator(operator, a, b)

            expect(fun).toThrow("The operator 'not' requires only one value")
        })
    })
    describe("# evaluate", () => {
        it("Should evaluate a logical expression with the and operator", () => {
            const expression = ["true", "and", "false"]
            const result = evaluate(expression)
            expect(result).toBeFalsy()
        })
        it("Should evaluate a logical expression with the or operator", () => {
            const expression = ["true", "or", "false"]
            const result = evaluate(expression)
            expect(result).toBeTruthy()
        })
        it("Should evaluate a logical expression with the not operator", () => {
            const expression = ["not", "false"]
            const result = evaluate(expression)
            expect(result).toBeTruthy()
        })
        it("Should evaluate a logical expression with the xor operator", () => {
            const expression = ["false", "xor", "true"]
            const result = evaluate(expression)
            expect(result).toBeTruthy()
        })
        it("Should evaluate a logical expression combining and, or, not, and xor operators", () => {
            const expression = ["true", "and", "false", "or", "not", "false", "xor", "true"]
            const result = evaluate(expression)
            expect(result).toBeFalsy()
        })
        it("Should evaluate a logical expression with parentheses", () => {
            const expression = [
                "true",
                "and",
                "false",
                "or",
                "(",
                "true",
                "and",
                "true",
                ")",
                "or",
                "(",
                "not",
                "false",
                ")"
            ]
            const result = evaluate(expression)
            expect(result).toBeTruthy()
        })
        it("Should throw an error if the logical expression has an unknown token", () => {
            const expression = ["true", "op", "true"]
            const fun = () => evaluate(expression)
            expect(fun).toThrow("Unknown token: 'op'")
        })
        it("Should throw an error if the logical expression has an additional boolean value", () => {
            const expression = ["true", "true", "and", "false"]
            const fun = () => evaluate(expression)
            expect(fun).toThrow("Invalid logical expression")
        })
        it("Should throw an error if the logical expression is invalid and has a unary operator", () => {
            const expression = ["not"]
            const fun = () => evaluate(expression)
            expect(fun).toThrow("The operator 'not' requires one value")
        })
        it("Should throw an error if the logical expression is invalid and has a unary operator and parentheses", () => {
            const expression = ["(", "not", ")"]
            const fun = () => evaluate(expression)
            expect(fun).toThrow("The operator 'not' requires one value")
        })
        it("Should throw an error if the logical expression is invalid and has a binary operator", () => {
            const expression = ["true", "and"]
            const fun = () => evaluate(expression)
            expect(fun).toThrow("The operator 'and' requires two values")
        })
        it("Should throw an error if the logical expression is invalid and has a binary operator and parentheses", () => {
            const expression = ["(", "true", "and", ")"]
            const fun = () => evaluate(expression)
            expect(fun).toThrow("The operator 'and' requires two values")
        })
        it("Should throw an error if the logical expression is invalid and has two unary operators with the same precedence", () => {
            const expression = ["not", "not"]
            const fun = () => evaluate(expression)
            expect(fun).toThrow("The operator 'not' requires one value")
        })
        it("Should throw an error if the logical expression is invalid and has two binary operators with the same precedence", () => {
            const expression = ["and", "or"]
            const fun = () => evaluate(expression)
            expect(fun).toThrow("The operator 'and' requires two value")
        })
        it("Should throw an error if the logical expression is empty", () => {
            const expression: string[] = []
            const fun = () => evaluate(expression)
            expect(fun).toThrow("Invalid logical expression")
        })
    })
})
