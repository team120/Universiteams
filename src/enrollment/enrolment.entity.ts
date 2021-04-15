import { Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Project } from '../project/project.entity';
import { User } from '../user/user.entity';

@Entity()
export class Enrolment {
  @PrimaryGeneratedColumn()
  id: number;
  @ManyToOne((type) => User, (user) => user.enrolments)
  user: User;
  @ManyToOne((type) => Project, (project) => project.enrolments)
  project: Project;
}
