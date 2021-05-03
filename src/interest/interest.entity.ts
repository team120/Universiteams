import { Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Project } from "../project/project.entity";
import { User } from "../user/user.entity";

@Entity()
export class Interest {
    @PrimaryGeneratedColumn()
    id: number;
    @Column()
    name: string;
    @Column()
    projectRefsCounter: number;
    @Column()
    userRefsCounter: number;
    @Column()
    verified: boolean;

    @ManyToMany(() => Project, (project) => project.interests, {
        nullable: true,
        cascade: ['insert', 'update'],
        onUpdate: 'CASCADE',
    })
    @JoinTable()
    projects: Project[];

    @ManyToMany(() => User, (user) => user.interests, {
        nullable: true,
        cascade: ['insert', 'update'],
        onUpdate: 'CASCADE',
    })
    @JoinTable()
    users: User[];
}
