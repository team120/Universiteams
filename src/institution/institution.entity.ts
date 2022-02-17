import { PrimaryGeneratedColumn, Column, OneToMany, Entity } from 'typeorm';
import { Facility } from '../facility/facility.entity';

@Entity()
export class Institution {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  name: string;
  @Column()
  abbreviation: string;
  @Column({ nullable: true })
  web: string;

  @OneToMany(() => Facility, (facility) => facility.institution, {
    nullable: false,
    cascade: ['insert', 'update'],
    onUpdate: 'CASCADE',
  })
  facilities: Facility[];
}
