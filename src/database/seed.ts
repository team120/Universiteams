import * as argon2 from 'argon2';
import { Enrollment, ProjectRole, RequestState } from '../enrollment/enrolment.entity';
import { Facility } from '../facility/facility.entity';
import { Institution } from '../institution/institution.entity';
import { Interest } from '../interest/interest.entity';
import { Project, ProjectType } from '../project/project.entity';
import { ResearchDepartment } from '../research-department/department.entity';
import {
  UserAffiliation,
  UserAffiliationType,
} from '../user-affiliation/user-affiliation.entity';
import { User } from '../user/user.entity';
import { randomInt } from 'crypto';
import { DataSource, Repository } from 'typeorm';

class NumUnitaryIncrease {
  constructor(private num: number) {}

  next() {
    return this.num++;
  }
}

export class Seed {
  private readonly enrollmentsRepo: Repository<Enrollment>;
  private readonly institutionRepo: Repository<Institution>;
  private readonly interestRepo: Repository<Interest>;
  private readonly projectRepo: Repository<Project>;
  private readonly researchDepartmentRepo: Repository<ResearchDepartment>;
  private readonly usersRepo: Repository<User>;
  private readonly userAffiliationRepo: Repository<UserAffiliation>;
  private readonly facilityRepo: Repository<Facility>;

  constructor(private dataSource: DataSource) {
    this.enrollmentsRepo = this.dataSource.getRepository(Enrollment);
    this.institutionRepo = this.dataSource.getRepository(Institution);
    this.interestRepo = this.dataSource.getRepository(Interest);
    this.projectRepo = this.dataSource.getRepository(Project);
    this.researchDepartmentRepo =
      this.dataSource.getRepository(ResearchDepartment);
    this.usersRepo = this.dataSource.getRepository(User);
    this.userAffiliationRepo = this.dataSource.getRepository(UserAffiliation);
    this.facilityRepo = this.dataSource.getRepository(Facility);
  }

  async seedDbData() {
    await this.dataSource.synchronize();

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
    await this.projectRepo.query(`
      TRUNCATE project RESTART IDENTITY CASCADE;
      TRUNCATE "user" RESTART IDENTITY CASCADE;
      TRUNCATE interest RESTART IDENTITY CASCADE;
      TRUNCATE institution RESTART IDENTITY CASCADE;
    `);
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
        SELECT i.id, count(pi."interestId") as "count"
        FROM public.interest i
        LEFT JOIN project_interest pi
          ON id = pi."interestId"
        GROUP BY i.id
        ) as projects_interest_count
      WHERE interest.id = projects_interest_count.id;

      UPDATE interest
      SET "userRefsCounter" = users_interest_count."count"
      FROM (
        SELECT i.id, count(ui."interestId") as "count"
        FROM public.interest i
        LEFT JOIN user_interest ui
          ON i.id = ui."interestId"
        GROUP BY i.id
        ) as users_interest_count
      WHERE interest.id = users_interest_count.id;
    `);
  }

  private institutionsFactory() {
    const idGen = new NumUnitaryIncrease(1);
    return {
      utn: this.institutionRepo.create({
        id: idGen.next(),
        name: 'Universidad Tecnológica Nacional',
        abbreviation: 'UTN',
      }),
      unr: this.institutionRepo.create({
        id: idGen.next(),
        name: 'Universidad Nacional de Rosario',
        abbreviation: 'UNR',
      }),
    };
  }

  private facilitiesFactory(
    institutions: ReturnType<typeof this.institutionsFactory>,
  ) {
    const idGen = new NumUnitaryIncrease(1);
    return {
      utnFrro: this.facilityRepo.create({
        id: idGen.next(),
        name: 'Regional Rosario',
        abbreviation: 'FRRo',
        institution: institutions.utn,
      }),
      unrFceia: this.facilityRepo.create({
        id: idGen.next(),
        name: 'Facultad de Ciencias Exactas, Ingeniería y Agrimensura',
        abbreviation: 'FCEIA',
        institution: institutions.unr,
      }),
    };
  }

  private researchDepartmentsFactory(
    facilities: ReturnType<typeof this.facilitiesFactory>,
  ) {
    const idGen = new NumUnitaryIncrease(1);
    return {
      utnFrroBasicas: this.researchDepartmentRepo.create({
        id: idGen.next(),
        name: 'Ciencias Básicas',
        facility: facilities.utnFrro,
        abbreviation: 'CB',
      }),
      utnFrroIsi: this.researchDepartmentRepo.create({
        id: idGen.next(),
        name: 'Ingeniería en Sistemas',
        facility: facilities.utnFrro,
        abbreviation: 'ISI',
      }),
      utnFrroIc: this.researchDepartmentRepo.create({
        id: idGen.next(),
        name: 'Ingeniería Civil',
        facility: facilities.utnFrro,
        abbreviation: 'IC',
      }),
      utnFrroIq: this.researchDepartmentRepo.create({
        id: idGen.next(),
        name: 'Ingeniería Química',
        facility: facilities.utnFrro,
        abbreviation: 'IQ',
      }),
      utnFrroElectrica: this.researchDepartmentRepo.create({
        id: idGen.next(),
        name: 'Ingeniería Electrica',
        facility: facilities.utnFrro,
        abbreviation: 'IE',
      }),
      utnFrroIm: this.researchDepartmentRepo.create({
        id: idGen.next(),
        name: 'Ingeniería Mecánica',
        facility: facilities.utnFrro,
        abbreviation: 'IM',
      }),
      utnFrroCaimi: this.researchDepartmentRepo.create({
        id: idGen.next(),
        name: 'Centro de Aplicaciones Informáticas y Modelado en Ingeniería',
        facility: facilities.utnFrro,
        abbreviation: 'CAIMI',
        web: 'https://www.frro.utn.edu.ar/contenido.php?cont=487&subc=15',
        referenceOnly: true,
      }),
      utnFrroCidta: this.researchDepartmentRepo.create({
        id: idGen.next(),
        name: 'Centro de Investigación y Desarrollo en Tecnología de Alimentos',
        facility: facilities.utnFrro,
        abbreviation: 'CIDTA',
        web: 'https://www.frro.utn.edu.ar/contenido.php?cont=98&subc=13',
        referenceOnly: true,
      }),
      utnFrroOes: this.researchDepartmentRepo.create({
        id: idGen.next(),
        name: 'Observatorio de Energía y Sustentabilidad',
        facility: facilities.utnFrro,
        abbreviation: 'OES',
        web: 'https://www.frro.utn.edu.ar/contenido.php?cont=355&subc=23',
        referenceOnly: true,
      }),
      utnFrroCedite: this.researchDepartmentRepo.create({
        id: idGen.next(),
        name: 'Centro de Investigación y Desarrollo en Tecnologías Especiales',
        facility: facilities.utnFrro,
        abbreviation: 'CEDITE',
        web: 'https://www.frro.utn.edu.ar/contenido.php?cont=355&subc=23',
        referenceOnly: true,
      }),
      utnFrroGese: this.researchDepartmentRepo.create({
        id: idGen.next(),
        name: 'Grupo de Estudios Sobre Energía',
        facility: facilities.utnFrro,
        abbreviation: 'GESE',
        web: 'https://www.frro.utn.edu.ar/contenido.php?cont=99&subc=14',
        referenceOnly: true,
      }),
      utnFrroGeneral: this.researchDepartmentRepo.create({
        id: idGen.next(),
        name: 'General',
        facility: facilities.utnFrro,
        abbreviation: 'General',
      }),
      unrFceiaBasicas: this.researchDepartmentRepo.create({
        id: idGen.next(),
        name: 'Ciencias Básicas',
        facility: facilities.unrFceia,
        abbreviation: 'CB',
      }),
      unrFceiaElectrica: this.researchDepartmentRepo.create({
        id: idGen.next(),
        name: 'Ingeniería Electrica',
        facility: facilities.unrFceia,
        abbreviation: 'IE',
      }),
      unrFceiaIe: this.researchDepartmentRepo.create({
        id: idGen.next(),
        name: 'Ingeniería Electrónica',
        facility: facilities.unrFceia,
        abbreviation: 'IE',
      }),
      unrFceiaIm: this.researchDepartmentRepo.create({
        id: idGen.next(),
        name: 'Ingeniería Mecánica',
        facility: facilities.unrFceia,
        abbreviation: 'IM',
      }),
      unrFceiaGeneral: this.researchDepartmentRepo.create({
        id: idGen.next(),
        name: 'General',
        facility: facilities.unrFceia,
        abbreviation: 'General',
      }),
    };
  }

  private interestsFactory() {
    const idGen = new NumUnitaryIncrease(1);
    return {
      backendDev: this.interestRepo.create({
        id: idGen.next(),
        name: 'Backend Development',
        verified: true,
      }),
      frontendDev: this.interestRepo.create({
        id: idGen.next(),
        name: 'Frontend Development',
        verified: true,
      }),
      mobileDev: this.interestRepo.create({
        id: idGen.next(),
        name: 'Mobile Development',
        verified: true,
      }),
      dataScience: this.interestRepo.create({
        id: idGen.next(),
        name: 'Data Science',
        verified: true,
      }),
      itSecurity: this.interestRepo.create({
        id: idGen.next(),
        name: 'IT Security',
        verified: true,
      }),
      arduino: this.interestRepo.create({
        id: idGen.next(),
        name: 'Arduino',
        verified: true,
      }),
      businessIntelligence: this.interestRepo.create({
        id: idGen.next(),
        name: 'Business Intelligence',
        verified: true,
      }),
      cryptoCurrency: this.interestRepo.create({
        id: idGen.next(),
        name: 'Crypto Currency',
        verified: true,
      }),
      edTech: this.interestRepo.create({
        id: idGen.next(),
        name: 'Edtech',
        verified: true,
      }),
      processEngineering: this.interestRepo.create({
        id: idGen.next(),
        name: 'Ingeniería de procesos y de productos',
        verified: true,
      }),
      environment: this.interestRepo.create({
        id: idGen.next(),
        name: 'Medio ambiente',
        verified: true,
      }),
      sustainableDevelopment: this.interestRepo.create({
        id: idGen.next(),
        name: 'Desarrollo sustentable',
        verified: true,
      }),
      foodTech: this.interestRepo.create({
        id: idGen.next(),
        name: 'Tecnología de los alimentos',
        verified: true,
      }),
      energy: this.interestRepo.create({
        id: idGen.next(),
        name: 'Energía',
        verified: true,
      }),
      orgTech: this.interestRepo.create({
        id: idGen.next(),
        name: 'Tecnologías de las organizaciones',
        verified: true,
      }),
      infoSystems: this.interestRepo.create({
        id: idGen.next(),
        name: 'Sistemas de información e informática',
        verified: true,
      }),
      biotech: this.interestRepo.create({
        id: idGen.next(),
        name: 'Biotecnología',
        verified: true,
      }),
      contingencies: this.interestRepo.create({
        id: idGen.next(),
        name: 'Contingencias',
        verified: true,
      }),
      optimization: this.interestRepo.create({
        id: idGen.next(),
        name: 'Optimización (matemática)',
        verified: true,
      }),
    };
  }

  private projectsFactory(
    researchDepartments: ReturnType<typeof this.researchDepartmentsFactory>,
    users: Awaited<ReturnType<typeof this.usersFactory>>,
    interests: ReturnType<typeof this.interestsFactory>,
  ) {
    const projectIdGen = new NumUnitaryIncrease(1);
    const enrollmentIdGen = new NumUnitaryIncrease(1);
    return {
      utnFrroIsiGeolocationIot: this.projectRepo.create({
        id: projectIdGen.next(),
        name: 'Desarrollo de un sistema para identificar geoposicionamiento en entorno de Internet de la Cosas (IoT)',
        type: ProjectType.Formal,
        researchDepartments: [researchDepartments.utnFrroIsi],
        creationDate: '2020-03-16',
        interests: [interests.arduino, interests.itSecurity],
        enrollments: [
          this.enrollmentsRepo.create({
            id: enrollmentIdGen.next(),
            user: users.rizzoJuan,
            requestState: RequestState.Accepted,
          }),
          this.enrollmentsRepo.create({
            id: enrollmentIdGen.next(),
            user: users.villaCamila,
            requestState: RequestState.Accepted,
            role: ProjectRole.Leader,
          }),
        ],
      }),
      utnFrroIsiUniversiteams: this.projectRepo.create({
        id: projectIdGen.next(),
        name: 'Universiteams',
        type: ProjectType.Informal,
        creationDate: '2021-03-16',
        researchDepartments: [researchDepartments.utnFrroIsi],
        interests: [interests.dataScience, interests.edTech],
        enrollments: [
          this.enrollmentsRepo.create({
            id: enrollmentIdGen.next(),
            user: users.villaCamila,
            requestState: RequestState.Accepted,
            role: ProjectRole.Admin,
          }),
          this.enrollmentsRepo.create({
            id: enrollmentIdGen.next(),
            user: users.sanchezMarcos,
            requestState: RequestState.Accepted,
            role: ProjectRole.Leader,
          }),
          this.enrollmentsRepo.create({
            id: enrollmentIdGen.next(),
            user: users.dellepianeJuan,
            requestState: RequestState.Accepted,
          }),
          this.enrollmentsRepo.create({
            id: enrollmentIdGen.next(),
            user: users.albaJuan,
            requestState: RequestState.Accepted,
          }),
        ],
      }),
      utnFrroBasicasTeachingStrategies: this.projectRepo.create({
        id: projectIdGen.next(),
        name: 'Estrategias Didácticas Diversas y Contextualizadas para la Enseñanza de la Física en Carreras de Ingeniería',
        type: ProjectType.Formal,
        creationDate: '2017-01-01',
        researchDepartments: [researchDepartments.utnFrroBasicas],
        interests: [interests.edTech],
        referenceOnly: true,
        enrollments: [
          this.enrollmentsRepo.create({
            id: enrollmentIdGen.next(),
            user: users.fanaroJose,
            requestState: RequestState.Accepted,
            role: ProjectRole.Leader,
          }),
        ],
      }),
      utnFrroCaimiSustainableProcessStrategies: this.projectRepo.create({
        id: projectIdGen.next(),
        name: 'Estrategias para el diseño óptimo de procesos sustentables considerando la valorización de subproductos y la incorporación de energías renovables',
        type: ProjectType.Formal,
        creationDate: '2018-01-01',
        endDate: '2021-12-31',
        researchDepartments: [researchDepartments.utnFrroCaimi],
        interests: [interests.processEngineering],
        referenceOnly: true,
        enrollments: [
          this.enrollmentsRepo.create({
            id: enrollmentIdGen.next(),
            user: users.beniaSol,
            requestState: RequestState.Accepted,
            role: ProjectRole.Leader,
          }),
        ],
      }),
      utnFrroCaimiGasProcessOptimization: this.projectRepo.create({
        id: projectIdGen.next(),
        name: 'Modelado Matemático y Optimización de Procesos Convencionales, No Convencionales e Híbridos para la Captura de Gases de Efecto Invernadero.',
        type: ProjectType.Formal,
        creationDate: '2018-01-01',
        endDate: '2022-07-01',
        researchDepartments: [researchDepartments.utnFrroCaimi],
        interests: [
          interests.environment,
          interests.contingencies,
          interests.sustainableDevelopment,
          interests.optimization,
        ],
        referenceOnly: true,
        enrollments: [
          this.enrollmentsRepo.create({
            id: enrollmentIdGen.next(),
            user: users.musoSebastian,
            requestState: RequestState.Accepted,
            role: ProjectRole.Leader,
          }),
          this.enrollmentsRepo.create({
            id: enrollmentIdGen.next(),
            user: users.obregonMario,
            requestState: RequestState.Accepted,
          }),
          this.enrollmentsRepo.create({
            id: enrollmentIdGen.next(),
            user: users.lizcovichHernan,
            requestState: RequestState.Accepted,
          }),
        ],
      }),
      utnFrroCidtaHoneyMaps: this.projectRepo.create({
        id: projectIdGen.next(),
        name: 'Desarrollo de Mapas de Preferencia para Mieles Monoflorales de la Región Fitogeográfica Pampeana como Estrategia para el Agregado de Valor y la Caracterización',
        type: ProjectType.Informal,
        creationDate: '2018-01-01',
        endDate: '2022-07-01',
        researchDepartments: [
          researchDepartments.utnFrroIq,
          researchDepartments.utnFrroIsi,
        ],
        interests: [interests.foodTech],
        referenceOnly: true,
        enrollments: [
          this.enrollmentsRepo.create({
            id: enrollmentIdGen.next(),
            user: users.chiavoniMarcela,
            requestState: RequestState.Accepted,
            role: ProjectRole.Leader,
          }),
          this.enrollmentsRepo.create({
            id: enrollmentIdGen.next(),
            user: users.albaJuan,
            requestState: RequestState.Accepted,
          }),
          this.enrollmentsRepo.create({
            id: enrollmentIdGen.next(),
            user: users.dellepianeJuan,
            requestState: RequestState.Accepted,
          }),
        ],
      }),
      utnFrroCidtaBarleyBeer: this.projectRepo.create({
        id: projectIdGen.next(),
        name: 'Caracterización de Maltas de Cebada',
        type: ProjectType.Formal,
        creationDate: '2018-01-05',
        researchDepartments: [researchDepartments.utnFrroCidta],
        interests: [interests.foodTech],
        referenceOnly: true,
        enrollments: [
          this.enrollmentsRepo.create({
            id: enrollmentIdGen.next(),
            user: users.martinezRosa,
            requestState: RequestState.Accepted,
            role: ProjectRole.Leader,
          }),
        ],
      }),
      utnFrroOesWindDatalogger: this.projectRepo.create({
        id: projectIdGen.next(),
        name: 'Perfeccionamiento de un Datalogger para Medición de Vientos con fines Energéticos',
        type: ProjectType.Informal,
        creationDate: '2020-01-05',
        endDate: '2022-12-31',
        researchDepartments: [
          researchDepartments.utnFrroIc,
          researchDepartments.utnFrroIsi,
        ],
        interests: [interests.energy],
        referenceOnly: true,
        enrollments: [
          this.enrollmentsRepo.create({
            id: enrollmentIdGen.next(),
            user: users.bernalPablo,
            requestState: RequestState.Accepted,
            role: ProjectRole.Leader,
          }),
          this.enrollmentsRepo.create({
            id: enrollmentIdGen.next(),
            user: users.albaJuan,
            requestState: RequestState.Accepted,
          }),
          this.enrollmentsRepo.create({
            id: enrollmentIdGen.next(),
            user: users.rizzoJuan,
            requestState: RequestState.Accepted,
          }),
        ],
      }),
      utnFrroCaimiInherentlySafeDesign: this.projectRepo.create({
        id: projectIdGen.next(),
        name: 'Estrategias de Modelado de Procesos bajo la Filosofía de Diseño Inherentemente Seguro',
        type: ProjectType.Formal,
        creationDate: '2019-01-01',
        endDate: '2022-07-01',
        researchDepartments: [researchDepartments.utnFrroCaimi],
        interests: [interests.processEngineering],
        referenceOnly: true,
        enrollments: [
          this.enrollmentsRepo.create({
            id: enrollmentIdGen.next(),
            user: users.scaniaNicola,
            requestState: RequestState.Accepted,
            role: ProjectRole.Leader,
          }),
        ],
      }),
      utnFrroCaimiSustainableBioeconomyProcessDesign: this.projectRepo.create({
        id: projectIdGen.next(),
        name: 'Estrategias de Diseño de Procesos de Bioingeniería Sustentables. Aplicaciones a Casos de Estudio en el marco de la bioeconomía',
        type: ProjectType.Formal,
        creationDate: '2018-01-01',
        researchDepartments: [researchDepartments.utnFrroCaimi],
        interests: [interests.processEngineering, interests.biotech],
        referenceOnly: true,
        enrollments: [
          this.enrollmentsRepo.create({
            id: enrollmentIdGen.next(),
            user: users.scaniaNicola,
            requestState: RequestState.Accepted,
            role: ProjectRole.Leader,
          }),
          this.enrollmentsRepo.create({
            id: enrollmentIdGen.next(),
            user: users.lizcovichHernan,
            requestState: RequestState.Accepted,
          }),
        ],
      }),
      utnFrroCediteMultisensorialUniversityRooms: this.projectRepo.create({
        id: projectIdGen.next(),
        name: 'Diseño Ergonométrico de un Sistema Multisensorial y Multimedial, para Salas Universitarias de Inclusión Académica',
        type: ProjectType.Formal,
        creationDate: '2019-01-01',
        endDate: '2020-12-31',
        researchDepartments: [researchDepartments.utnFrroCedite],
        interests: [interests.edTech],
        referenceOnly: true,
        enrollments: [
          this.enrollmentsRepo.create({
            id: enrollmentIdGen.next(),
            user: users.albaJuan,
            requestState: RequestState.Accepted,
            role: ProjectRole.Leader,
          }),
          this.enrollmentsRepo.create({
            id: enrollmentIdGen.next(),
            user: users.rizzoJuan,
            requestState: RequestState.Accepted,
            role: ProjectRole.Admin,
          }),
        ],
      }),
      utnFrroOesPhotovoltaicPerformanceMeasure: this.projectRepo.create({
        id: projectIdGen.next(),
        name: 'Medición de Rendimiento de Planta Fotovoltaica. Desarrollo de Aplicación de Cálculo',
        type: ProjectType.Informal,
        creationDate: '2019-01-01',
        endDate: '2023-01-01',
        researchDepartments: [researchDepartments.unrFceiaElectrica],
        interests: [interests.energy],
        referenceOnly: true,
        enrollments: [
          this.enrollmentsRepo.create({
            id: enrollmentIdGen.next(),
            user: users.bernalPablo,
            requestState: RequestState.Accepted,
            role: ProjectRole.Leader,
          }),
          this.enrollmentsRepo.create({
            id: enrollmentIdGen.next(),
            user: users.inmhofCamila,
            requestState: RequestState.Accepted,
          }),
          this.enrollmentsRepo.create({
            id: enrollmentIdGen.next(),
            user: users.alcazarPablo,
            requestState: RequestState.Accepted,
          }),
        ],
      }),
      utnFrroGesRosarioSulphiteAtmosphere: this.projectRepo.create({
        id: projectIdGen.next(),
        name: 'Evaluación de la Actividad Total de Sulfatación en la Atmósfera de la Ciudad de Rosario y de la Región Industrial al Norte de la Misma',
        type: ProjectType.Informal,
        creationDate: '2019-01-01',
        endDate: '2020-12-31',
        researchDepartments: [researchDepartments.utnFrroIq],
        interests: [
          interests.environment,
          interests.contingencies,
          interests.sustainableDevelopment,
        ],
        referenceOnly: true,
        enrollments: [
          this.enrollmentsRepo.create({
            id: enrollmentIdGen.next(),
            user: users.federEdgardo,
            requestState: RequestState.Accepted,
            role: ProjectRole.Leader,
          }),
          this.enrollmentsRepo.create({
            id: enrollmentIdGen.next(),
            user: users.troiloAlessandro,
            requestState: RequestState.Accepted,
          }),
        ],
      }),
      utnFrroIsiConceptualDataScience: this.projectRepo.create({
        id: projectIdGen.next(),
        name: 'Estudio de las Estructuras Conceptuales de la Ciencia de datos',
        type: ProjectType.Informal,
        creationDate: '2019-01-01',
        researchDepartments: [
          researchDepartments.utnFrroIsi,
          researchDepartments.utnFrroBasicas,
        ],
        interests: [interests.infoSystems],
        referenceOnly: true,
        enrollments: [
          this.enrollmentsRepo.create({
            id: enrollmentIdGen.next(),
            user: users.denarisSilvia,
            requestState: RequestState.Accepted,
            role: ProjectRole.Leader,
          }),
          this.enrollmentsRepo.create({
            id: enrollmentIdGen.next(),
            user: users.sanchezMarcos,
            requestState: RequestState.Accepted,
            role: ProjectRole.Admin,
          }),
          this.enrollmentsRepo.create({
            id: enrollmentIdGen.next(),
            user: users.dellepianeJuan,
            requestState: RequestState.Accepted,
          }),
          this.enrollmentsRepo.create({
            id: enrollmentIdGen.next(),
            user: users.troiloAlessandro,
            requestState: RequestState.Accepted,
          }),
        ],
      }),
    };
  }

  private async usersFactory(
    researchDepartments: ReturnType<typeof this.researchDepartmentsFactory>,
    interests: ReturnType<typeof this.interestsFactory>,
  ) {
    const userIdGen = new NumUnitaryIncrease(1);
    const affiliationIdGen = new NumUnitaryIncrease(1);
    const numGenMockUsers = new NumUnitaryIncrease(1);
    const numGenMockPasswords = new NumUnitaryIncrease(1);
    const randomDepartmentId = () => randomInt(10000, 99999).toString();
    return {
      rizzoJuan: this.usersRepo.create({
        id: userIdGen.next(),
        email: `user${numGenMockUsers.next()}@example.com`,
        password: await argon2.hash(`Password_${numGenMockPasswords.next()}`),
        firstName: 'Juan',
        lastName: 'Rizzo',
        isEmailVerified: true,
        interests: [interests.dataScience, interests.businessIntelligence],
        userAffiliations: [
          this.userAffiliationRepo.create({
            id: affiliationIdGen.next(),
            researchDepartment: researchDepartments.utnFrroIc,
            departmentalId: randomDepartmentId(),
          }),
        ],
      }),
      villaCamila: this.usersRepo.create({
        id: userIdGen.next(),
        email: `user${numGenMockUsers.next()}@example.com`,
        password: await argon2.hash(`Password_${numGenMockPasswords.next()}`),
        firstName: 'Camila',
        lastName: 'Villa',
        isEmailVerified: true,
        interests: [
          interests.backendDev,
          interests.itSecurity,
          interests.optimization,
          interests.environment,
        ],
        userAffiliations: [
          this.userAffiliationRepo.create({
            id: affiliationIdGen.next(),
            researchDepartment: researchDepartments.utnFrroIsi,
            departmentalId: randomDepartmentId(),
            currentType: UserAffiliationType.Professor,
          }),
          this.userAffiliationRepo.create({
            id: affiliationIdGen.next(),
            researchDepartment: researchDepartments.unrFceiaIe,
            departmentalId: randomDepartmentId(),
            currentType: UserAffiliationType.Professor,
          }),
        ],
      }),
      sanchezMarcos: this.usersRepo.create({
        id: userIdGen.next(),
        email: `user${numGenMockUsers.next()}@example.com`,
        password: await argon2.hash(`Password_${numGenMockPasswords.next()}`),
        firstName: 'Marcos',
        lastName: 'Sanchez',
        userAffiliations: [
          this.userAffiliationRepo.create({
            id: affiliationIdGen.next(),
            researchDepartment: researchDepartments.utnFrroIq,
            departmentalId: randomDepartmentId(),
          }),
          this.userAffiliationRepo.create({
            id: affiliationIdGen.next(),
            researchDepartment: researchDepartments.unrFceiaIe,
            departmentalId: randomDepartmentId(),
            currentType: UserAffiliationType.Professor,
          }),
        ],
      }),
      fanaroJose: this.usersRepo.create({
        id: userIdGen.next(),
        email: `user${numGenMockUsers.next()}@example.com`,
        password: await argon2.hash(`Password_${numGenMockPasswords.next()}`),
        firstName: 'Aldo Jose',
        lastName: 'Fanaro',
        isEmailVerified: true,
        interests: [interests.edTech],
        userAffiliations: [
          this.userAffiliationRepo.create({
            id: affiliationIdGen.next(),
            researchDepartment: researchDepartments.utnFrroBasicas,
            departmentalId: randomDepartmentId(),
            currentType: UserAffiliationType.Professor,
          }),
        ],
      }),
      beniaSol: this.usersRepo.create({
        id: userIdGen.next(),
        email: `user${numGenMockUsers.next()}@example.com`,
        password: await argon2.hash(`Password_${numGenMockPasswords.next()}`),
        firstName: 'Julia Sol',
        lastName: 'Benia',
        isEmailVerified: true,
        interests: [interests.processEngineering],
        userAffiliations: [
          this.userAffiliationRepo.create({
            id: affiliationIdGen.next(),
            researchDepartment: researchDepartments.utnFrroCaimi,
            departmentalId: randomDepartmentId(),
            currentType: UserAffiliationType.Researcher,
          }),
        ],
      }),
      musoSebastian: this.usersRepo.create({
        id: userIdGen.next(),
        email: `user${numGenMockUsers.next()}@example.com`,
        password: await argon2.hash(`Password_${numGenMockPasswords.next()}`),
        firstName: 'Sebastian Fabricio',
        lastName: 'Muso',
        isEmailVerified: true,
        interests: [interests.environment, interests.sustainableDevelopment],
        userAffiliations: [
          this.userAffiliationRepo.create({
            id: affiliationIdGen.next(),
            researchDepartment: researchDepartments.utnFrroCaimi,
            departmentalId: randomDepartmentId(),
            currentType: UserAffiliationType.Researcher,
          }),
          this.userAffiliationRepo.create({
            id: affiliationIdGen.next(),
            researchDepartment: researchDepartments.unrFceiaIe,
            departmentalId: randomDepartmentId(),
            currentType: UserAffiliationType.Professor,
          }),
        ],
      }),
      chiavoniMarcela: this.usersRepo.create({
        id: userIdGen.next(),
        email: `user${numGenMockUsers.next()}@example.com`,
        password: await argon2.hash(`Password_${numGenMockPasswords.next()}`),
        firstName: 'Marcela Camila',
        lastName: 'Chiavoni',
        isEmailVerified: true,
        interests: [interests.foodTech],
        userAffiliations: [
          this.userAffiliationRepo.create({
            id: affiliationIdGen.next(),
            researchDepartment: researchDepartments.utnFrroCidta,
            departmentalId: randomDepartmentId(),
            currentType: UserAffiliationType.Researcher,
          }),
          this.userAffiliationRepo.create({
            id: affiliationIdGen.next(),
            researchDepartment: researchDepartments.utnFrroIq,
            departmentalId: randomDepartmentId(),
            currentType: UserAffiliationType.Professor,
          }),
        ],
      }),
      martinezRosa: this.usersRepo.create({
        id: userIdGen.next(),
        email: `user${numGenMockUsers.next()}@example.com`,
        password: await argon2.hash(`Password_${numGenMockPasswords.next()}`),
        firstName: 'Rosa',
        lastName: 'Martinez',
        isEmailVerified: true,
        interests: [interests.foodTech],
        userAffiliations: [
          this.userAffiliationRepo.create({
            id: affiliationIdGen.next(),
            researchDepartment: researchDepartments.utnFrroCidta,
            departmentalId: randomDepartmentId(),
            currentType: UserAffiliationType.Researcher,
          }),
          this.userAffiliationRepo.create({
            id: affiliationIdGen.next(),
            researchDepartment: researchDepartments.utnFrroIq,
            departmentalId: randomDepartmentId(),
            currentType: UserAffiliationType.Professor,
          }),
        ],
      }),
      bernalPablo: this.usersRepo.create({
        id: userIdGen.next(),
        email: `user${numGenMockUsers.next()}@example.com`,
        password: await argon2.hash(`Password_${numGenMockPasswords.next()}`),
        firstName: 'Pablo',
        lastName: 'Bernal',
        isEmailVerified: true,
        interests: [interests.energy, interests.environment],
        userAffiliations: [
          this.userAffiliationRepo.create({
            id: affiliationIdGen.next(),
            researchDepartment: researchDepartments.utnFrroOes,
            departmentalId: randomDepartmentId(),
            currentType: UserAffiliationType.Researcher,
          }),
          this.userAffiliationRepo.create({
            id: affiliationIdGen.next(),
            researchDepartment: researchDepartments.unrFceiaElectrica,
            departmentalId: randomDepartmentId(),
            currentType: UserAffiliationType.Professor,
          }),
        ],
      }),
      scaniaNicola: this.usersRepo.create({
        id: userIdGen.next(),
        email: `user${numGenMockUsers.next()}@example.com`,
        password: await argon2.hash(`Password_${numGenMockPasswords.next()}`),
        firstName: 'Nicola',
        lastName: 'Scania',
        isEmailVerified: true,
        interests: [interests.processEngineering],
        userAffiliations: [
          this.userAffiliationRepo.create({
            id: affiliationIdGen.next(),
            researchDepartment: researchDepartments.utnFrroCaimi,
            departmentalId: randomDepartmentId(),
            currentType: UserAffiliationType.Researcher,
          }),
        ],
      }),
      albaJuan: this.usersRepo.create({
        id: userIdGen.next(),
        email: `user${numGenMockUsers.next()}@example.com`,
        password: await argon2.hash(`Password_${numGenMockPasswords.next()}`),
        firstName: 'Juan Luis',
        lastName: 'Alba',
        isEmailVerified: true,
        interests: [interests.edTech],
        userAffiliations: [
          this.userAffiliationRepo.create({
            id: affiliationIdGen.next(),
            researchDepartment: researchDepartments.utnFrroCedite,
            departmentalId: randomDepartmentId(),
            currentType: UserAffiliationType.Researcher,
          }),
          this.userAffiliationRepo.create({
            id: affiliationIdGen.next(),
            researchDepartment: researchDepartments.utnFrroIsi,
            departmentalId: randomDepartmentId(),
            currentType: UserAffiliationType.Professor,
          }),
        ],
      }),
      federEdgardo: this.usersRepo.create({
        id: userIdGen.next(),
        email: `user${numGenMockUsers.next()}@example.com`,
        password: await argon2.hash(`Password_${numGenMockPasswords.next()}`),
        firstName: 'Edgardo Joaquin',
        lastName: 'Feder',
        isEmailVerified: true,
        interests: [
          interests.environment,
          interests.contingencies,
          interests.sustainableDevelopment,
        ],
        userAffiliations: [
          this.userAffiliationRepo.create({
            id: affiliationIdGen.next(),
            researchDepartment: researchDepartments.utnFrroGese,
            departmentalId: randomDepartmentId(),
            currentType: UserAffiliationType.Researcher,
          }),
          this.userAffiliationRepo.create({
            id: affiliationIdGen.next(),
            researchDepartment: researchDepartments.utnFrroIm,
            departmentalId: randomDepartmentId(),
            currentType: UserAffiliationType.Professor,
          }),
        ],
      }),
      denarisSilvia: this.usersRepo.create({
        id: userIdGen.next(),
        email: `user${numGenMockUsers.next()}@example.com`,
        password: await argon2.hash(`Password_${numGenMockPasswords.next()}`),
        firstName: 'Silvia Elene',
        lastName: 'Denaris',
        isEmailVerified: true,
        interests: [interests.infoSystems],
        userAffiliations: [
          this.userAffiliationRepo.create({
            id: affiliationIdGen.next(),
            researchDepartment: researchDepartments.utnFrroIsi,
            departmentalId: randomDepartmentId(),
            currentType: UserAffiliationType.Professor,
          }),
          this.userAffiliationRepo.create({
            id: affiliationIdGen.next(),
            researchDepartment: researchDepartments.utnFrroBasicas,
            departmentalId: randomDepartmentId(),
            currentType: UserAffiliationType.Professor,
          }),
        ],
      }),
      obregonMario: this.usersRepo.create({
        id: userIdGen.next(),
        email: `user${numGenMockUsers.next()}@example.com`,
        password: await argon2.hash(`Password_${numGenMockPasswords.next()}`),
        firstName: 'Mario',
        lastName: 'Obregon',
        isEmailVerified: true,
        interests: [
          interests.arduino,
          interests.optimization,
          interests.sustainableDevelopment,
        ],
        userAffiliations: [
          this.userAffiliationRepo.create({
            id: affiliationIdGen.next(),
            researchDepartment: researchDepartments.unrFceiaIm,
            departmentalId: randomDepartmentId(),
            currentType: UserAffiliationType.Professor,
          }),
        ],
      }),
      troiloAlessandro: this.usersRepo.create({
        id: userIdGen.next(),
        email: `user${numGenMockUsers.next()}@example.com`,
        password: await argon2.hash(`Password_${numGenMockPasswords.next()}`),
        firstName: 'Alessandro',
        lastName: 'Troilo',
        isEmailVerified: true,
        interests: [interests.dataScience, interests.environment],
        userAffiliations: [
          this.userAffiliationRepo.create({
            id: affiliationIdGen.next(),
            researchDepartment: researchDepartments.utnFrroIq,
            departmentalId: randomDepartmentId(),
          }),
        ],
      }),
      brignoniLucia: this.usersRepo.create({
        id: userIdGen.next(),
        email: `user${numGenMockUsers.next()}@example.com`,
        password: await argon2.hash(`Password_${numGenMockPasswords.next()}`),
        firstName: 'Lucia',
        lastName: 'Brignoni',
        isEmailVerified: false,
        interests: [interests.backendDev, interests.frontendDev],
        userAffiliations: [
          this.userAffiliationRepo.create({
            id: affiliationIdGen.next(),
            researchDepartment: researchDepartments.utnFrroIsi,
            departmentalId: randomDepartmentId(),
          }),
        ],
      }),
      dellepianeJuan: this.usersRepo.create({
        id: userIdGen.next(),
        email: `user${numGenMockUsers.next()}@example.com`,
        password: await argon2.hash(`Password_${numGenMockPasswords.next()}`),
        firstName: 'Juan',
        lastName: 'Dellepiane',
        isEmailVerified: true,
        interests: [
          interests.edTech,
          interests.dataScience,
          interests.backendDev,
        ],
        userAffiliations: [
          this.userAffiliationRepo.create({
            id: affiliationIdGen.next(),
            researchDepartment: researchDepartments.utnFrroIsi,
            departmentalId: randomDepartmentId(),
          }),
        ],
      }),
      lizcovichHernan: this.usersRepo.create({
        id: userIdGen.next(),
        email: `user${numGenMockUsers.next()}@example.com`,
        password: await argon2.hash(`Password_${numGenMockPasswords.next()}`),
        firstName: 'Hernan Juan Cruz',
        lastName: 'Lizcovich',
        isEmailVerified: true,
        interests: [interests.arduino, interests.sustainableDevelopment],
        userAffiliations: [
          this.userAffiliationRepo.create({
            id: affiliationIdGen.next(),
            researchDepartment: researchDepartments.utnFrroIm,
            departmentalId: randomDepartmentId(),
          }),
        ],
      }),
      alcazarPablo: this.usersRepo.create({
        id: userIdGen.next(),
        email: `user${numGenMockUsers.next()}@example.com`,
        password: await argon2.hash(`Password_${numGenMockPasswords.next()}`),
        firstName: 'Pablo',
        lastName: 'Alcazar',
        isEmailVerified: true,
        interests: [interests.energy, interests.environment],
        userAffiliations: [
          this.userAffiliationRepo.create({
            id: affiliationIdGen.next(),
            researchDepartment: researchDepartments.unrFceiaElectrica,
            departmentalId: randomDepartmentId(),
          }),
        ],
      }),
      inmhofCamila: this.usersRepo.create({
        id: userIdGen.next(),
        email: `user${numGenMockUsers.next()}@example.com`,
        password: await argon2.hash(`Password_${numGenMockPasswords.next()}`),
        firstName: 'Inhof',
        lastName: 'Camila',
        isEmailVerified: true,
        interests: [interests.energy, interests.contingencies],
        userAffiliations: [
          this.userAffiliationRepo.create({
            id: affiliationIdGen.next(),
            researchDepartment: researchDepartments.unrFceiaElectrica,
            departmentalId: randomDepartmentId(),
          }),
        ],
      }),
    };
  }
}
