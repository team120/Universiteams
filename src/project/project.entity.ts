import { Enrollment, RequestState } from '../enrollment/enrolment.entity';
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
import { ResearchDepartment } from '../research-department/department.entity';
import { Interest } from '../interest/interest.entity';
import { Favorite } from '../favorite/favorite.entity';

export enum ProjectType {
  Informal = 'Informal',
  Formal = 'Formal',
}

export const isFavoriteColumn = 'project_isFavorite';
export const isDownColumn = 'project_isDown';
export const requestStateColumn = 'project_requestState';

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
  @Column({ select: false, nullable: true })
  isDown: boolean;
  @Column({ select: false, nullable: true })
  isFavorite?: boolean;
  @Column({ select: false, nullable: true })
  requestState?: RequestState;

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
  favoriteCount: number;

  @OneToMany(() => Favorite, (favorite) => favorite.project, {
    nullable: true,
    cascade: ['insert', 'update'],
    onUpdate: 'CASCADE',
  })
  favorites: Favorite[];
}
