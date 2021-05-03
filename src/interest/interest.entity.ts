import { Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from 'typeorm';


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
}
