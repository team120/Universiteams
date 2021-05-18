import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Institution } from '../institution/institution.entity';
import { ResearchDepartment } from '../research-department/research-department.entity';

@Entity()
export class Facility {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  name: string;
  @Column()
  abbreviation: string;

  @ManyToOne(() => Institution, (institution) => institution.facilities, {
    nullable: false,
    cascade: ['insert', 'update'],
    onUpdate: 'CASCADE',
  })
  institution: Institution;

  @OneToMany(
    () => ResearchDepartment,
    (researchDepartment) => researchDepartment.facility,
  )
  researchDepartments: ResearchDepartment[];
}
