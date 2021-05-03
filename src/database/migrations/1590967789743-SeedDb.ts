import { MigrationInterface, getRepository } from 'typeorm';
import { NotImplementedException } from '@nestjs/common';
import * as argon2 from 'argon2';

import { Enrollment } from '../../enrollment/enrolment.entity';
import { Institution } from '../../institution/institution.entity';
import { Interest } from '../../interest/interest.entity';
import { Project, ProjectType } from '../../project/project.entity';
import { ResearchDepartment } from '../../research-department/research-department.entity';
import { User } from '../../user/user.entity';
import { UserAffiliation, UserAffiliationType } from '../../user-affiliation/user-affiliation.entity';

export class SeedDb1590967789743 implements MigrationInterface {
  public async up(): Promise<void> {
    const enrollmentsRepo = getRepository(Enrollment);
    const institutionRepo = getRepository(Institution);
    const interestsRepo = getRepository(Interest);
    const projectRepo = getRepository(Project);
    const researchDepartmentRepo = getRepository(ResearchDepartment);
    const usersRepo = getRepository(User);
    const userAffiliationRepo = getRepository(UserAffiliation);

    const institutions = {
      'utn-frro': institutionRepo.create({ name: 'UTN FRRo' }),
      'unr-fceia': institutionRepo.create({ name: 'UNR' }),
    };

    await institutionRepo.save(Object.values(institutions));

    const researchDepartments = {
      'utn-frro-isi': researchDepartmentRepo.create({
        name: 'Ingeniería en Sistemas',
        institution: institutions['utn-frro'],
      }),
      'utn-frro-ic': researchDepartmentRepo.create({
        name: 'Ingeniería Civil',
        institution: institutions['utn-frro'],
      }),
      'utn-frro-iq': researchDepartmentRepo.create({
        name: 'Ingeniería Química',
        institution: institutions['utn-frro'],
      }),
      'utn-frro-general': researchDepartmentRepo.create({
        name: 'General',
        institution: institutions['utn-frro'],
      }),
      'unr-fceia-cb': researchDepartmentRepo.create({
        name: 'Ciencias Básicas',
        institution: institutions['unr-fceia'],
      }),
      'unr-fceia-ie': researchDepartmentRepo.create({
        name: 'Ingeniería Electrónica',
        institution: institutions['unr-fceia'],
      }),
      'unr-fceia-general': researchDepartmentRepo.create({
        name: 'General',
        institution: institutions['unr-fceia'],
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

    const interests = {
      'data-science': interestsRepo.create({
        name: 'Data Science',
        projectRefsCounter: 1,
        userRefsCounter: 4,
        verified: true,        
      }),
      'it-security': interestsRepo.create({
        name: 'IT Security',
        projectRefsCounter: 0,
        userRefsCounter: 3,
        verified: true,
      }),
      'arduino': interestsRepo.create({
        name: 'Arduino',
        projectRefsCounter: 3,
        userRefsCounter: 2,
        verified: true,
      }),
      'business-intelligence': interestsRepo.create({
        name: 'Business Intelligence',
        projectRefsCounter: 2,
        userRefsCounter: 0,
        verified: true,
      }),
      'crypto-currency': interestsRepo.create({
        name: 'Crypto Currency',
        projectRefsCounter: 1,
        userRefsCounter: 1,
        verified: true,
      }),
    };

    await interestsRepo.save(Object.values(interests));
  }

  public async down(): Promise<void> {
    throw new NotImplementedException();
  }
}
