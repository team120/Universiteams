import { getRepository } from 'typeorm';
import * as argon2 from 'argon2';
import { Enrollment, ProjectRole } from '../enrollment/enrolment.entity';
import { Facility } from '../facility/facility.entity';
import { Institution } from '../institution/institution.entity';
import { Interest } from '../interest/interest.entity';
import { Project, ProjectType } from '../project/project.entity';
import { ResearchDepartment } from '../research-department/research-department.entity';
import {
  UserAffiliation,
  UserAffiliationType,
} from '../user-affiliation/user-affiliation.entity';
import { User } from '../user/user.entity';

export class Seed {
  private enrollmentsRepo = getRepository(Enrollment);
  private institutionRepo = getRepository(Institution);
  private interestRepo = getRepository(Interest);
  private projectRepo = getRepository(Project);
  private researchDepartmentRepo = getRepository(ResearchDepartment);
  private usersRepo = getRepository(User);
  private userAffiliationRepo = getRepository(UserAffiliation);
  private facilityRepo = getRepository(Facility);

  async seedDbData() {
    const institutions = this.institutionsFactory();
    await this.institutionRepo.save(Object.values(institutions));

    const facilities = this.facilitiesFactory(institutions);
    await this.facilityRepo.save(Object.values(facilities));

    const researchDepartments = this.researchDepartmentsFactory(facilities);
    await this.researchDepartmentRepo.save(Object.values(researchDepartments));

    const interests = this.interestsFactory();
    await this.interestRepo.save(Object.values(interests));

    const projects = this.projectsFactory(researchDepartments, interests);
    await this.projectRepo.save(Object.values(projects));

    const users = await this.usersFactory(interests);
    await this.usersRepo.save(Object.values(users));

    const userAffiliations = await this.userAffiliations(
      users,
      researchDepartments,
    );
    await this.userAffiliationRepo.save(Object.values(userAffiliations));

    const enrollments = await this.enrollmentsFactory(users, projects);
    await this.enrollmentsRepo.save(Object.values(enrollments));

    await this.computeProjectsUserCount();
  }

  async removeSeedDbData() {
    const institutions = this.institutionsFactory();
    await this.institutionRepo.remove(Object.values(institutions));

    const facilities = this.facilitiesFactory(institutions);
    await this.facilityRepo.remove(Object.values(facilities));

    const researchDepartments = this.researchDepartmentsFactory(facilities);
    await this.researchDepartmentRepo.remove(
      Object.values(researchDepartments),
    );

    const interests = this.interestsFactory();
    await this.interestRepo.remove(Object.values(interests));

    const projects = this.projectsFactory(researchDepartments, interests);
    await this.projectRepo.remove(Object.values(projects));

    const users = await this.usersFactory(interests);
    await this.usersRepo.remove(Object.values(users));

    const userAffiliations = await this.userAffiliations(
      users,
      researchDepartments,
    );
    await this.userAffiliationRepo.remove(Object.values(userAffiliations));

    const enrollments = await this.enrollmentsFactory(users, projects);
    await this.enrollmentsRepo.remove(Object.values(enrollments));
  }

  private async computeProjectsUserCount() {
    await this.projectRepo.query(`
      DROP TABLE IF EXISTS project_user_counts;
      CREATE TEMPORARY TABLE project_user_counts AS
      SELECT proj.id as id, count(*) as "computedUserCount"
      FROM project proj
      INNER JOIN enrollment enr
        ON "proj"."id" = enr."projectId"
      INNER JOIN "user" usr
        ON "enr"."userId" = usr.id
      GROUP BY proj.id;
      
      UPDATE project 
      SET "userCount" = "computedUserCount"
      FROM project_user_counts
      WHERE project.id = project_user_counts.id;
    `);
  }

  private institutionsFactory() {
    return {
      utn: this.institutionRepo.create({
        name: 'Universidad Tecnológica Nacional',
        abbreviation: 'UTN',
      }),
      unr: this.institutionRepo.create({
        name: 'Universidad Nacional de Rosario',
        abbreviation: 'UNR',
      }),
    };
  }

  private facilitiesFactory(
    institutions: ReturnType<typeof this.institutionsFactory>,
  ) {
    return {
      utnFrro: this.facilityRepo.create({
        name: 'Regional Rosario',
        abbreviation: 'FRRo',
        institution: institutions.utn,
      }),
      unrFceia: this.facilityRepo.create({
        name: 'Facultad de Ciencias Exactas, Ingeniería y Agrimensura',
        abbreviation: 'FCEIA',
        institution: institutions.unr,
      }),
    };
  }

  private researchDepartmentsFactory(
    facilities: ReturnType<typeof this.facilitiesFactory>,
  ) {
    return {
      utnFrroIsi: this.researchDepartmentRepo.create({
        name: 'Ingeniería en Sistemas',
        facility: facilities.utnFrro,
        abbreviation: 'ISI',
      }),
      utnFrroIc: this.researchDepartmentRepo.create({
        name: 'Ingeniería Civil',
        facility: facilities.utnFrro,
        abbreviation: 'IC',
      }),
      utnFrroIq: this.researchDepartmentRepo.create({
        name: 'Ingeniería Química',
        facility: facilities.utnFrro,
        abbreviation: 'IQ',
      }),
      utnFrroGeneral: this.researchDepartmentRepo.create({
        name: 'General',
        facility: facilities.utnFrro,
        abbreviation: 'General',
      }),
      unrFceiaCb: this.researchDepartmentRepo.create({
        name: 'Ciencias Básicas',
        facility: facilities.unrFceia,
        abbreviation: 'CB',
      }),
      unrFceiaIe: this.researchDepartmentRepo.create({
        name: 'Ingeniería Electrónica',
        facility: facilities.unrFceia,
        abbreviation: 'IE',
      }),
      unrFceiaGeneral: this.researchDepartmentRepo.create({
        name: 'General',
        facility: facilities.unrFceia,
        abbreviation: 'General',
      }),
    };
  }

  private interestsFactory() {
    return {
      dataScience: this.interestRepo.create({
        name: 'Data Science',
        projectRefsCounter: 1,
        userRefsCounter: 4,
        verified: true,
      }),
      itSecurity: this.interestRepo.create({
        name: 'IT Security',
        projectRefsCounter: 0,
        userRefsCounter: 3,
        verified: true,
      }),
      arduino: this.interestRepo.create({
        name: 'Arduino',
        projectRefsCounter: 3,
        userRefsCounter: 2,
        verified: true,
      }),
      businessIntelligence: this.interestRepo.create({
        name: 'Business Intelligence',
        projectRefsCounter: 2,
        userRefsCounter: 0,
        verified: true,
      }),
      cryptoCurrency: this.interestRepo.create({
        name: 'Crypto Currency',
        projectRefsCounter: 1,
        userRefsCounter: 1,
        verified: true,
      }),
    };
  }

  private projectsFactory(
    researchDepartments: ReturnType<typeof this.researchDepartmentsFactory>,
    interests: ReturnType<typeof this.interestsFactory>,
  ) {
    return {
      utnFrroIsiGeolocationIot: this.projectRepo.create({
        name: 'Desarrollo de un sistema para identificar geoposicionamiento en entorno de Internet de la Cosas (IoT)',
        type: ProjectType.Formal,
        researchDepartment: researchDepartments.utnFrroIsi,
        creationDate: '2020-03-16T17:13:02.000Z',
        interests: [interests.arduino, interests.itSecurity],
      }),
      utnFrroIsiUniversiteams: this.projectRepo.create({
        name: 'Universiteams',
        type: ProjectType.Informal,
        creationDate: '2021-03-16T17:13:02.000Z',
        researchDepartment: researchDepartments.utnFrroIsi,
        interests: [interests.dataScience, interests.cryptoCurrency],
      }),
    };
  }

  private async usersFactory(
    interests: ReturnType<typeof this.interestsFactory>,
  ) {
    return {
      juanRizzo: this.usersRepo.create({
        mail: 'user1@example.com',
        isMailVerified: true,
        password: await argon2.hash('password1'),
        name: 'Juan',
        lastName: 'Rizzo',
        interests: [interests.dataScience, interests.businessIntelligence],
      }),
      carlosVilla: this.usersRepo.create({
        mail: 'user2@example.com',
        isMailVerified: true,
        password: await argon2.hash('password2'),
        name: 'Carlos',
        lastName: 'Villa',
        interests: [interests.itSecurity],
      }),
      marcosSanchez: this.usersRepo.create({
        mail: 'user3@example.com',
        isMailVerified: true,
        password: await argon2.hash('password3'),
        name: 'Marcos',
        lastName: 'Sanchez',
      }),
    };
  }

  private async userAffiliations(
    users: Awaited<ReturnType<typeof this.usersFactory>>,
    researchDepartments: ReturnType<typeof this.researchDepartmentsFactory>,
  ) {
    return {
      utnFrroIsiCarlosVillaProfessor: this.userAffiliationRepo.create({
        user: users.carlosVilla,
        researchDepartment: researchDepartments.utnFrroIsi,
        departmentalId: '44477',
        currentType: UserAffiliationType.Professor,
      }),
      unrFceiaIeCarlosVillaProfessor: this.userAffiliationRepo.create({
        user: users.carlosVilla,
        researchDepartment: researchDepartments.unrFceiaIe,
        departmentalId: '32000',
        currentType: UserAffiliationType.Professor,
      }),
      utnFrroIcJuanRizzo: this.userAffiliationRepo.create({
        user: users.juanRizzo,
        researchDepartment: researchDepartments.utnFrroIc,
        departmentalId: '66477',
      }),
      utnFrroIqMarcosSanchez: this.userAffiliationRepo.create({
        user: users.marcosSanchez,
        researchDepartment: researchDepartments.utnFrroIq,
        departmentalId: '744777',
        requestedType: UserAffiliationType.Professor,
      }),
      unrFceiaIeMarcosSanchez: this.userAffiliationRepo.create({
        user: users.marcosSanchez,
        researchDepartment: researchDepartments.unrFceiaIe,
        departmentalId: '60254',
        currentType: UserAffiliationType.Professor,
      }),
    };
  }

  private async enrollmentsFactory(
    users: Awaited<ReturnType<typeof this.usersFactory>>,
    projects: ReturnType<typeof this.projectsFactory>,
  ) {
    return {
      utnFrroIsiGeolocationIotJuanRizzo: this.enrollmentsRepo.create({
        user: users.juanRizzo,
        project: projects.utnFrroIsiGeolocationIot,
      }),
      utnFrroIsiGeolocationIotCarlosVilla: this.enrollmentsRepo.create({
        user: users.carlosVilla,
        project: projects.utnFrroIsiGeolocationIot,
        role: ProjectRole.Leader,
      }),
      utnFrroIsiUniversiteamsCarlosVilla: this.enrollmentsRepo.create({
        user: users.carlosVilla,
        project: projects.utnFrroIsiUniversiteams,
        role: ProjectRole.Admin,
      }),
      utnFrroIsiUniversiteamsMarcosSanchez: this.enrollmentsRepo.create({
        user: users.marcosSanchez,
        project: projects.utnFrroIsiUniversiteams,
        role: ProjectRole.Leader,
      }),
    };
  }
}
