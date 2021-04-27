import { PrimaryGeneratedColumn, Column, OneToMany, Entity } from 'typeorm';
import { ResearchDepartment } from '../research-department/research-department.entity';

@Entity()
export class Institution {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  name: string;

  @OneToMany(
    () => ResearchDepartment,
    (researchDepartment) => researchDepartment.institution,
    {
      nullable: true,
      cascade: ['insert', 'update'],
      onUpdate: 'CASCADE',
    },
  )
  researchDepartments: ResearchDepartment[];
}
