import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
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
  Rejected = 'Rejected', // The admin or leader rejected the enrollment request
  Declined = 'Declined', // The user declined the enrollment invitation
  Unenrolled = 'Unenrolled',
  Kicked = 'Kicked',
}

export type ManageEnrollRequestAction = 'approve' | 'reject';
export type ManageEnrollInvitationAction = 'accept' | 'decline';

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
  // Message written by the enrolled user: the request message, or the answer to
  // an invitation
  @Column({ nullable: true })
  requesterMessage: string;
  // Message written by a project admin or leader: the answer to a request, or
  // the invitation message
  @Column({ nullable: true })
  adminMessage: string;
  @ManyToOne(() => User, (user) => user.enrollments, {
    nullable: false,
    cascade: ['insert', 'update'],
    onUpdate: 'CASCADE',
  })
  user: User;
  // Set only on invitations: the admin or leader who invited the user
  @Column({ nullable: true })
  senderId?: number;
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'senderId' })
  sender?: User;
  @ManyToOne(() => Project, (project) => project.enrollments, {
    nullable: false,
    cascade: ['insert', 'update'],
    onUpdate: 'CASCADE',
  })
  project: Project;
}
