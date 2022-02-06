import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Project } from '../project/project.entity';
import { User } from '../user/user.entity';

@Entity()
export class Interest {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  name: string;
  @Column({ default: 0 })
  projectRefsCounter: number;
  @Column({ default: 0 })
  userRefsCounter: number;
  @Column({ default: false })
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
