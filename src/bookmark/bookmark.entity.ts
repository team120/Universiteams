import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Project } from '../project/project.entity';
import { User } from '../user/user.entity';

@Entity()
export class Bookmark {
  @PrimaryColumn()
  projectId: number;
  @ManyToOne(() => Project, (project) => project.bookmarks)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @PrimaryColumn()
  userId: number;
  @ManyToOne(() => User, (user) => user.bookmarks)
  @JoinColumn({ name: 'userId' })
  user: User;
}
