import { Department } from '../../department/department.entity';
import { Enrollment } from '../../enrollment/enrolment.entity';
import { Project, ProjectType } from '../../project/project.entity';
import { University } from '../../university/university.entity';
import { User } from '../../user/user.entity';
import { MigrationInterface, getRepository } from 'typeorm';
import * as argon2 from 'argon2';
import { NotImplementedException } from '@nestjs/common';
import {
  UserAffiliation,
  UserAffiliationType,
} from '../../user-affiliation/user-affiliation.entity';

export class SeedDb1590967789743 implements MigrationInterface {
  public async up(): Promise<void> {
    const usersRepo = getRepository(User);
    const universityRepo = getRepository(University);
    const projectRepo = getRepository(Project);
    const enrollmentsRepo = getRepository(Enrollment);
    const departmentRepo = getRepository(Department);
    const userAffiliationRepo = getRepository(UserAffiliation);

    const universities = {
      'utn-frro': universityRepo.create({ name: 'UTN FRRo' }),
      'unr-fceia': universityRepo.create({ name: 'UNR' }),
    };

    await universityRepo.save(Object.values(universities));

    const departments = {
      'utn-frro-isi': departmentRepo.create({
        name: 'Ingeniería en Sistemas',
        university: universities['utn-frro'],
      }),
      'utn-frro-ic': departmentRepo.create({
        name: 'Ingeniería Civil',
        university: universities['utn-frro'],
      }),
      'utn-frro-iq': departmentRepo.create({
        name: 'Ingeniería Química',
        university: universities['utn-frro'],
      }),
      'utn-frro-general': departmentRepo.create({
        name: 'General',
        university: universities['utn-frro'],
      }),
      'unr-fceia-cb': departmentRepo.create({
        name: 'Ciencias Básicas',
        university: universities['unr-fceia'],
      }),
      'unr-fceia-ie': departmentRepo.create({
        name: 'Ingeniería Electrónica',
        university: universities['unr-fceia'],
      }),
      'unr-fceia-general': departmentRepo.create({
        name: 'Independiente',
        university: universities['unr-fceia'],
      }),
    };

    await departmentRepo.save(Object.values(departments));

    const projects = {
      'utn-frro-isi:geolocation-iot': projectRepo.create({
        name:
          'Desarrollo de un sistema para identificar geoposicionamiento en entorno de Internet de la Cosas (IoT)',
        type: ProjectType.Formal,
        department: departments['utn-frro-isi'],
        creationDate: '2020-03-16 14:13:02',
      }),
      'utn-frro-isi:universiteams': projectRepo.create({
        name: 'Universiteams',
        type: ProjectType.Informal,
        department: departments['utn-frro-isi'],
        creationDate: '2021-03-16 14:13:02',
      }),
    };

    await projectRepo.save(Object.values(projects));

    const users = {
      'juan-rizzo': usersRepo.create({
        mail: 'user1@example.com',
        isMailVerified: true,
        password: await argon2.hash('password1'),
        name: 'Juan',
        lastName: 'Rizzo',
      }),
      'carlos-villa': usersRepo.create({
        mail: 'user2@example.com',
        isMailVerified: true,
        password: await argon2.hash('password2'),
        name: 'Carlos',
        lastName: 'Villa',
      }),
      'marcos-sanchez': usersRepo.create({
        mail: 'user3@example.com',
        isMailVerified: true,
        password: await argon2.hash('password3'),
        name: 'Marcos',
        lastName: 'Sanchez',
        requestPosition: true,
      }),
    };
    await usersRepo.save(Object.values(users));

    const userAffiliations = {
      'utn-frro-isi:carlos-villa-professor': userAffiliationRepo.create({
        user: users['carlos-villa'],
        department: departments['utn-frro-isi'],
        departmentalId: '44477',
        currentType: UserAffiliationType.Professor,
      }),
      'unr-fceia-ie:carlos-villa-professor': userAffiliationRepo.create({
        user: users['carlos-villa'],
        department: departments['unr-fceia-ie'],
        departmentalId: '32000',
        currentType: UserAffiliationType.Professor,
      }),
      'utn-frro-ic:juan-rizzo': userAffiliationRepo.create({
        user: users['juan-rizzo'],
        department: departments['utn-frro-ic'],
        departmentalId: '66477',
      }),
      'utn-frro-iq:marcos-sanchez': userAffiliationRepo.create({
        user: users['marcos-sanchez'],
        department: departments['utn-frro-iq'],
        departmentalId: '744777',
      }),
      'unr-fceia-cb:marcos-sanchez': userAffiliationRepo.create({
        user: users['marcos-sanchez'],
        department: departments['unr-fceia-ie'],
        departmentalId: '60254',
        currentType: UserAffiliationType.Professor,
      }),
    };

    await userAffiliationRepo.save(Object.values(userAffiliations));

    const enrollments = {
      'utn-frro-isi:geolocation-iot:juan-rizzo': enrollmentsRepo.create({
        user: users['juan-rizzo'],
        project: projects['utn-frro-isi-geolocation-iot'],
      }),
      'utn-frro-isi:geolocation-iot:carlos-villa': enrollmentsRepo.create({
        user: users['carlos-villa'],
        project: projects['utn-frro-isi-geolocation-iot'],
      }),
      'utn-frro-isi:universiteams:carlos-villa': enrollmentsRepo.create({
        user: users['carlos-villa'],
        project: projects['utn-frro-isi-universiteams'],
      }),
      'utn-frro-isi:universiteams:marcos-sanchez': enrollmentsRepo.create({
        user: users['marcos-sanchez'],
        project: projects['utn-frro-isi-universiteams'],
      }),
    };

    await enrollmentsRepo.save(Object.values(enrollments));
  }

  public async down(): Promise<void> {
    throw new NotImplementedException();
  }
}
