import "reflect-metadata"
import { describe, beforeAll, beforeEach, afterAll, it, expect } from "vitest"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { DataSource } from "../../../../src/data-source/DataSource"
import { Post } from "./entity/Post"

describe("columns > update and insert control", () => {
    let connections: DataSource[]
    beforeAll(async () => {
        connections = await createTestingConnections({
            entities: [Post],
        })
    })
    beforeEach(() => reloadTestingDatabases(connections))
    afterAll(() => closeTestingConnections(connections))

    it("should respect column update and insert properties", async () => {
        await Promise.all(
            connections.map(async (connection) => {
                if (connection.driver.options.type === "spanner") {
                    return
                }

                const postRepository = connection.getRepository(Post)

                // create and save a post first
                const post = new Post()
                post.title = "About columns"
                post.text = "Some text about columns"
                post.authorFirstName = "Umed"
                post.authorMiddleName = "B"
                post.authorLastName = "Good"
                await postRepository.save(post)

                // check if all columns are as expected
                let loadedPost = await postRepository.findOneBy({ id: post.id })
                expect(loadedPost!.title).toBe("About columns")
                expect(loadedPost!.text).toBe("Some text about columns")
                expect(loadedPost!.authorFirstName).toBe("Umed")
                expect(loadedPost!.authorMiddleName).toBe("Default") // insert blocked
                expect(loadedPost!.authorLastName).toBe("Default") // insert blocked

                // then update all its properties and save again
                post.title = "About columns1"
                post.text = "Some text about columns1"
                post.authorFirstName = "Umed1"
                post.authorMiddleName = "B1"
                post.authorLastName = "Good1"
                await postRepository.save(post)

                // check if all columns are as expected
                loadedPost = await postRepository.findOneBy({ id: post.id })
                expect(loadedPost!.title).toBe("About columns1")
                expect(loadedPost!.text).toBe("Some text about columns1")
                expect(loadedPost!.authorFirstName).toBe("Umed") // update blocked
                expect(loadedPost!.authorMiddleName).toBe("B1")
                expect(loadedPost!.authorLastName).toBe("Default") // update blocked
            }),
        )
    })
})
