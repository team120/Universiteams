import { ResearchDepartment } from '../../research-department/research-department.entity';
import { Enrollment } from '../../enrollment/enrolment.entity';
import { Project, ProjectType } from '../../project/project.entity';
import { Institution } from '../../institution/institution.entity';
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
    const institutionRepo = getRepository(Institution);
    const projectRepo = getRepository(Project);
    const enrollmentsRepo = getRepository(Enrollment);
    const researchDepartmentRepo = getRepository(ResearchDepartment);
    const userAffiliationRepo = getRepository(UserAffiliation);

    const universities = {
      'utn-frro': institutionRepo.create({ name: 'UTN FRRo' }),
      'unr-fceia': institutionRepo.create({ name: 'UNR' }),
    };

    await institutionRepo.save(Object.values(universities));

    const researchDepartments = {
      'utn-frro-isi': researchDepartmentRepo.create({
        name: 'Ingeniería en Sistemas',
        institution: universities['utn-frro'],
      }),
      'utn-frro-ic': researchDepartmentRepo.create({
        name: 'Ingeniería Civil',
        institution: universities['utn-frro'],
      }),
      'utn-frro-iq': researchDepartmentRepo.create({
        name: 'Ingeniería Química',
        institution: universities['utn-frro'],
      }),
      'utn-frro-general': researchDepartmentRepo.create({
        name: 'General',
        institution: universities['utn-frro'],
      }),
      'unr-fceia-cb': researchDepartmentRepo.create({
        name: 'Ciencias Básicas',
        institution: universities['unr-fceia'],
      }),
      'unr-fceia-ie': researchDepartmentRepo.create({
        name: 'Ingeniería Electrónica',
        institution: universities['unr-fceia'],
      }),
      'unr-fceia-general': researchDepartmentRepo.create({
        name: 'General',
        institution: universities['unr-fceia'],
      }),
    };

    await researchDepartmentRepo.save(Object.values(researchDepartments));

    const projects = {
      'utn-frro-isi:geolocation-iot': projectRepo.create({
        name:
          'Desarrollo de un sistema para identificar geoposicionamiento en entorno de Internet de la Cosas (IoT)',
        type: ProjectType.Formal,
        researchDepartment: researchDepartments['utn-frro-isi'],
        creationDate: '2020-03-16 14:13:02',
      }),
      'utn-frro-isi:universiteams': projectRepo.create({
        name: 'Universiteams',
        type: ProjectType.Informal,
        researchDepartment: researchDepartments['utn-frro-isi'],
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
      }),
    };
    await usersRepo.save(Object.values(users));

    const userAffiliations = {
      'utn-frro-isi:carlos-villa-professor': userAffiliationRepo.create({
        user: users['carlos-villa'],
        researchDepartment: researchDepartments['utn-frro-isi'],
        departmentalId: '44477',
        currentType: UserAffiliationType.Professor,
      }),
      'unr-fceia-ie:carlos-villa-professor': userAffiliationRepo.create({
        user: users['carlos-villa'],
        researchDepartment: researchDepartments['unr-fceia-ie'],
        departmentalId: '32000',
        currentType: UserAffiliationType.Professor,
      }),
      'utn-frro-ic:juan-rizzo': userAffiliationRepo.create({
        user: users['juan-rizzo'],
        researchDepartment: researchDepartments['utn-frro-ic'],
        departmentalId: '66477',
      }),
      'utn-frro-iq:marcos-sanchez': userAffiliationRepo.create({
        user: users['marcos-sanchez'],
        researchDepartment: researchDepartments['utn-frro-iq'],
        departmentalId: '744777',
        requestedType: UserAffiliationType.Professor,
      }),
      'unr-fceia-cb:marcos-sanchez': userAffiliationRepo.create({
        user: users['marcos-sanchez'],
        researchDepartment: researchDepartments['unr-fceia-ie'],
        departmentalId: '60254',
        currentType: UserAffiliationType.Professor,
      }),
    };

    await userAffiliationRepo.save(Object.values(userAffiliations));

    const enrollments = {
      'utn-frro-isi:geolocation-iot:juan-rizzo': enrollmentsRepo.create({
        user: users['juan-rizzo'],
        project: projects['utn-frro-isi:geolocation-iot'],
      }),
      'utn-frro-isi:geolocation-iot:carlos-villa': enrollmentsRepo.create({
        user: users['carlos-villa'],
        project: projects['utn-frro-isi:geolocation-iot'],
      }),
      'utn-frro-isi:universiteams:carlos-villa': enrollmentsRepo.create({
        user: users['carlos-villa'],
        project: projects['utn-frro-isi:universiteams'],
      }),
      'utn-frro-isi:universiteams:marcos-sanchez': enrollmentsRepo.create({
        user: users['marcos-sanchez'],
        project: projects['utn-frro-isi:universiteams'],
      }),
    };

    await enrollmentsRepo.save(Object.values(enrollments));
  }

  public async down(): Promise<void> {
    throw new NotImplementedException();
  }
}
