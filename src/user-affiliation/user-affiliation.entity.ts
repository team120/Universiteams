import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
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
  @PrimaryGeneratedColumn()
  id: number;
  @ManyToOne(() => User, (user) => user.userAffiliations, {
    nullable: false,
    cascade: ['insert', 'update'],
    onUpdate: 'CASCADE',
  })
  user: User;
  @ManyToOne(
    () => ResearchDepartment,
    (researchDepartment) => researchDepartment.usersAffiliations,
    {
      nullable: false,
      cascade: ['insert', 'update'],
      onUpdate: 'CASCADE',
    },
  )
  researchDepartment: ResearchDepartment;
  @Column()
  departmentalId: string;
  @Column({ default: UserAffiliationType.Student })
  currentType: UserAffiliationType;
}
