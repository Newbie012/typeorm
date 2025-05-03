import { describe, beforeAll, beforeEach, afterAll, it, expect } from "vitest"
import "reflect-metadata"
import { DataSource } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Test } from "./entity/Test"

describe("columns > comments", () => {
    let connections: DataSource[]
    beforeAll(async () => {
        connections = await createTestingConnections({
            entities: [Test],
            // Only supported on cockroachdb, mysql, postgres, and sap
            enabledDrivers: ["cockroachdb", "mysql", "postgres", "sap"],
        })
    })
    beforeEach(() => reloadTestingDatabases(connections))
    afterAll(() => closeTestingConnections(connections))

    it("should persist comments of different types to the database", async () => {
        await Promise.all(
            connections.map(async (connection) => {
                const table = (await connection
                    .createQueryRunner()
                    .getTable("test"))!

                expect(table.findColumnByName("a")!.comment).toBe("Hello World")
                expect(table.findColumnByName("b")!.comment).toBe("Hello\nWorld")
                expect(table.findColumnByName("c")!.comment).toBe(
                    "Hello World! It's going to be a beautiful day.",
                )
                expect(table.findColumnByName("d")!.comment).toBe(
                    "Hello World! #@!$`",
                )
                expect(table.findColumnByName("e")!.comment).toBe(
                    "Hello World. \r\n\t\b\f\v",
                )
                expect(table.findColumnByName("f")!.comment).toBe(
                    "Hello World.\\",
                )
                expect(table.findColumnByName("g")!.comment).toBe(" ")
                expect(table.findColumnByName("h")!.comment).toBeUndefined()
                expect(table.findColumnByName("i")!.comment).toBeUndefined()
            }),
        )
    })
})
