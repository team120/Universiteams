import {
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Entity,
  OneToMany,
} from 'typeorm';
import { Project } from '../project/project.entity';
import { Institution } from '../institution/institution.entity';
import { UserAffiliation } from '../user-affiliation/user-affiliation.entity';

@Entity()
export class ResearchDepartment {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  name: string;

  @ManyToOne(
    () => Institution,
    (institution) => institution.researchDepartments,
    {
      nullable: false,
      cascade: ['insert', 'update'],
      onUpdate: 'CASCADE',
    },
  )
  institution: Institution;

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
