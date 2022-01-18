import { MigrationInterface, getRepository } from 'typeorm';
import { NotImplementedException } from '@nestjs/common';
import { Interest } from '../../interest/interest.entity';

export const interestsSeed = {
  dataScience: getRepository(Interest).create({
    name: 'Data Science',
    projectRefsCounter: 1,
    userRefsCounter: 4,
    verified: true,
  }),
  itSecurity: getRepository(Interest).create({
    name: 'IT Security',
    projectRefsCounter: 0,
    userRefsCounter: 3,
    verified: true,
  }),
  arduino: getRepository(Interest).create({
    name: 'Arduino',
    projectRefsCounter: 3,
    userRefsCounter: 2,
    verified: true,
  }),
  businessIntelligence: getRepository(Interest).create({
    name: 'Business Intelligence',
    projectRefsCounter: 2,
    userRefsCounter: 0,
    verified: true,
  }),
  cryptoCurrency: getRepository(Interest).create({
    name: 'Crypto Currency',
    projectRefsCounter: 1,
    userRefsCounter: 1,
    verified: true,
  }),
};

export class SeedDb1590967789743 implements MigrationInterface {
  public async up(): Promise<void> {
    await getRepository(Interest).save(Object.values(interestSeed));
  }

  public async down(): Promise<void> {
    throw new NotImplementedException();
  }
}
