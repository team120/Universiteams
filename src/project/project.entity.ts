import { Enrollment } from '../enrollment/enrolment.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ResearchDepartment } from '../research-department/research-department.entity';

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
  @ManyToOne(
    () => ResearchDepartment,
    (researchDepartment) => researchDepartment.projects,
    {
      cascade: ['insert', 'update'],
      onUpdate: 'CASCADE',
    },
  )
  researchDepartment: ResearchDepartment;
  @OneToMany(() => Enrollment, (enrollment) => enrollment.project, {
    nullable: false,
    cascade: ['insert', 'update'],
    onUpdate: 'CASCADE',
  })
  enrollments: Enrollment[];
}
