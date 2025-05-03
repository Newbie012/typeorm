import "reflect-metadata"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { describe, it, beforeAll, afterAll, expect } from "vitest"

describe("query runner > has column", () => {
    let connections: DataSource[]
    beforeAll(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    afterAll(() => closeTestingConnections(connections))

    it("should correctly check if column exist", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                const hasIdColumn = await queryRunner.hasColumn("post", "id")
                const hasNameColumn = await queryRunner.hasColumn(
                    "post",
                    "name",
                )
                const hasVersionColumn = await queryRunner.hasColumn(
                    "post",
                    "version",
                )
                const hasDescriptionColumn = await queryRunner.hasColumn(
                    "post",
                    "description",
                )

                expect(hasIdColumn).toBe(true)
                expect(hasNameColumn).toBe(true)
                expect(hasVersionColumn).toBe(true)
                expect(hasDescriptionColumn).toBe(false)

                await queryRunner.release()
            }),
        ))
})
