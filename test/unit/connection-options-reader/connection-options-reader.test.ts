import "reflect-metadata"
import { describe, it, expect, beforeAll, afterEach } from "vitest"
import fs from "fs/promises"

import { ConnectionOptionsReader } from "../../../src/connection/ConnectionOptionsReader"
import { DataSourceOptions } from "../../../src/data-source/DataSourceOptions"

describe("ConnectionOptionsReader", () => {
    beforeAll(async () => {
        // These files may not always exist
        await fs.mkdir("./temp/configs", { recursive: true })
        await fs.writeFile(
            "./temp/configs/.env",
            "TYPEORM_CONNECTION = mysql\nTYPEORM_DATABASE = test-env",
        )
        await fs.writeFile(
            "./temp/configs/ormconfig.env",
            "TYPEORM_CONNECTION = mysql\nTYPEORM_DATABASE = test-ormconfig-env",
        )
    })

    afterEach(() => {
        delete process.env.TYPEORM_CONNECTION
        delete process.env.TYPEORM_DATABASE
    })

    it("properly loads config with entities specified", async () => {
        type EntititesList = Function[] | string[]
        const connectionOptionsReader = new ConnectionOptionsReader({
            root: __dirname,
            configName: "configs/class-entities",
        })
        const options: DataSourceOptions = await connectionOptionsReader.get(
            "test-conn",
        )
        expect(options.entities).toBeInstanceOf(Array)
        const entities: EntititesList = options.entities as EntititesList
        expect(entities.length).toBe(1)
    })

    it("properly loads sqlite in-memory/path config", async () => {
        const connectionOptionsReader = new ConnectionOptionsReader({
            root: __dirname,
            configName: "configs/sqlite-memory",
        })
        const inmemoryOptions: DataSourceOptions =
            await connectionOptionsReader.get("memory")
        expect(inmemoryOptions.database).toBe(":memory:")
        const fileOptions: DataSourceOptions =
            await connectionOptionsReader.get("file")
        expect(fileOptions.database).toContain("/test")
    })

    it("properly loads config with specified file path", async () => {
        const connectionOptionsReader = new ConnectionOptionsReader({
            root: __dirname,
            configName: "configs/test-path-config",
        })
        const fileOptions: DataSourceOptions =
            await connectionOptionsReader.get("file")
        expect(fileOptions.database).toContain("/test-js")
    })

    it("properly loads asynchronous config with specified file path", async () => {
        const connectionOptionsReader = new ConnectionOptionsReader({
            root: __dirname,
            configName: "configs/test-path-config-async",
        })
        const fileOptions = await connectionOptionsReader.get("file")
        expect(fileOptions.database).toContain("/test-js-async")
    })

    it("properly loads config with specified file path from esm in js", async () => {
        const connectionOptionsReader = new ConnectionOptionsReader({
            root: __dirname,
            configName: "configs/test-path-config-esm",
        })
        const fileOptions: DataSourceOptions =
            await connectionOptionsReader.get("file")
        expect(fileOptions.database).toContain("/test-js-esm")
    })

    it("properly loads config from .env file", async () => {
        const connectionOptionsReader = new ConnectionOptionsReader({
            root: "./temp",
            configName: "configs/.env",
        })
        const [fileOptions]: DataSourceOptions[] =
            await connectionOptionsReader.all()
        expect(fileOptions.database).toContain("test-env")
        expect(process.env.TYPEORM_DATABASE).toBe("test-env")
    })

    it("properly loads config from ormconfig.env file", async () => {
        const connectionOptionsReader = new ConnectionOptionsReader({
            root: "./temp",
            configName: "configs/ormconfig.env",
        })
        const [fileOptions]: DataSourceOptions[] =
            await connectionOptionsReader.all()
        expect(fileOptions.database).toContain("test-ormconfig-env")
        expect(process.env.TYPEORM_DATABASE).toBe("test-ormconfig-env")
    })

    it("properly loads config ormconfig.env when given multiple choices", async () => {
        const connectionOptionsReader = new ConnectionOptionsReader({
            root: "./temp/configs",
        })
        const [fileOptions]: DataSourceOptions[] =
            await connectionOptionsReader.all()
        expect(fileOptions.database).toContain("test-ormconfig-env")
        expect(process.env.TYPEORM_DATABASE).toBe("test-ormconfig-env")
    })
}) 