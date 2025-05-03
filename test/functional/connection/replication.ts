import { describe, beforeEach, afterEach, it, expect } from "vitest"
import "reflect-metadata"

import { QueryRunner } from "../../../src"
import { DataSource } from "../../../src/data-source/DataSource"
import "../../utils/test-setup"
import {
    closeTestingConnections,
    createTestingConnections,
    getTypeOrmConfig,
} from "../../utils/test-utils"
import { Category } from "./entity/Category"
import { Post } from "./entity/Post"

const expectCurrentApplicationName = async (
    queryRunner: QueryRunner,
    name: string,
) => {
    const result = await queryRunner.query(
        "SELECT current_setting('application_name') as application_name;",
    )
    expect(result[0].application_name).toBe(name)
}

describe("Connection replication", () => {
    const ormConfigConnectionOptionsArray = getTypeOrmConfig()
    const postgresOptions = ormConfigConnectionOptionsArray.find(
        (options) => options.type == "postgres" && !options.skip,
    )
    if (!postgresOptions) {
        return
    }

    describe("after connection is established successfully", function () {
        let connection: DataSource

        beforeEach(async () => {
            connection = (
                await createTestingConnections({
                    entities: [Post, Category],
                    enabledDrivers: ["postgres"],
                    schemaCreate: true,
                    dropSchema: true,
                    driverSpecific: {
                        replication: {
                            master: {
                                ...postgresOptions,
                                applicationName: "master",
                            },
                            slaves: [
                                {
                                    ...postgresOptions,
                                    applicationName: "slave",
                                },
                            ],
                        },
                    },
                })
            )[0]

            const post = new Post()
            post.title = "TypeORM Intro"

            await connection
                .createQueryBuilder()
                .insert()
                .into(Post)
                .values(post)
                .execute()
        })

        afterEach(() => closeTestingConnections([connection]))

        it("connection.isInitialized should be true", () => {
            expect(connection.isInitialized).toBe(true)
        })

        it("query runners should go to the master by default", async () => {
            const queryRunner = connection.createQueryRunner()
            expect(queryRunner.getReplicationMode()).toBe("master")

            await expectCurrentApplicationName(queryRunner, "master")
            await queryRunner.release()
        })

        it("query runners can have their replication mode overridden", async () => {
            let queryRunner = connection.createQueryRunner("master")
            expect(queryRunner.getReplicationMode()).toBe("master")
            await expectCurrentApplicationName(queryRunner, "master")
            await queryRunner.release()

            queryRunner = connection.createQueryRunner("slave")
            expect(queryRunner.getReplicationMode()).toBe("slave")
            await expectCurrentApplicationName(queryRunner, "slave")
            await queryRunner.release()
        })

        it("read queries should go to the slaves by default", async () => {
            const result = await connection.manager
                .createQueryBuilder(Post, "post")
                .select("id")
                .addSelect(
                    "current_setting('application_name')",
                    "current_setting",
                )
                .execute()
            expect(result[0].current_setting).toBe("slave")
        })

        it("write queries should go to the master", async () => {
            const result = await connection.manager
                .createQueryBuilder(Post, "post")
                .insert()
                .into(Post)
                .values({
                    title: () => "current_setting('application_name')",
                })
                .returning("title")
                .execute()

            expect(result.raw[0].title).toBe("master")
        })
    })

    describe("with custom replication default mode", function () {
        let connection: DataSource

        beforeEach(async () => {
            connection = (
                await createTestingConnections({
                    entities: [Post, Category],
                    enabledDrivers: ["postgres"],
                    schemaCreate: true,
                    dropSchema: true,
                    driverSpecific: {
                        replication: {
                            defaultMode: "master",
                            master: {
                                ...postgresOptions,
                                applicationName: "master",
                            },
                            slaves: [
                                {
                                    ...postgresOptions,
                                    applicationName: "slave",
                                },
                            ],
                        },
                    },
                })
            )[0]

            const post = new Post()
            post.title = "TypeORM Intro"

            await connection
                .createQueryBuilder()
                .insert()
                .into(Post)
                .values(post)
                .execute()
        })

        afterEach(() => closeTestingConnections([connection]))

        it("query runners should go to the master by default", async () => {
            const queryRunner = connection.createQueryRunner()
            expect(queryRunner.getReplicationMode()).toBe("master")

            await expectCurrentApplicationName(queryRunner, "master")
            await queryRunner.release()
        })

        it("query runners can have their replication mode overridden", async () => {
            let queryRunner = connection.createQueryRunner("master")
            expect(queryRunner.getReplicationMode()).toBe("master")
            await expectCurrentApplicationName(queryRunner, "master")
            await queryRunner.release()

            queryRunner = connection.createQueryRunner("slave")
            expect(queryRunner.getReplicationMode()).toBe("slave")
            await expectCurrentApplicationName(queryRunner, "slave")
            await queryRunner.release()
        })

        it("read queries should go to the master by default", async () => {
            const result = await connection.manager
                .createQueryBuilder(Post, "post")
                .select("id")
                .addSelect(
                    "current_setting('application_name')",
                    "current_setting",
                )
                .execute()
            expect(result[0].current_setting).toBe("master")
        })
    })

    describe("with undefined replication", function () {
        let connection: DataSource

        beforeEach(async () => {
            connection = (
                await createTestingConnections({
                    entities: [Post, Category],
                    enabledDrivers: ["postgres"],
                    schemaCreate: true,
                    dropSchema: true,
                    driverSpecific: {
                        replication: undefined,
                    },
                })
            )[0]

            const post = new Post()
            post.title = "TypeORM Intro"

            await connection
                .createQueryBuilder()
                .insert()
                .into(Post)
                .values(post)
                .execute()
        })

        afterEach(() => closeTestingConnections([connection]))

        it("query runners should go to the available instance", async () => {
            const queryRunner = connection.createQueryRunner()
            expect(queryRunner.getReplicationMode()).toBe("master")

            await expectCurrentApplicationName(queryRunner, "")
            await queryRunner.release()
        })

        it("read queries should go to the available instance", async () => {
            const result = await connection.manager
                .createQueryBuilder(Post, "post")
                .select("id")
                .addSelect(
                    "current_setting('application_name')",
                    "current_setting",
                )
                .execute()
            expect(result[0].current_setting).toBe("")
        })
    })
})
