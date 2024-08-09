import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { ResearchDepartment } from '../research-department/department.entity';
import { User } from '../user/user.entity';

export enum UserAffiliationType {
  Student = 'Student',
  Professor = 'Professor',
  Researcher = 'Researcher',
  Other = 'Other',
}

@Entity()
export class UserAffiliation {
  @CreateDateColumn({ type: 'date' })
  creationDate: string;
  @DeleteDateColumn()
  logicalDeleteDate: Date;
  @PrimaryColumn()
  userId: number;
  @ManyToOne(() => User, (user) => user.userAffiliations, {
    nullable: false,
    cascade: ['insert', 'update'],
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;
  @PrimaryColumn()
  researchDepartmentId: number;
  @ManyToOne(
    () => ResearchDepartment,
    (researchDepartment) => researchDepartment.usersAffiliations,
    {
      nullable: false,
      cascade: ['insert', 'update'],
      onUpdate: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'researchDepartmentId' })
  researchDepartment: ResearchDepartment;
  @Column({ default: UserAffiliationType.Student })
  currentType: UserAffiliationType;
}
