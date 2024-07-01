import { Enrollment } from '../enrollment/enrollment.entity';
import {
  PrimaryGeneratedColumn,
  Column,
  Entity,
  ManyToMany,
  OneToMany,
  JoinTable,
  Generated,
  CreateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { UserAffiliation } from '../user-affiliation/user-affiliation.entity';
import { Interest } from '../interest/interest.entity';
import { Favorite } from '../favorite/favorite.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;
  @CreateDateColumn({ type: 'date' })
  creationDate: string;
  @DeleteDateColumn()
  logicalDeleteDate: Date;
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

  @OneToMany(() => Favorite, (favorite) => favorite.user)
  favorites: Favorite[];
}
