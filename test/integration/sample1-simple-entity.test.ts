import "reflect-metadata"
import { expect, describe, it, beforeAll, beforeEach, afterAll } from "vitest"
import { DataSource } from "../../src/data-source/DataSource"
import { Post } from "../../sample/sample1-simple-entity/entity/Post"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../utils/test-utils"

describe("insertion", function () {
    // -------------------------------------------------------------------------
    // Setup
    // -------------------------------------------------------------------------

    let connections: DataSource[]
    beforeAll(
        async () =>
            (connections = await createTestingConnections({
                entities: [Post],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    afterAll(() => closeTestingConnections(connections))

    // -------------------------------------------------------------------------
    // Specifications: persist
    // -------------------------------------------------------------------------

    it("basic insert functionality", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(Post)

                const newPost = new Post()
                newPost.text = "Hello post"
                newPost.title = "this is post title"
                newPost.likesCount = 0
                const savedPost = await postRepository.save(newPost)

                expect(savedPost).toBe(newPost)
                expect(savedPost.id).toBeDefined()

                const insertedPost = await postRepository.findOneBy({
                    id: savedPost.id,
                })
                expect(insertedPost).toEqual({
                    id: savedPost.id,
                    text: "Hello post",
                    title: "this is post title",
                    likesCount: 0,
                })
            }),
        ))
})
