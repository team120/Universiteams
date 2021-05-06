import {
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Entity,
  OneToMany,
} from 'typeorm';
import { Project } from '../project/project.entity';
import { UserAffiliation } from '../user-affiliation/user-affiliation.entity';
import { Facility } from '../facility/facility.entity';

@Entity()
export class ResearchDepartment {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  name: string;
  @Column()
  abbreviation: string;

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

  @OneToMany(() => Project, (project) => project.researchDepartment)
  projects: Project[];
}
