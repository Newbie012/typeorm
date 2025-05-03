import "reflect-metadata"
import { describe, beforeAll, beforeEach, afterAll, it, expect } from "vitest"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { DataSource } from "../../../../src/data-source/DataSource"
import { Post } from "./entity/Post"

describe("columns > getters and setters", () => {
    let connections: DataSource[]
    beforeAll(async () => {
        connections = await createTestingConnections({
            entities: [Post],
        })
    })
    beforeEach(() => reloadTestingDatabases(connections))
    afterAll(() => closeTestingConnections(connections))

    it("should not update columns marked with readonly property", async () => {
        await Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(Post)

                // create and save a post first
                const post = new Post()
                post.title = "hello"
                await postRepository.save(post)

                // check if title is a value applied by a setter
                const loadedPost1 = await postRepository.findOneBy({
                    id: post.id,
                })
                expect(loadedPost1!.title).toBe("bye")

                // try to load a column by its value
                const loadedPost2 = await postRepository.findOneBy({
                    title: "bye",
                })
                expect(loadedPost2!.title).toBe("bye")
            }),
        )
    })
})
