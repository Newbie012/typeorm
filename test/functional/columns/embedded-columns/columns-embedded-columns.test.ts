import "reflect-metadata"
import { describe, beforeAll, beforeEach, afterAll, it, expect } from "vitest"
import { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { SimplePost } from "./entity/SimplePost"
import { SimpleCounters } from "./entity/SimpleCounters"
import { Information } from "./entity/Information"
import { Post } from "./entity/Post"

describe("columns > embedded columns", () => {
    let connections: DataSource[]
    beforeAll(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
        })
    })
    beforeEach(() => reloadTestingDatabases(connections))
    afterAll(() => closeTestingConnections(connections))

    it("should insert / update / remove entity with embedded correctly", async () => {
        await Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(SimplePost)

                // save few posts
                const post = new SimplePost()
                post.title = "Post"
                post.text = "Everything about post"
                post.counters = new SimpleCounters()
                post.counters.likes = 5
                post.counters.comments = 1
                post.counters.favorites = 10
                post.counters.information = new Information()
                post.counters.information.description = "Hello post"
                await postRepository.save(post)

                const loadedPost = await postRepository.findOneBy({
                    title: "Post",
                })

                expect(loadedPost).not.toBeNull()
                expect(loadedPost!.counters).not.toBeNull()
                expect(loadedPost!.counters.information).not.toBeNull()
                expect(loadedPost).toBeInstanceOf(SimplePost)
                expect(loadedPost!.title).toBe("Post")
                expect(loadedPost!.text).toBe("Everything about post")
                expect(loadedPost!.counters).toBeInstanceOf(SimpleCounters)
                expect(loadedPost!.counters.likes).toBe(5)
                expect(loadedPost!.counters.comments).toBe(1)
                expect(loadedPost!.counters.favorites).toBe(10)
                expect(loadedPost!.counters.information).toBeInstanceOf(Information)
                expect(loadedPost!.counters.information.description).toBe("Hello post")

                post.title = "Updated post"
                post.counters.comments = 2
                post.counters.information.description = "Hello updated post"
                await postRepository.save(post)

                const loadedUpdatedPost = await postRepository.findOneBy({
                    title: "Updated post",
                })

                expect(loadedUpdatedPost).not.toBeNull()
                expect(loadedUpdatedPost!.counters).not.toBeNull()
                expect(loadedUpdatedPost!.counters.information).not.toBeNull()
                expect(loadedUpdatedPost).toBeInstanceOf(SimplePost)
                expect(loadedUpdatedPost!.title).toBe("Updated post")
                expect(loadedUpdatedPost!.text).toBe("Everything about post")
                expect(loadedUpdatedPost!.counters).toBeInstanceOf(SimpleCounters)
                expect(loadedUpdatedPost!.counters.likes).toBe(5)
                expect(loadedUpdatedPost!.counters.comments).toBe(2)
                expect(loadedUpdatedPost!.counters.favorites).toBe(10)
                expect(loadedUpdatedPost!.counters.information).toBeInstanceOf(Information)
                expect(loadedUpdatedPost!.counters.information.description).toBe("Hello updated post")

                await postRepository.remove(post)

                const removedPost = await postRepository.findOneBy({
                    title: "Post",
                })
                const removedUpdatedPost = await postRepository.findOneBy({
                    title: "Updated post",
                })
                expect(removedPost).toBeNull()
                expect(removedUpdatedPost).toBeNull()
            }),
        )
    })

    it("should properly generate column names", async () => {
        await Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(Post)
                const columns = postRepository.metadata.columns
                const databaseColumns = columns.map((c) => c.databaseName)

                expect(databaseColumns).toEqual([
                    // Post
                    // Post.id
                    "id",
                    // Post.title
                    "title",
                    // Post.text
                    "text",

                    // Post.counters()
                    // Post.counters().likes
                    "countersLikes",
                    // Post.counters().comments
                    "countersComments",
                    // Post.counters().favorites
                    "countersFavorites",
                    // Post.counters().information('info').description
                    "countersInfoDescr",
                    // Post.counters().otherCounters('testData').description
                    "countersTestDataDescr",
                    // Post.counters().dataWithoutPrefix('').description
                    "countersDescr",

                    // Post.otherCounters('testCounters')
                    // Post.otherCounters('testCounters').likes
                    "testCountersLikes",
                    // Post.otherCounters('testCounters').comments
                    "testCountersComments",
                    // Post.otherCounters('testCounters').favorites
                    "testCountersFavorites",
                    // Post.otherCounters('testCounters').information('info').description
                    "testCountersInfoDescr",
                    // Post.otherCounters('testCounters').data('data').description
                    "testCountersTestDataDescr",
                    // Post.otherCounters('testCounters').dataWithoutPrefix('').description
                    "testCountersDescr",

                    // Post.countersWithoutPrefix('')
                    // Post.countersWithoutPrefix('').likes
                    "likes",
                    // Post.countersWithoutPrefix('').comments
                    "comments",
                    // Post.countersWithoutPrefix('').favorites
                    "favorites",
                    // Post.countersWithoutPrefix('').information('info').description
                    "infoDescr",
                    // Post.countersWithoutPrefix('').data('data').description
                    "testDataDescr",
                    // Post.countersWithoutPrefix('').dataWithoutPrefix('').description
                    "descr",
                ])
            }),
        )
    })
})
