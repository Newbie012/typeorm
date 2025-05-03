import {
    Column,
    Entity,
    OneToOne,
    PrimaryGeneratedColumn,
    Relation,
} from "../../../src/index"
import { Post } from "./Post"

@Entity("sample2_post_information")
export class PostInformation {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    text: string

    @OneToOne(() => Post, (post) => post.information, {
        cascade: ["update"],
    })
    post: Relation<Post>
}
