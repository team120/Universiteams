import { Enrollment } from '../enrollment/enrolment.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ResearchDepartment } from '../research-department/research-department.entity';
import { Interest } from '../interest/interest.entity';

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
  creationDate: string;
  @Column({ type: 'date', nullable: true })
  endDate: string;
  @DeleteDateColumn()
  logicalDeleteDate: Date;
  @Column()
  type: ProjectType;
  @Column({ default: 'spanish' })
  language: 'spanish' | 'english';
  @Column({ default: 0 })
  userCount: number;
  @Column({ nullable: true })
  web: string;
  @Column({ default: false })
  referenceOnly: boolean;

  @ManyToMany(
    () => ResearchDepartment,
    (researchDepartment) => researchDepartment.projects,
    {
      cascade: ['insert', 'update'],
      onUpdate: 'CASCADE',
    },
  )
  @JoinTable({ name: 'project_research_department' })
  researchDepartments: ResearchDepartment[];

  @OneToMany(() => Enrollment, (enrollment) => enrollment.project, {
    nullable: false,
    cascade: ['insert', 'update'],
    onUpdate: 'CASCADE',
  })
  enrollments: Enrollment[];

  @ManyToMany(() => Interest, (interest) => interest.projects, {
    nullable: true,
    cascade: ['insert', 'update'],
    onUpdate: 'CASCADE',
  })
  @JoinTable({ name: 'project_interest' })
  interests: Interest[];
}
