import { MigrationInterface, getRepository } from 'typeorm';
import { NotImplementedException } from '@nestjs/common';
import * as argon2 from 'argon2';

import { Enrollment } from '../../enrollment/enrolment.entity';
import { Institution } from '../../institution/institution.entity';
import { Interest } from '../../interest/interest.entity';
import { Project, ProjectType } from '../../project/project.entity';
import { ResearchDepartment } from '../../research-department/research-department.entity';
import { User } from '../../user/user.entity';
import {
  UserAffiliation,
  UserAffiliationType,
} from '../../user-affiliation/user-affiliation.entity';

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
      utnFrro: institutionRepo.create({ name: 'UTN FRRo' }),
      unrFceia: institutionRepo.create({ name: 'UNR' }),
    };

    await institutionRepo.save(Object.values(institutions));

    const researchDepartments = {
      utnFrroIsi: researchDepartmentRepo.create({
        name: 'Ingeniería en Sistemas',
        institution: institutions.utnFrro,
      }),
      utnFrroIc: researchDepartmentRepo.create({
        name: 'Ingeniería Civil',
        institution: institutions.utnFrro,
      }),
      utnFrroIq: researchDepartmentRepo.create({
        name: 'Ingeniería Química',
        institution: institutions.utnFrro,
      }),
      utnFrroGeneral: researchDepartmentRepo.create({
        name: 'General',
        institution: institutions.utnFrro,
      }),
      unrFceiaCb: researchDepartmentRepo.create({
        name: 'Ciencias Básicas',
        institution: institutions.unrFceia,
      }),
      unrFceiaIe: researchDepartmentRepo.create({
        name: 'Ingeniería Electrónica',
        institution: institutions.unrFceia,
      }),
      unrFceiaGeneral: researchDepartmentRepo.create({
        name: 'General',
        institution: institutions.unrFceia,
      }),
    };

    await researchDepartmentRepo.save(Object.values(researchDepartments));

    const projects = {
      utnFrroIsiGeolocationIot: projectRepo.create({
        name:
          'Desarrollo de un sistema para identificar geoposicionamiento en entorno de Internet de la Cosas (IoT)',
        type: ProjectType.Formal,
        researchDepartment: researchDepartments.utnFrroIsi,
        creationDate: '2020-03-16 14:13:02',
      }),
      utnFrroIsiUniversiteams: projectRepo.create({
        name: 'Universiteams',
        type: ProjectType.Informal,
        researchDepartment: researchDepartments.utnFrroIsi,
        creationDate: '2021-03-16 14:13:02',
      }),
    };

    await projectRepo.save(Object.values(projects));

    const users = {
      juanRizzo: usersRepo.create({
        mail: 'user1@example.com',
        isMailVerified: true,
        password: await argon2.hash('password1'),
        name: 'Juan',
        lastName: 'Rizzo',
      }),
      carlosVilla: usersRepo.create({
        mail: 'user2@example.com',
        isMailVerified: true,
        password: await argon2.hash('password2'),
        name: 'Carlos',
        lastName: 'Villa',
      }),
      marcosSanchez: usersRepo.create({
        mail: 'user3@example.com',
        isMailVerified: true,
        password: await argon2.hash('password3'),
        name: 'Marcos',
        lastName: 'Sanchez',
      }),
    };
    await usersRepo.save(Object.values(users));

    const userAffiliations = {
      utnFrroIsiCarlosVillaProfessor: userAffiliationRepo.create({
        user: users.carlosVilla,
        researchDepartment: researchDepartments.utnFrroIsi,
        departmentalId: '44477',
        currentType: UserAffiliationType.Professor,
      }),
      unrFceiaIeCarlosVillaProfessor: userAffiliationRepo.create({
        user: users.carlosVilla,
        researchDepartment: researchDepartments.unrFceiaIe,
        departmentalId: '32000',
        currentType: UserAffiliationType.Professor,
      }),
      utnFrroIcJuanRizzo: userAffiliationRepo.create({
        user: users.juanRizzo,
        researchDepartment: researchDepartments.utnFrroIc,
        departmentalId: '66477',
      }),
      utnFrroIqMarcosSanchez: userAffiliationRepo.create({
        user: users.marcosSanchez,
        researchDepartment: researchDepartments.utnFrroIq,
        departmentalId: '744777',
        requestedType: UserAffiliationType.Professor,
      }),
      unrFceiaIeMarcosSanchez: userAffiliationRepo.create({
        user: users.marcosSanchez,
        researchDepartment: researchDepartments.unrFceiaIe,
        departmentalId: '60254',
        currentType: UserAffiliationType.Professor,
      }),
    };

    await userAffiliationRepo.save(Object.values(userAffiliations));

    const enrollments = {
      utnFrroIsiGeolocationIotJuanRizzo: enrollmentsRepo.create({
        user: users.juanRizzo,
        project: projects.utnFrroIsiGeolocationIot,
      }),
      utnFrroIsiGeolocationIotCarlosVilla: enrollmentsRepo.create({
        user: users.carlosVilla,
        project: projects.utnFrroIsiGeolocationIot,
      }),
      utnFrroIsiUniversiteamsCarlosVilla: enrollmentsRepo.create({
        user: users.carlosVilla,
        project: projects.utnFrroIsiUniversiteams,
      }),
      utnFrroIsiUniversiteamsMarcosSanchez: enrollmentsRepo.create({
        user: users.marcosSanchez,
        project: projects.utnFrroIsiUniversiteams,
      }),
    };

    await enrollmentsRepo.save(Object.values(enrollments));

    const interests = {
      dataScience: interestsRepo.create({
        name: 'Data Science',
        projectRefsCounter: 1,
        userRefsCounter: 4,
        verified: true,
      }),
      itSecurity: interestsRepo.create({
        name: 'IT Security',
        projectRefsCounter: 0,
        userRefsCounter: 3,
        verified: true,
      }),
      arduino: interestsRepo.create({
        name: 'Arduino',
        projectRefsCounter: 3,
        userRefsCounter: 2,
        verified: true,
      }),
      businessIntelligence: interestsRepo.create({
        name: 'Business Intelligence',
        projectRefsCounter: 2,
        userRefsCounter: 0,
        verified: true,
      }),
      cryptoCurrency: interestsRepo.create({
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
