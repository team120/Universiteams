import {
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Project } from '../project/project.entity';
import { User } from '../user/user.entity';

@Entity()
export class Favorite {
  @PrimaryColumn()
  projectId: number;
  @ManyToOne(() => Project, (project) => project.favorites)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @PrimaryColumn()
  userId: number;
  @ManyToOne(() => User, (user) => user.favorites)
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn({ type: 'date' })
  creationDate: string;
  @DeleteDateColumn()
  logicalDeleteDate: Date;
}
