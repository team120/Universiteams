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
import { randomInt } from 'crypto';

class NumIncrease {
  constructor(private num: number) {}

  next() {
    return this.num++;
  }
}

export class Seed {
  private readonly enrollmentsRepo = getRepository(Enrollment);
  private readonly institutionRepo = getRepository(Institution);
  private readonly interestRepo = getRepository(Interest);
  private readonly projectRepo = getRepository(Project);
  private readonly researchDepartmentRepo = getRepository(ResearchDepartment);
  private readonly usersRepo = getRepository(User);
  private readonly userAffiliationRepo = getRepository(UserAffiliation);
  private readonly facilityRepo = getRepository(Facility);

  async seedDbData() {
    const institutions = this.institutionsFactory();
    await this.institutionRepo.save(Object.values(institutions));

    const facilities = this.facilitiesFactory(institutions);
    await this.facilityRepo.save(Object.values(facilities));

    const researchDepartments = this.researchDepartmentsFactory(facilities);
    await this.researchDepartmentRepo.save(Object.values(researchDepartments));

    const interests = this.interestsFactory();
    await this.interestRepo.save(Object.values(interests));

    const users = await this.usersFactory(researchDepartments, interests);
    await this.usersRepo.save(Object.values(users));

    const projects = this.projectsFactory(
      researchDepartments,
      users,
      interests,
    );
    await this.projectRepo.save(Object.values(projects));

    await this.computeProjectsUserCount();
    await this.computeInterestsRefsCount();
  }

  async removeSeedDbData() {
    const institutions = this.institutionsFactory();
    const facilities = this.facilitiesFactory(institutions);
    const researchDepartments = this.researchDepartmentsFactory(facilities);
    const interests = this.interestsFactory();
    const users = await this.usersFactory(researchDepartments, interests);
    const projects = this.projectsFactory(
      researchDepartments,
      users,
      interests,
    );
    await this.userAffiliationRepo.query(`
      WITH related_user_affiliations as (
        SELECT ua.id
        FROM user_affiliation ua
        WHERE ua."researchDepartmentId" IN (${Object.values(researchDepartments)
          .map((rs) => rs.usersAffiliations)
          .join(', ')}))
      DELETE FROM user_affiliation
      USING related_user_affiliations
      WHERE user_affiliation.id = related_user_affiliations.id;
    `);
    await this.enrollmentsRepo.query(`
      WITH related_enrollments as (
        SELECT enr.id
        FROM enrollment enr
        WHERE enr."projectId" IN (${Object.values(projects)
          .map((p) => p.id)
          .join(', ')}))
      DELETE FROM enrollment
      USING related_enrollments
      WHERE enrollment.id = related_enrollments.id;
    `);
    await this.usersRepo.remove(Object.values(users));
    await this.projectRepo.remove(Object.values(projects));
    await this.interestRepo.remove(Object.values(interests));
    await this.researchDepartmentRepo.remove(
      Object.values(researchDepartments),
    );
    await this.facilityRepo.remove(Object.values(facilities));
    await this.institutionRepo.remove(Object.values(institutions));
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

  private async computeInterestsRefsCount() {
    await this.projectRepo.query(`
      UPDATE interest
      SET "projectRefsCounter" = projects_interest_count."count"
      FROM (
        SELECT i.id, count(ip."interestId") as "count"
        FROM public.interest i
        LEFT JOIN interest_projects_project ip
          ON id = ip."interestId"
        GROUP BY i.id
        ) as projects_interest_count
      WHERE interest.id = projects_interest_count.id;

      UPDATE interest
      SET "userRefsCounter" = users_interest_count."count"
      FROM (
        SELECT i.id, count(iu."interestId") as "count"
        FROM public.interest i
        LEFT JOIN interest_users_user iu
          ON i.id = iu."interestId"
        GROUP BY i.id
        ) as users_interest_count
      WHERE interest.id = users_interest_count.id;
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
      utnFrroBasicas: this.researchDepartmentRepo.create({
        name: 'Ciencias Básicas',
        facility: facilities.utnFrro,
        abbreviation: 'CB',
      }),
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
      utnFrroCaimi: this.researchDepartmentRepo.create({
        name: 'Centro de Aplicaciones Informáticas y Modelado en Ingeniería',
        facility: facilities.utnFrro,
        abbreviation: 'CAIMI',
        web: 'https://www.frro.utn.edu.ar/contenido.php?cont=487&subc=15',
        referenceOnly: true,
      }),
      utnFrroCidta: this.researchDepartmentRepo.create({
        name: 'Centro de Investigación y Desarrollo en Tecnología de Alimentos',
        facility: facilities.utnFrro,
        abbreviation: 'CIDTA',
        web: 'https://www.frro.utn.edu.ar/contenido.php?cont=98&subc=13',
        referenceOnly: true,
      }),
      utnFrroOes: this.researchDepartmentRepo.create({
        name: 'Observatorio de Energía y Sustentabilidad',
        facility: facilities.utnFrro,
        abbreviation: 'OES',
        web: 'https://www.frro.utn.edu.ar/contenido.php?cont=355&subc=23',
        referenceOnly: true,
      }),
      utnFrroCedite: this.researchDepartmentRepo.create({
        name: 'Centro de Investigación y Desarrollo en Tecnologías Especiales',
        facility: facilities.utnFrro,
        abbreviation: 'CEDITE',
        web: 'https://www.frro.utn.edu.ar/contenido.php?cont=355&subc=23',
        referenceOnly: true,
      }),
      utnFrroGese: this.researchDepartmentRepo.create({
        name: 'Grupo de Estudios Sobre Energía',
        facility: facilities.utnFrro,
        abbreviation: 'GESE',
        web: 'https://www.frro.utn.edu.ar/contenido.php?cont=99&subc=14',
        referenceOnly: true,
      }),
      utnFrroGeneral: this.researchDepartmentRepo.create({
        name: 'General',
        facility: facilities.utnFrro,
        abbreviation: 'General',
      }),
      unrFceiaBasicas: this.researchDepartmentRepo.create({
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
        verified: true,
      }),
      itSecurity: this.interestRepo.create({
        name: 'IT Security',
        verified: true,
      }),
      arduino: this.interestRepo.create({
        name: 'Arduino',
        verified: true,
      }),
      businessIntelligence: this.interestRepo.create({
        name: 'Business Intelligence',
        verified: true,
      }),
      cryptoCurrency: this.interestRepo.create({
        name: 'Crypto Currency',
        verified: true,
      }),
      edTech: this.interestRepo.create({
        name: 'Edtech',
        verified: true,
      }),
      processEngineering: this.interestRepo.create({
        name: 'Ingeniería de procesos y de productos',
        verified: true,
      }),
      environment: this.interestRepo.create({
        name: 'Medio ambiente',
        verified: true,
      }),
      sustainableDevelopment: this.interestRepo.create({
        name: 'Desarrollo sustentable',
        verified: true,
      }),
      foodTech: this.interestRepo.create({
        name: 'Tecnología de los alimentos',
        verified: true,
      }),
      energy: this.interestRepo.create({
        name: 'Energia',
        verified: true,
      }),
      orgTech: this.interestRepo.create({
        name: 'Tecnologías de las organizaciones',
        verified: true,
      }),
      infoSystems: this.interestRepo.create({
        name: 'Sistemas de información e informática',
        verified: true,
      }),
      biotech: this.interestRepo.create({
        name: 'Biotecnología',
        verified: true,
      }),
      contingencies: this.interestRepo.create({
        name: 'Contingencias',
        verified: true,
      }),
    };
  }

  private projectsFactory(
    researchDepartments: ReturnType<typeof this.researchDepartmentsFactory>,
    users: Awaited<ReturnType<typeof this.usersFactory>>,
    interests: ReturnType<typeof this.interestsFactory>,
  ) {
    return {
      utnFrroIsiGeolocationIot: this.projectRepo.create({
        name: 'Desarrollo de un sistema para identificar geoposicionamiento en entorno de Internet de la Cosas (IoT)',
        type: ProjectType.Formal,
        researchDepartment: researchDepartments.utnFrroIsi,
        creationDate: '2020-03-16T17:13:02.000Z',
        interests: [interests.arduino, interests.itSecurity],
        enrollments: [
          this.enrollmentsRepo.create({
            user: users.rizzoJuan,
          }),
          this.enrollmentsRepo.create({
            user: users.villaCarlos,
            role: ProjectRole.Leader,
          }),
        ],
      }),
      utnFrroIsiUniversiteams: this.projectRepo.create({
        name: 'Universiteams',
        type: ProjectType.Informal,
        creationDate: '2021-03-16T17:13:02.000Z',
        researchDepartment: researchDepartments.utnFrroIsi,
        interests: [interests.dataScience, interests.cryptoCurrency],
        enrollments: [
          this.enrollmentsRepo.create({
            user: users.villaCarlos,
            role: ProjectRole.Admin,
          }),
          this.enrollmentsRepo.create({
            user: users.sanchezMarcos,
            role: ProjectRole.Leader,
          }),
        ],
      }),
      utnFrroBasicasTeachingStrategies: this.projectRepo.create({
        name: 'Estrategias Didácticas Diversas y Contextualizadas para la Enseñanza de la Física en Carreras de Ingeniería',
        type: ProjectType.Formal,
        creationDate: '2017-01-01T00:00:00.000Z',
        researchDepartment: researchDepartments.utnFrroBasicas,
        interests: [interests.edTech],
        referenceOnly: true,
        enrollments: [
          this.enrollmentsRepo.create({
            user: users.fanaroJose,
            role: ProjectRole.Leader,
          }),
        ],
      }),
      utnFrroCaimiSustainableProcessStrategies: this.projectRepo.create({
        name: 'Estrategias para el diseño óptimo de procesos sustentables considerando la valorización de subproductos y la incorporación de energías renovables.',
        type: ProjectType.Formal,
        creationDate: '2018-01-01T00:00:00.000Z',
        researchDepartment: researchDepartments.utnFrroCaimi,
        interests: [interests.processEngineering],
        referenceOnly: true,
        enrollments: [
          this.enrollmentsRepo.create({
            user: users.beniaSol,
            role: ProjectRole.Leader,
          }),
        ],
      }),
      utnFrroCaimiGasProcessOptimization: this.projectRepo.create({
        name: 'Modelado Matemático y Optimización de Procesos Convencionales, No Convencionales e Híbridos para la Captura de Gases de Efecto Invernadero.',
        type: ProjectType.Formal,
        creationDate: '2018-01-01T00:00:00.000Z',
        researchDepartment: researchDepartments.utnFrroCaimi,
        interests: [
          interests.environment,
          interests.contingencies,
          interests.sustainableDevelopment,
        ],
        referenceOnly: true,
        enrollments: [
          this.enrollmentsRepo.create({
            user: users.musoSebastian,
            role: ProjectRole.Leader,
          }),
        ],
      }),
      utnFrroCidtaHoneyMaps: this.projectRepo.create({
        name: 'Desarrollo de Mapas de Preferencia para Mieles Monoflorales de la Región Fitogeográfica Pampeana como Estrategia para el Agregado de Valor y la Caracterización',
        type: ProjectType.Formal,
        creationDate: '2018-01-01T00:00:00.000Z',
        researchDepartment: researchDepartments.utnFrroCidta,
        interests: [interests.foodTech],
        referenceOnly: true,
        enrollments: [
          this.enrollmentsRepo.create({
            user: users.chiavoniMarcela,
            role: ProjectRole.Leader,
          }),
        ],
      }),
      utnFrroCidtaBarleyBeer: this.projectRepo.create({
        name: 'Caracterización de Maltas de Cebada',
        type: ProjectType.Formal,
        creationDate: '2018-01-05T00:00:00.000Z',
        researchDepartment: researchDepartments.utnFrroCidta,
        interests: [interests.foodTech],
        referenceOnly: true,
        enrollments: [
          this.enrollmentsRepo.create({
            user: users.martinezRosa,
            role: ProjectRole.Leader,
          }),
        ],
      }),
      utnFrroOesWindDatalogger: this.projectRepo.create({
        name: 'Perfeccionamiento de un Datalogger para Medición de Vientos con fines Energéticos',
        type: ProjectType.Formal,
        creationDate: '2018-01-05T00:00:00.000Z',
        researchDepartment: researchDepartments.utnFrroOes,
        interests: [interests.energy],
        referenceOnly: true,
        enrollments: [
          this.enrollmentsRepo.create({
            user: users.bernalPablo,
            role: ProjectRole.Leader,
          }),
        ],
      }),
      utnFrroCaimiInherentlySafeDesign: this.projectRepo.create({
        name: 'Estrategias de Modelado de Procesos bajo la Filosofía de Diseño Inherentemente Seguro.',
        type: ProjectType.Formal,
        creationDate: '2019-01-01T00:00:00.000Z',
        researchDepartment: researchDepartments.utnFrroCaimi,
        interests: [interests.processEngineering],
        referenceOnly: true,
        enrollments: [
          this.enrollmentsRepo.create({
            user: users.scaniaNicola,
            role: ProjectRole.Leader,
          }),
        ],
      }),
      utnFrroCaimiSustainableBioeconomyProcessDesign: this.projectRepo.create({
        name: 'Estrategias de Diseño de Procesos de Bioingeniería Sustentables. Aplicaciones a Casos de Estudio en el marco de la bioeconomía.',
        type: ProjectType.Formal,
        creationDate: '2018-01-01T00:00:00.000Z',
        researchDepartment: researchDepartments.utnFrroCaimi,
        interests: [interests.processEngineering],
        referenceOnly: true,
        enrollments: [
          this.enrollmentsRepo.create({
            user: users.scaniaNicola,
            role: ProjectRole.Leader,
          }),
        ],
      }),
      utnFrroCediteMultisensorialUniversityRooms: this.projectRepo.create({
        name: 'Diseño Ergonométrico de un Sistema Multisensorial y Multimedial, para Salas Universitarias de Inclusión Académica',
        type: ProjectType.Formal,
        creationDate: '2019-01-01T00:00:00.000Z',
        researchDepartment: researchDepartments.utnFrroCedite,
        interests: [interests.edTech],
        referenceOnly: true,
        enrollments: [
          this.enrollmentsRepo.create({
            user: users.albaJuan,
            role: ProjectRole.Leader,
          }),
        ],
      }),
      utnFrroOesPhotovoltaicPerformanceMeasure: this.projectRepo.create({
        name: 'Medición de Rendimiento de Planta Fotovoltaica. Estudio Comparativo en base a Diversas Herramientas de Cálculo. Desarrollo de Aplicación de Cálculo.',
        type: ProjectType.Formal,
        creationDate: '2019-01-01T00:00:00.000Z',
        researchDepartment: researchDepartments.utnFrroOes,
        interests: [interests.energy],
        referenceOnly: true,
        enrollments: [
          this.enrollmentsRepo.create({
            user: users.bernalPablo,
            role: ProjectRole.Leader,
          }),
        ],
      }),
      utnFrroGesRosarioSulphiteAtmosphere: this.projectRepo.create({
        name: 'Evaluación de la Actividad Total de Sulfatación en la Atmósfera de la Ciudad de Rosario y de la Región Industrial al Norte de la Misma - Estudio Comparativo',
        type: ProjectType.Formal,
        creationDate: '2019-01-01T00:00:00.000Z',
        researchDepartment: researchDepartments.utnFrroGese,
        interests: [
          interests.environment,
          interests.contingencies,
          interests.sustainableDevelopment,
        ],
        referenceOnly: true,
        enrollments: [
          this.enrollmentsRepo.create({
            user: users.federEdgardo,
            role: ProjectRole.Leader,
          }),
        ],
      }),
      utnFrroIsiOpenStateData: this.projectRepo.create({
        name: 'Laboratorios de Innovación Pública, Abierta y Tecnológica para el Desarrollo de Ciudadanía Digital en el Ecosistema de un Estado Abierto',
        type: ProjectType.Formal,
        creationDate: '2019-01-01T00:00:00.000Z',
        researchDepartment: researchDepartments.utnFrroIsi,
        interests: [interests.orgTech],
        referenceOnly: true,
        enrollments: [
          this.enrollmentsRepo.create({
            user: users.marconiRoberta,
            role: ProjectRole.Leader,
          }),
        ],
      }),
    };
  }

  private async usersFactory(
    researchDepartments: ReturnType<typeof this.researchDepartmentsFactory>,
    interests: ReturnType<typeof this.interestsFactory>,
  ) {
    const numGenMockUsers = new NumIncrease(1);
    const numGenMockPasswords = new NumIncrease(1);
    const randomDepartmentId = () => randomInt(10000, 99999).toString();
    return {
      rizzoJuan: this.usersRepo.create({
        mail: `user${numGenMockUsers.next()}@example.com`,
        isMailVerified: true,
        password: await argon2.hash(`password${numGenMockPasswords.next()}`),
        name: 'Juan',
        lastName: 'Rizzo',
        interests: [interests.dataScience, interests.businessIntelligence],
        userAffiliations: [
          this.userAffiliationRepo.create({
            researchDepartment: researchDepartments.utnFrroIc,
            departmentalId: randomDepartmentId(),
          }),
        ],
      }),
      villaCarlos: this.usersRepo.create({
        mail: `user${numGenMockUsers.next()}@example.com`,
        isMailVerified: true,
        password: await argon2.hash(`password${numGenMockPasswords.next()}`),
        name: 'Carlos',
        lastName: 'Villa',
        interests: [interests.itSecurity],
        userAffiliations: [
          this.userAffiliationRepo.create({
            researchDepartment: researchDepartments.utnFrroIsi,
            departmentalId: randomDepartmentId(),
            currentType: UserAffiliationType.Professor,
          }),
          this.userAffiliationRepo.create({
            researchDepartment: researchDepartments.unrFceiaIe,
            departmentalId: randomDepartmentId(),
            currentType: UserAffiliationType.Professor,
          }),
        ],
      }),
      sanchezMarcos: this.usersRepo.create({
        mail: `user${numGenMockUsers.next()}@example.com`,
        isMailVerified: true,
        password: await argon2.hash(`password${numGenMockPasswords.next()}`),
        name: 'Marcos',
        lastName: 'Sanchez',
        userAffiliations: [
          this.userAffiliationRepo.create({
            researchDepartment: researchDepartments.utnFrroIq,
            departmentalId: randomDepartmentId(),
          }),
          this.userAffiliationRepo.create({
            researchDepartment: researchDepartments.unrFceiaIe,
            departmentalId: randomDepartmentId(),
            currentType: UserAffiliationType.Professor,
          }),
        ],
      }),
      fanaroJose: this.usersRepo.create({
        mail: `user${numGenMockUsers.next()}@example.com`,
        isMailVerified: true,
        password: await argon2.hash(`password${numGenMockPasswords.next()}`),
        name: 'Aldo Jose',
        lastName: 'Fanaro',
        interests: [interests.edTech],
        userAffiliations: [
          this.userAffiliationRepo.create({
            researchDepartment: researchDepartments.utnFrroBasicas,
            departmentalId: randomDepartmentId(),
            currentType: UserAffiliationType.Professor,
          }),
        ],
      }),
      beniaSol: this.usersRepo.create({
        mail: `user${numGenMockUsers.next()}@example.com`,
        isMailVerified: true,
        password: await argon2.hash(`password${numGenMockPasswords.next()}`),
        name: 'Julia Sol',
        lastName: 'Benia',
        interests: [interests.processEngineering],
        userAffiliations: [
          this.userAffiliationRepo.create({
            researchDepartment: researchDepartments.utnFrroCaimi,
            departmentalId: randomDepartmentId(),
            currentType: UserAffiliationType.Professor,
          }),
        ],
      }),
      musoSebastian: this.usersRepo.create({
        mail: `user${numGenMockUsers.next()}@example.com`,
        isMailVerified: true,
        password: await argon2.hash(`password${numGenMockPasswords.next()}`),
        name: 'Sebastian Fabricio',
        lastName: 'Muso',
        interests: [interests.environment, interests.sustainableDevelopment],
        userAffiliations: [
          this.userAffiliationRepo.create({
            researchDepartment: researchDepartments.utnFrroCaimi,
            departmentalId: randomDepartmentId(),
            currentType: UserAffiliationType.Professor,
          }),
        ],
      }),
      chiavoniMarcela: this.usersRepo.create({
        mail: `user${numGenMockUsers.next()}@example.com`,
        isMailVerified: true,
        password: await argon2.hash(`password${numGenMockPasswords.next()}`),
        name: 'Marcela Camila',
        lastName: 'Chiavoni',
        interests: [interests.foodTech],
        userAffiliations: [
          this.userAffiliationRepo.create({
            researchDepartment: researchDepartments.utnFrroCidta,
            departmentalId: randomDepartmentId(),
            currentType: UserAffiliationType.Professor,
          }),
        ],
      }),
      martinezRosa: this.usersRepo.create({
        mail: `user${numGenMockUsers.next()}@example.com`,
        isMailVerified: true,
        password: await argon2.hash(`password${numGenMockPasswords.next()}`),
        name: 'Rosa',
        lastName: 'Martinez',
        interests: [interests.foodTech],
        userAffiliations: [
          this.userAffiliationRepo.create({
            researchDepartment: researchDepartments.utnFrroCidta,
            departmentalId: randomDepartmentId(),
            currentType: UserAffiliationType.Professor,
          }),
        ],
      }),
      bernalPablo: this.usersRepo.create({
        mail: `user${numGenMockUsers.next()}@example.com`,
        isMailVerified: true,
        password: await argon2.hash(`password${numGenMockPasswords.next()}`),
        name: 'Pablo',
        lastName: 'Bernal',
        interests: [interests.energy],
        userAffiliations: [
          this.userAffiliationRepo.create({
            researchDepartment: researchDepartments.utnFrroOes,
            departmentalId: randomDepartmentId(),
            currentType: UserAffiliationType.Professor,
          }),
        ],
      }),
      scaniaNicola: this.usersRepo.create({
        mail: `user${numGenMockUsers.next()}@example.com`,
        isMailVerified: true,
        password: await argon2.hash(`password${numGenMockPasswords.next()}`),
        name: 'Nicola',
        lastName: 'Scania',
        interests: [interests.processEngineering],
        userAffiliations: [
          this.userAffiliationRepo.create({
            researchDepartment: researchDepartments.utnFrroCaimi,
            departmentalId: randomDepartmentId(),
            currentType: UserAffiliationType.Professor,
          }),
        ],
      }),
      albaJuan: this.usersRepo.create({
        mail: `user${numGenMockUsers.next()}@example.com`,
        isMailVerified: true,
        password: await argon2.hash(`password${numGenMockPasswords.next()}`),
        name: 'Juan Luis',
        lastName: 'Alba',
        interests: [interests.edTech],
        userAffiliations: [
          this.userAffiliationRepo.create({
            researchDepartment: researchDepartments.utnFrroCedite,
            departmentalId: randomDepartmentId(),
            currentType: UserAffiliationType.Professor,
          }),
        ],
      }),
      federEdgardo: this.usersRepo.create({
        mail: `user${numGenMockUsers.next()}@example.com`,
        isMailVerified: true,
        password: await argon2.hash(`password${numGenMockPasswords.next()}`),
        name: 'Edgardo Joaquin',
        lastName: 'Feder',
        interests: [
          interests.environment,
          interests.contingencies,
          interests.sustainableDevelopment,
        ],
        userAffiliations: [
          this.userAffiliationRepo.create({
            researchDepartment: researchDepartments.utnFrroGese,
            departmentalId: randomDepartmentId(),
            currentType: UserAffiliationType.Professor,
          }),
        ],
      }),
      marconiRoberta: this.usersRepo.create({
        mail: `user${numGenMockUsers.next()}@example.com`,
        isMailVerified: true,
        password: await argon2.hash(`password${numGenMockPasswords.next()}`),
        name: 'Roberta Roma',
        lastName: 'Marconi',
        interests: [interests.edTech],
        userAffiliations: [
          this.userAffiliationRepo.create({
            researchDepartment: researchDepartments.utnFrroIsi,
            departmentalId: randomDepartmentId(),
            currentType: UserAffiliationType.Professor,
          }),
        ],
      }),
    };
  }
}
