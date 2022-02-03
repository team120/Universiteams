import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Project } from '../project/project.entity';
import { User } from '../user/user.entity';

export enum ProjectRole {
  Leader = 'Leader',
  Admin = 'Admin',
  Member = 'Member',
}

@Entity()
export class Enrollment {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ default: ProjectRole.Member })
  role: ProjectRole;
  @ManyToOne(() => User, (user) => user.enrollments, {
    nullable: false,
    cascade: ['insert', 'update'],
    onUpdate: 'CASCADE',
  })
  user: User;
  @ManyToOne(() => Project, (project) => project.enrollments, {
    nullable: false,
    cascade: ['insert', 'update'],
    onUpdate: 'CASCADE',
  })
  project: Project;
}
