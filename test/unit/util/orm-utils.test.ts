import { describe, it, expect } from "vitest"
import { OrmUtils } from "../../../src/util/OrmUtils"

describe("OrmUtils", () => {
    describe("parseSqlCheckExpression", () => {
        it("parses a simple CHECK constraint", () => {
            // Spaces between CHECK values
            expect(
                OrmUtils.parseSqlCheckExpression(
                    `CREATE TABLE "foo_table" (
                        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                        "col" varchar CHECK("col" IN ('FOO', 'BAR', 'BAZ')) NOT NULL,
                        "some_other_col" integer NOT NULL
                        );`,
                    "col",
                ),
            ).toEqual(["FOO", "BAR", "BAZ"])

            // No spaces between CHECK values
            expect(
                OrmUtils.parseSqlCheckExpression(
                    `CREATE TABLE "foo_table" (
                        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                        "col" varchar CHECK("col" IN ('FOO','BAR','BAZ')) NOT NULL,
                        "some_other_col" integer NOT NULL
                        );`,
                    "col",
                ),
            ).toEqual(["FOO", "BAR", "BAZ"])
        })

        it("returns undefined when the column doesn't have a CHECK", () => {
            expect(
                OrmUtils.parseSqlCheckExpression(
                    `CREATE TABLE "foo_table" (
                        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                        "col" varchar NOT NULL,
                        "some_other_col" integer NOT NULL
                        );`,
                    "col",
                ),
            ).toBeUndefined()
        })

        it("parses a CHECK constraint with values containing special characters", () => {
            expect(
                OrmUtils.parseSqlCheckExpression(
                    `CREATE TABLE "foo_table" (
                        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                        "col" varchar CHECK("col" IN (
                                    'a,b',
                                    ',c,',
                                    'd''d',
                                    '''e''',
                                    'f'',''f',
                                    ''')',
                                    ')'''
                                )
                            ) NOT NULL,
                        "some_other_col" integer NOT NULL
                        );`,
                    "col",
                ),
            ).toEqual([
                "a,b",
                ",c,",
                "d'd",
                "'e'",
                "f','f",
                "')",
                ")'",
            ])
        })
    })

    describe("mergeDeep", () => {
        it("should handle simple values", () => {
            expect(OrmUtils.mergeDeep(1, 2)).toBe(1)
            expect(OrmUtils.mergeDeep(2, 1)).toBe(2)
            expect(OrmUtils.mergeDeep(2, 1, 1)).toBe(2)
            expect(OrmUtils.mergeDeep(1, 2, 1)).toBe(1)
            expect(OrmUtils.mergeDeep(1, 1, 2)).toBe(1)
            expect(OrmUtils.mergeDeep(2, 1, 2)).toBe(2)
        })

        it("should handle ordering and idempotence", () => {
            const a = { a: 1 }
            const b = { a: 2 }
            expect(OrmUtils.mergeDeep(a, b)).toEqual(b)
            expect(OrmUtils.mergeDeep(b, a)).toEqual(a)
            expect(OrmUtils.mergeDeep(b, a, a)).toEqual(a)
            expect(OrmUtils.mergeDeep(a, b, a)).toEqual(a)
            expect(OrmUtils.mergeDeep(a, a, b)).toEqual(b)
            expect(OrmUtils.mergeDeep(b, a, b)).toEqual(b)
            const c = { a: 3 }
            expect(OrmUtils.mergeDeep(a, b, c)).toEqual(c)
            expect(OrmUtils.mergeDeep(b, c, b)).toEqual(b)
            expect(OrmUtils.mergeDeep(c, a, a)).toEqual(a)
            expect(OrmUtils.mergeDeep(c, b, a)).toEqual(a)
            expect(OrmUtils.mergeDeep(a, c, b)).toEqual(b)
            expect(OrmUtils.mergeDeep(b, a, c)).toEqual(c)
        })

        it("should skip nested promises in sources", () => {
            expect(
                OrmUtils.mergeDeep({}, { p: Promise.resolve() }),
            ).toEqual({})
            expect(
                OrmUtils.mergeDeep({}, { p: { p: Promise.resolve() } }),
            ).toEqual({ p: {} })
            const a = { p: Promise.resolve(0) }
            const b = { p: Promise.resolve(1) }
            expect(OrmUtils.mergeDeep(a, {})).toEqual(a)
            expect(OrmUtils.mergeDeep(a, b)).toEqual(a)
            expect(OrmUtils.mergeDeep(b, a)).toEqual(b)
            expect(OrmUtils.mergeDeep(b, {})).toEqual(b)
        })

        it("should merge moderately deep objects correctly", () => {
            const a = {
                a: { b: { c: { d: { e: 123, h: { i: 23 } } } } },
                g: 19,
            }
            const b = { a: { b: { c: { d: { f: 99 } }, f: 31 } } }
            const c = {
                a: { b: { c: { d: { e: 123, f: 99, h: { i: 23 } } }, f: 31 } },
                g: 19,
            }
            expect(OrmUtils.mergeDeep(a, b)).toEqual(c)
            expect(OrmUtils.mergeDeep(b, a)).toEqual(c)
            expect(OrmUtils.mergeDeep(b, a, a)).toEqual(c)
            expect(OrmUtils.mergeDeep(a, b, a)).toEqual(c)
            expect(OrmUtils.mergeDeep(a, a, b)).toEqual(c)
            expect(OrmUtils.mergeDeep(b, a, b)).toEqual(c)
        })

        it("should handle recursive objects", () => {
            const a: Record<string, unknown> = {}
            const b: Record<string, unknown> = {}

            a["b"] = b
            a["a"] = a
            b["a"] = a

            expect(OrmUtils.mergeDeep({}, a)).toBeDefined()
        })

        it("should reference copy complex instances of classes", () => {
            class Foo {
                recursive: Foo

                constructor() {
                    this.recursive = this
                }
            }

            const foo = new Foo()
            const result = OrmUtils.mergeDeep({}, { foo })
            expect(result).toHaveProperty("foo")
            expect(result.foo).toBe(foo)
        })
    })

    describe("chunk", () => {
        it("should split array into chunks of specified size", () => {
            const array = [1, 2, 3, 4, 5, 6, 7]
            expect(OrmUtils.chunk(array, 3)).toEqual([
                [1, 2, 3],
                [4, 5, 6],
                [7],
            ])
        })

        it("should handle empty array", () => {
            expect(OrmUtils.chunk([], 3)).toEqual([])
        })

        it("should handle size larger than array length", () => {
            expect(OrmUtils.chunk([1, 2, 3], 5)).toEqual([[1, 2, 3]])
        })
    })

    describe("splitClassesAndStrings", () => {
        it("should separate classes and strings", () => {
            class TestClass {}
            const input = ["string1", TestClass, "string2", TestClass]
            const [classes, strings] = OrmUtils.splitClassesAndStrings(input)
            expect(classes).toEqual([TestClass, TestClass])
            expect(strings).toEqual(["string1", "string2"])
        })
    })

    describe("groupBy", () => {
        it("should group array items by property", () => {
            const array = [
                { id: 1, name: "a" },
                { id: 1, name: "b" },
                { id: 2, name: "c" },
            ]
            const result = OrmUtils.groupBy(array, (item) => item.id)
            expect(result).toEqual([
                {
                    id: 1,
                    items: [
                        { id: 1, name: "a" },
                        { id: 1, name: "b" },
                    ],
                },
                {
                    id: 2,
                    items: [{ id: 2, name: "c" }],
                },
            ])
        })
    })

    describe("uniq", () => {
        it("should remove duplicates from array", () => {
            expect(OrmUtils.uniq([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3])
        })

        it("should remove duplicates based on property", () => {
            const array = [
                { id: 1, name: "a" },
                { id: 1, name: "b" },
                { id: 2, name: "c" },
            ]
            expect(OrmUtils.uniq(array, "id")).toEqual([
                { id: 1, name: "a" },
                { id: 2, name: "c" },
            ])
        })

        it("should remove duplicates based on criteria function", () => {
            const array = [
                { id: 1, name: "a" },
                { id: 1, name: "b" },
                { id: 2, name: "c" },
            ]
            expect(OrmUtils.uniq(array, (item) => item.id)).toEqual([
                { id: 1, name: "a" },
                { id: 2, name: "c" },
            ])
        })
    })

    describe("deepValue", () => {
        it("should get nested property value", () => {
            const obj = { a: { b: { c: 123 } } }
            expect(OrmUtils.deepValue(obj, "a.b.c")).toBe(123)
        })

        it("should return undefined for non-existent path", () => {
            const obj = { a: { b: { c: 123 } } }
            expect(OrmUtils.deepValue(obj, "a.b.d")).toBeUndefined()
        })
    })

    describe("compareIds", () => {
        it("should compare simple id objects", () => {
            expect(OrmUtils.compareIds({ id: 1 }, { id: 1 })).toBe(true)
            expect(OrmUtils.compareIds({ id: 1 }, { id: 2 })).toBe(false)
        })

        it("should handle undefined or null values", () => {
            expect(OrmUtils.compareIds(undefined, { id: 1 })).toBe(false)
            expect(OrmUtils.compareIds({ id: 1 }, undefined)).toBe(false)
            expect(OrmUtils.compareIds({ id: null } as any, { id: 1 })).toBe(false)
            expect(OrmUtils.compareIds({ id: 1 }, { id: null } as any)).toBe(false)
        })
    })

    describe("toBoolean", () => {
        it("should convert various values to boolean", () => {
            expect(OrmUtils.toBoolean(true)).toBe(true)
            expect(OrmUtils.toBoolean(false)).toBe(false)
            expect(OrmUtils.toBoolean("true")).toBe(true)
            expect(OrmUtils.toBoolean("1")).toBe(true)
            expect(OrmUtils.toBoolean("false")).toBe(false)
            expect(OrmUtils.toBoolean("0")).toBe(false)
            expect(OrmUtils.toBoolean(1)).toBe(true)
            expect(OrmUtils.toBoolean(0)).toBe(false)
            expect(OrmUtils.toBoolean({})).toBe(false)
        })
    })

    describe("zipObject", () => {
        it("should create object from keys and values", () => {
            expect(OrmUtils.zipObject(["a", "b"], [1, 2])).toEqual({
                a: 1,
                b: 2,
            })
        })
    })

    describe("isArraysEqual", () => {
        it("should compare arrays", () => {
            expect(OrmUtils.isArraysEqual([1, 2, 3], [1, 2, 3])).toBe(true)
            expect(OrmUtils.isArraysEqual([1, 2, 3], [1, 2])).toBe(false)
            expect(OrmUtils.isArraysEqual([1, 2, 3], [1, 3, 2])).toBe(true)
        })
    })
}) 