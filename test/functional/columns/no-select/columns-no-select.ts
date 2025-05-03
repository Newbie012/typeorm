import "reflect-metadata"
import { describe, beforeAll, beforeEach, afterAll, it, expect } from "vitest"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { DataSource } from "../../../../src/data-source/DataSource"
import { Post } from "./entity/Post"

describe("columns > no-selection functionality", () => {
    let connections: DataSource[]
    beforeAll(async () => {
        connections = await createTestingConnections({
            entities: [Post],
        })
    })
    beforeEach(() => reloadTestingDatabases(connections))
    afterAll(() => closeTestingConnections(connections))

    it("should not select columns marked with select: false option", async () => {
        await Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(Post)

                // create and save a post first
                const post = new Post()
                post.title = "About columns"
                post.text = "Some text about columns"
                post.authorName = "Umed"
                await postRepository.save(post)

                // check if all columns are updated except for readonly columns
                const loadedPost = await postRepository.findOneBy({
                    id: post.id,
                })
                expect(loadedPost!.title).toBe("About columns")
                expect(loadedPost!.text).toBe("Some text about columns")
                expect(loadedPost!.authorName).toBeUndefined()
            }),
        )
    })

    it("should not select columns with QueryBuilder marked with select: false option", async () => {
        await Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(Post)

                // create and save a post first
                const post = new Post()
                post.title = "About columns"
                post.text = "Some text about columns"
                post.authorName = "Umed"
                await postRepository.save(post)

                // check if all columns are updated except for readonly columns
                const loadedPost = await postRepository
                    .createQueryBuilder("post")
                    .where("post.id = :id", { id: post.id })
                    .getOne()
                expect(loadedPost!.title).toBe("About columns")
                expect(loadedPost!.text).toBe("Some text about columns")
                expect(loadedPost!.authorName).toBeUndefined()
            }),
        )
    })

    it("should select columns with select: false even columns were implicitly selected", async () => {
        await Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(Post)

                // create and save a post first
                const post = new Post()
                post.title = "About columns"
                post.text = "Some text about columns"
                post.authorName = "Umed"
                await postRepository.save(post)

                // check if all columns are updated except for readonly columns
                const loadedPost = await postRepository
                    .createQueryBuilder("post")
                    .addSelect("post.authorName")
                    .where("post.id = :id", { id: post.id })
                    .getOne()
                expect(loadedPost!.title).toBe("About columns")
                expect(loadedPost!.text).toBe("Some text about columns")
                expect(loadedPost!.authorName).toBe("Umed")
            }),
        )
    })
})
