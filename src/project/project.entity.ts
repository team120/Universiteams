import { Enrollment } from '../enrollment/enrolment.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Department } from '../department/department.entity';

export enum ProjectType {
  Informal = 'Informal',
  Formal = 'Formal',
}

@Entity()
export class Project {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  name: string;
  @CreateDateColumn({ type: 'date' })
  creationDate: Date;
  @Column()
  type: ProjectType;
  @Column({ default: false })
  isDown: boolean;
  @ManyToOne(() => Department, (department) => department.projects, {
    cascade: ['insert', 'update'],
    onUpdate: 'CASCADE',
  })
  department: Department;
  @OneToMany(() => Enrollment, (enrollment) => enrollment.project, {
    nullable: false,
    cascade: ['insert', 'update'],
    onUpdate: 'CASCADE',
  })
  enrollments: Enrollment[];
}
