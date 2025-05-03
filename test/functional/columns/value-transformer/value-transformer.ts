import "reflect-metadata"
import { describe, beforeAll, beforeEach, afterAll, it, expect } from "vitest"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { DataSource } from "../../../../src/data-source/DataSource"
import { PhoneBook } from "./entity/PhoneBook"
import { Complex, Post } from "./entity/Post"
import { User } from "./entity/User"
import { Category } from "./entity/Category"
import { View } from "./entity/View"

describe("columns > value-transformer functionality", () => {
    let connections: DataSource[]
    beforeAll(async () => {
        connections = await createTestingConnections({
            entities: [Post, PhoneBook, User, Category, View],
        })
    })
    beforeEach(() => reloadTestingDatabases(connections))
    afterAll(() => closeTestingConnections(connections))

    it("should marshal data using the provided value-transformer", async () => {
        await Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(Post)

                // create and save a post first
                const post = new Post()
                post.title = "About columns"
                post.tags = ["simple", "transformer"]
                await postRepository.save(post)

                // then update all its properties and save again
                post.title = "About columns1"
                post.tags = ["very", "simple"]
                await postRepository.save(post)

                // check if all columns are updated except for readonly columns
                const loadedPost = await postRepository.findOneBy({
                    id: post.id,
                })
                expect(loadedPost!.title).toBe("About columns1")
                expect(loadedPost!.tags).toEqual(["very", "simple"])

                const phoneBookRepository = connection.getRepository(PhoneBook)
                const phoneBook = new PhoneBook()
                phoneBook.name = "George"
                phoneBook.phones = new Map()
                phoneBook.phones.set("work", 123456)
                phoneBook.phones.set("mobile", 1234567)
                await phoneBookRepository.save(phoneBook)

                const loadedPhoneBook = await phoneBookRepository.findOneBy({
                    id: phoneBook.id,
                })
                expect(loadedPhoneBook!.name).toBe("George")
                expect(loadedPhoneBook!.phones).toBeDefined()
                expect(loadedPhoneBook!.phones.get("work")).toBe(123456)
                expect(loadedPhoneBook!.phones.get("mobile")).toBe(1234567)
            }),
        )
    })

    it("should apply three transformers in the right order", async () => {
        await Promise.all(
            connections.map(async (connection) => {
                const userRepository = await connection.getRepository(User)
                const email = `${connection.name}@JOHN.doe`
                const user = new User()
                user.email = email

                await userRepository.save(user)

                const dbUser = await userRepository.findOneBy({ id: user.id })
                expect(dbUser?.email).toBe(email.toLocaleLowerCase())
            }),
        )
    })

    it("should apply all the transformers", async () => {
        await Promise.all(
            connections.map(async (connection) => {
                const categoryRepository = await connection.getRepository(Category)
                const description = `  ${connection.name}-DESCRIPTION   `
                const category = new Category()
                category.description = description

                await categoryRepository.save(category)

                const dbCategory = await categoryRepository.findOneBy({
                    id: category.id,
                })
                expect(dbCategory?.description).toBe(description.toLocaleLowerCase().trim())
            }),
        )
    })

    it("should apply no transformer", async () => {
        await Promise.all(
            connections.map(async (connection) => {
                const viewRepository = await connection.getRepository(View)
                const title = `${connection.name}`
                const view = new View()
                view.title = title

                await viewRepository.save(view)

                const dbView = await viewRepository.findOneBy({ id: view.id })
                expect(dbView?.title).toBe(title)
            }),
        )
    })

    it("should marshal data using a complex value-transformer", async () => {
        await Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(Post)

                // create and save a post first
                const post = new Post()
                post.title = "Complex transformers!"
                post.tags = ["complex", "transformer"]
                await postRepository.save(post)

                let loadedPost = await postRepository.findOneBy({ id: post.id })
                expect(loadedPost!.complex).toBeNull()

                // then update all its properties and save again
                post.title = "Complex transformers2!"
                post.tags = ["very", "complex", "actually"]
                post.complex = new Complex("3 2.5")
                await postRepository.save(post)

                // check if all columns are updated except for readonly columns
                loadedPost = await postRepository.findOneBy({ id: post.id })
                expect(loadedPost!.title).toBe("Complex transformers2!")
                expect(loadedPost!.tags).toEqual(["very", "complex", "actually"])
                expect(loadedPost!.complex!.x).toBe(3)
                expect(loadedPost!.complex!.y).toBe(2.5)

                // then update all its properties and save again
                post.title = "Complex transformers3!"
                post.tags = ["very", "lacking", "actually"]
                post.complex = null
                await postRepository.save(post)

                loadedPost = await postRepository.findOneBy({ id: post.id })
                expect(loadedPost!.complex).toBeNull()

                // then update all its properties and save again
                post.title = "Complex transformers4!"
                post.tags = ["very", "here", "again!"]
                post.complex = new Complex("0.5 0.5")
                await postRepository.save(post)

                loadedPost = await postRepository.findOneBy({ id: post.id })
                expect(loadedPost!.complex!.x).toBe(0.5)
                expect(loadedPost!.complex!.y).toBe(0.5)

                // then update all its properties and save again
                post.title = "Complex transformers5!"
                post.tags = ["now", "really", "lacking!"]
                post.complex = new Complex("1.05 2.3")
                await postRepository.save(post)

                loadedPost = await postRepository.findOneBy({ id: post.id })
                expect(loadedPost!.complex!.x).toBe(1.05)
                expect(loadedPost!.complex!.y).toBe(2.3)
            }),
        )
    })
})
