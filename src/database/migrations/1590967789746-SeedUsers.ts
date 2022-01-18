import { MigrationInterface, getRepository } from 'typeorm';
import { NotImplementedException } from '@nestjs/common';
import * as argon2 from 'argon2';

import { User } from '../../user/user.entity';
import { interestsSeed } from './1590967789744-SeedInterests';

export const usersSeed = {
  juanRizzo: getRepository(User).create({
    mail: 'user1@example.com',
    isMailVerified: true,
    name: 'Juan',
    lastName: 'Rizzo',
    interests: [interestsSeed.dataScience, interestsSeed.businessIntelligence],
  }),
  carlosVilla: getRepository(User).create({
    mail: 'user2@example.com',
    isMailVerified: true,
    name: 'Carlos',
    lastName: 'Villa',
    interests: [interestsSeed.itSecurity],
  }),
  marcosSanchez: getRepository(User).create({
    mail: 'user3@example.com',
    isMailVerified: true,
    name: 'Marcos',
    lastName: 'Sanchez',
  }),
};

export class SeedDb1590967789743 implements MigrationInterface {
  public async up(): Promise<void> {
    await getRepository(User).save(Object.values(usersSeed));
  }

  public async down(): Promise<void> {
    throw new NotImplementedException();
  }
}
