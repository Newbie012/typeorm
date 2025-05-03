import {
    Column,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
    Relation,
} from "../../../src/index"
import { Post } from "./Post"
@Entity("sample3_post_details")
export class PostDetails {
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        type: String,
        nullable: true,
    })
    authorName: string | null

    @Column({
        type: String,
        nullable: true,
    })
    comment: string | null

    @Column({
        type: String,
        nullable: true,
    })
    metadata: string | null

    @OneToMany(() => Post, (post) => post.details, {
        cascade: true,
    })
    posts: Relation<Post>[]
}
