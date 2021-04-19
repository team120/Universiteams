import { Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Project } from '../project/project.entity';
import { User } from '../user/user.entity';

@Entity()
export class Enrollment {
  @PrimaryGeneratedColumn()
  id: number;
  @ManyToOne(() => User, (user) => user.enrollments)
  user: User;
  @ManyToOne(() => Project, (project) => project.enrollments)
  project: Project;
}
