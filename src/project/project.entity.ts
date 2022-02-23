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
import { Bookmark } from '../bookmark/bookmark.entity';

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

  @Column({ default: 0 })
  userCount: number;
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

  @Column({ default: 0 })
  bookmarkCount: number;
  @OneToMany(() => Bookmark, (bookmark) => bookmark.project, {
    nullable: true,
    cascade: ['insert', 'update'],
    onUpdate: 'CASCADE',
  })
  bookmarks: Bookmark[];
}
