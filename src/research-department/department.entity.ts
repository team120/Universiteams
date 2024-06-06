import {
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Entity,
  OneToMany,
  ManyToMany,
  CreateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Project } from '../project/project.entity';
import { UserAffiliation } from '../user-affiliation/user-affiliation.entity';
import { Facility } from '../facility/facility.entity';

@Entity()
export class ResearchDepartment {
  @PrimaryGeneratedColumn()
  id: number;
  @CreateDateColumn({ type: 'date' })
  creationDate: string;
  @DeleteDateColumn()
  logicalDeleteDate: Date;
  @Column()
  name: string;
  @Column()
  abbreviation: string;
  @Column({ nullable: true })
  web: string;
  @Column({ default: false })
  referenceOnly: boolean;

  @ManyToOne(() => Facility, (facility) => facility.researchDepartments, {
    nullable: false,
    cascade: ['insert', 'update'],
    onUpdate: 'CASCADE',
  })
  facility: Facility;

  @OneToMany(
    () => UserAffiliation,
    (userAffiliation) => userAffiliation.researchDepartment,
    {
      nullable: true,
      cascade: ['insert', 'update'],
      onUpdate: 'CASCADE',
    },
  )
  usersAffiliations: UserAffiliation[];

  @ManyToMany(() => Project, (project) => project.researchDepartments, {
    nullable: true,
    cascade: ['insert', 'update'],
    onUpdate: 'CASCADE',
  })
  projects: Project[];
}
