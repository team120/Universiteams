import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Institution } from '../institution/institution.entity';
import { ResearchDepartment } from '../research-department/department.entity';

@Entity()
export class Facility {
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
