import { Enrollment } from '../enrollment/enrolment.entity';
import { PrimaryGeneratedColumn, Column, Entity, OneToMany } from 'typeorm';
import { UserAffiliation } from '../user-affiliation/user-affiliation.entity';

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
  @Column({ nullable: true })
  name: string;
  @Column({ nullable: true })
  lastName: string;
  @Column({ nullable: true })
  studentId: number;
  @Column({ nullable: true })
  professorId: number;
  @Column({ nullable: true })
  professorCategory: string;
  @Column({ nullable: true })
  gender: string;
  @Column({ nullable: true })
  picture: string;

  @OneToMany(() => UserAffiliation, (userAffiliation) => userAffiliation.user, {
    nullable: false,
    cascade: ['insert', 'update'],
    onUpdate: 'CASCADE',
  })
  userAffiliations: UserAffiliation[];
  @OneToMany(() => Enrollment, (enrolment) => enrolment.user)
  enrollments: Enrollment[];
}
