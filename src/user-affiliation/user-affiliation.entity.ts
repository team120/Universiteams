import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Department } from '../department/department.entity';
import { User } from '../user/user.entity';

export enum UserAffiliationType {
  Student = 'Student',
  Professor = 'Professor',
  Other = 'Other',
}

@Entity()
export class UserAffiliation {
  @PrimaryGeneratedColumn()
  id: number;
  @ManyToOne(() => User, (user) => user.userAffiliations)
  user: User;
  @ManyToOne(() => Department, (department) => department.usersAffiliations)
  department: Department;
  @Column()
  departmentalId: string;
  @Column({ default: UserAffiliationType.Student })
  currentType: UserAffiliationType;
  @Column({ nullable: true })
  requestedType: UserAffiliationType;
  @Column({ nullable: true })
  lastVerification: Date;
}
