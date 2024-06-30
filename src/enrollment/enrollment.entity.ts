import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Project } from '../project/project.entity';
import { User } from '../user/user.entity';

export enum ProjectRole {
  Leader = 'Leader',
  Admin = 'Admin',
  Member = 'Member',
}

export enum RequestState {
  Pending = 'Pending',
  Accepted = 'Accepted',
  Rejected = 'Rejected',
  Unenrolled = 'Unenrolled',
  Kicked = 'Kicked',
}

@Entity()
@Index(['user', 'project'], { unique: true })
export class Enrollment {
  @PrimaryGeneratedColumn()
  id: number;
  @CreateDateColumn({ type: 'date' })
  creationDate: string;
  @Column({ default: ProjectRole.Member })
  role: ProjectRole;
  @Column({ default: RequestState.Pending })
  requestState: RequestState;
  @Column({ nullable: true })
  requesterMessage: string;
  @Column({ nullable: true })
  adminMessage: string;
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
