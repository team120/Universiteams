import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class StopWords {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  language: string;
  @Column()
  word: string;
}
