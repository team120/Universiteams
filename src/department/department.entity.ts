import {
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Entity,
  OneToMany,
} from 'typeorm';
import { Project } from '../project/project.entity';
import { University } from '../university/university.entity';
import { User } from '../user/user.entity';

@Entity()
export class Department {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  name: string;

  @ManyToOne(() => University, (university) => university.departments, {
    nullable: false,
    cascade: ['insert', 'update'],
    onUpdate: 'CASCADE',
  })
  university: University;

  @OneToMany(() => User, (user) => user.department, {
    nullable: true,
    cascade: ['insert', 'update'],
    onUpdate: 'CASCADE',
  })
  users: User[];

  @OneToMany(() => Project, (project) => project.department)
  projects: Project[];
}
