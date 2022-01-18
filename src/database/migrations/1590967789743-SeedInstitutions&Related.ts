import { MigrationInterface, getRepository } from 'typeorm';
import { NotImplementedException } from '@nestjs/common';
import { Institution } from '../../institution/institution.entity';
import { ResearchDepartment } from '../../research-department/research-department.entity';
import { Facility } from '../../facility/facility.entity';

export const institutions = {
  utn: getRepository(Institution).create({
    name: 'Universidad Tecnológica Nacional',
    abbreviation: 'UTN',
  }),
  unr: getRepository(Institution).create({
    name: 'Universidad Nacional de Rosario',
    abbreviation: 'UNR',
  }),
};

export const facilities = {
  utnFrro: getRepository(Facility).create({
    name: 'Regional Rosario',
    abbreviation: 'FRRo',
    institution: institutions.utn,
  }),
  unrFceia: getRepository(Facility).create({
    name: 'Facultad de Ciencias Exactas, Ingeniería y Agrimensura',
    abbreviation: 'FCEIA',
    institution: institutions.unr,
  }),
};

export const researchDepartmentsSeed = {
  utnFrroIsi: getRepository(ResearchDepartment).create({
    name: 'Ingeniería en Sistemas',
    facility: facilities.utnFrro,
    abbreviation: 'ISI',
  }),
  utnFrroIc: getRepository(ResearchDepartment).create({
    name: 'Ingeniería Civil',
    facility: facilities.utnFrro,
    abbreviation: 'IC',
  }),
  utnFrroIq: getRepository(ResearchDepartment).create({
    name: 'Ingeniería Química',
    facility: facilities.utnFrro,
    abbreviation: 'IQ',
  }),
  utnFrroGeneral: getRepository(ResearchDepartment).create({
    name: 'General',
    facility: facilities.utnFrro,
    abbreviation: 'General',
  }),
  unrFceiaCb: getRepository(ResearchDepartment).create({
    name: 'Ciencias Básicas',
    facility: facilities.unrFceia,
    abbreviation: 'CB',
  }),
  unrFceiaIe: getRepository(ResearchDepartment).create({
    name: 'Ingeniería Electrónica',
    facility: facilities.unrFceia,
    abbreviation: 'IE',
  }),
  unrFceiaGeneral: getRepository(ResearchDepartment).create({
    name: 'General',
    facility: facilities.unrFceia,
    abbreviation: 'General',
  }),
};

export class SeedDb1590967789743 implements MigrationInterface {
  public async up(): Promise<void> {
    await getRepository(Institution).save(Object.values(institutions));

    await getRepository(Facility).save(Object.values(facilities));

    await getRepository(ResearchDepartment).save(
      Object.values(researchDepartmentsSeed),
    );
  }

  public async down(): Promise<void> {
    throw new NotImplementedException();
  }
}
