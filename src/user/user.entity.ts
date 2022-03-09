import { Enrollment } from '../enrollment/enrolment.entity';
import {
  PrimaryGeneratedColumn,
  Column,
  Entity,
  ManyToMany,
  OneToMany,
  JoinTable,
  Generated,
} from 'typeorm';
import { UserAffiliation } from '../user-affiliation/user-affiliation.entity';
import { Interest } from '../interest/interest.entity';
import { Bookmark } from '../bookmark/bookmark.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ unique: true })
  email: string;
  @Column({ default: false })
  isEmailVerified: boolean;
  @Column({ nullable: true })
  password: string;
  @Column()
  firstName: string;
  @Column()
  lastName: string;
  @Column({ unique: true })
  @Generated('uuid')
  refreshUserSecret: string;

  @OneToMany(() => UserAffiliation, (userAffiliation) => userAffiliation.user, {
    nullable: false,
    cascade: ['insert', 'update'],
    onUpdate: 'CASCADE',
  })
  userAffiliations: UserAffiliation[];

  @OneToMany(() => Enrollment, (enrolment) => enrolment.user)
  enrollments: Enrollment[];

  @ManyToMany(() => Interest, (interest) => interest.users, {
    nullable: true,
    cascade: ['insert', 'update'],
    onUpdate: 'CASCADE',
  })
  @JoinTable({ name: 'user_interest' })
  interests?: Interest[];

  @OneToMany(() => Bookmark, (bookmark) => bookmark.user)
  bookmarks: Bookmark[];
}
