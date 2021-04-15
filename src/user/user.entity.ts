import { Enrolment } from 'src/enrollment/enrolment.entity';
import {
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Entity,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { University } from '../university/university.entity';

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
  @Column({ default: false })
  requestPosition: boolean;

  @ManyToOne((type) => University, (university) => university.users, {
    nullable: false,
    cascade: ['insert', 'update'],
    onUpdate: 'CASCADE',
  })
  university: University;
  @OneToMany((type) => Enrolment, (enrolment) => enrolment.user)
  enrolments: Enrolment[];
}
