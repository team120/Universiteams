import { Enrollment } from '../enrollment/enrolment.entity';
import {
  PrimaryGeneratedColumn,
  Column,
  Entity,
  ManyToMany,
  OneToMany,
  JoinTable,
} from 'typeorm';
import { UserAffiliation } from '../user-affiliation/user-affiliation.entity';
import { Interest } from '../interest/interest.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ unique: true })
  mail: string;
  @Column({ default: false })
  isMailVerified: boolean;
  @Column({ nullable: true })
  password: string;
  @Column({ nullable: true })
  dni: string;
  @Column()
  firstName: string;
  @Column()
  lastName: string;

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
}
