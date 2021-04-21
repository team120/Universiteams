import { PrimaryGeneratedColumn, Column, OneToMany, Entity } from 'typeorm';
import { User } from '../user/user.entity';
import { Department } from '../department/department.entity';

@Entity()
export class University {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  name: string;

  @OneToMany(() => Department, (department) => department.university, {
    nullable: true,
    cascade: ['insert', 'update'],
    onUpdate: 'CASCADE',
  })
  departments: Department[];
}
