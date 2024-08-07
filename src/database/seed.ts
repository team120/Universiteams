import * as argon2 from 'argon2';
import {
  Enrollment,
  ProjectRole,
  RequestState,
} from '../enrollment/enrollment.entity';
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
        description: `
          <p>Este proyecto formal tiene como objetivo desarrollar un sistema de geoposicionamiento en el contexto de Internet de las Cosas (IoT). Utilizando tecnologías como <strong>Arduino</strong>, el proyecto abordará aspectos de <strong>seguridad informática</strong> para garantizar la integridad y privacidad de los datos de ubicación.</p>
          <p>El proyecto es liderado por <strong>Camila Villa</strong> y cuenta con la participación de <strong>Juan Rizzo</strong>, ambos investigadores del departamento de Ingeniería en Sistemas de la UTN FRRo. Con su experiencia en seguridad informática y Arduino, el equipo está bien posicionado para afrontar los desafíos técnicos de este proyecto innovador.</p>
        `,
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
        description: `
          <p>Universiteams es un proyecto informal que busca aplicar técnicas de <strong>ciencia de datos</strong> en el ámbito educativo (<strong>Edtech</strong>). Mediante el análisis de datos, el proyecto tiene como objetivo mejorar la experiencia de aprendizaje y el rendimiento de los estudiantes universitarios.</p>
          <p>El proyecto es liderado por <strong>Marcos Sanchez</strong> y cuenta con la participación de:</p>
          <ul>
            <li>Camila Villa (administradora)</li>
            <li>Juan Dellepiane</li>
            <li>Juan Alba</li>
          </ul>
          <p>Todos ellos son investigadores del departamento de Ingeniería en Sistemas de la UTN FRRo. Con experiencia en ciencia de datos y tecnología educativa, el equipo está comprometido a utilizar los datos para impulsar la innovación en la educación superior.</p>
        `,
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
        description: `
          <p>Este proyecto formal del departamento de Ciencias Básicas de la UTN FRRo tiene como objetivo desarrollar estrategias didácticas innovadoras para la enseñanza de la física en carreras de ingeniería. Bajo el liderazgo del profesor <strong>Aldo Jose Fanaro</strong>, el proyecto busca mejorar la comprensión y el compromiso de los estudiantes con los conceptos físicos fundamentales.</p>
          <blockquote>Aprovechando los últimos avances en tecnología educativa (Edtech), el proyecto tiene como objetivo crear experiencias de aprendizaje contextualizadas y atractivas.</blockquote>
          <p>Con su amplia experiencia en educación en ingeniería, el equipo está bien posicionado para transformar la forma en que se enseña la física y preparar mejor a los estudiantes para sus futuras carreras.</p>
        `,
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
        description: `
          <p>Este proyecto formal del Centro de Aplicaciones Informáticas y Modelado en Ingeniería (CAIMI) de la UTN FRRo se centra en el desarrollo de estrategias para optimizar el diseño de procesos sostenibles. Liderado por la investigadora <strong>Julia Sol Benia</strong>, el proyecto busca incorporar:</p>
          <ol>
            <li>La valorización de subproductos</li>
            <li>La integración de energías renovables en los procesos industriales</li>
          </ol>
          <p>Mediante la aplicación de técnicas avanzadas de <strong>ingeniería de procesos</strong>, el equipo tiene como objetivo crear soluciones innovadoras que reduzcan el impacto ambiental y mejoren la eficiencia de los procesos. Con su experiencia en ingeniería de procesos sostenibles, el equipo está comprometido a contribuir a un futuro más verde y sostenible para la industria.</p>
        `,
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
        description: `
          <p>Este proyecto formal del Centro de Aplicaciones Informáticas y Modelado en Ingeniería (CAIMI) de la UTN FRRo tiene como objetivo desarrollar modelos matemáticos y optimizar procesos para la captura de gases de efecto invernadero. Bajo el liderazgo del investigador <strong>Sebastian Fabricio Muso</strong>, el proyecto aborda uno de los desafíos más apremiantes de nuestro tiempo: <em>mitigar el cambio climático</em>.</p>
          <p>El equipo, que incluye a los investigadores <strong>Mario Obregon</strong> y <strong>Hernan Juan Cruz Lizcovich</strong>, utilizará técnicas avanzadas de:</p>
          <ul>
            <li>Modelado</li>
            <li>Optimización</li>
            <li>Simulación</li>
          </ul>
          <p>Estas técnicas serán aplicadas para diseñar procesos eficientes de captura de carbono. Con su experiencia en medio ambiente, desarrollo sostenible y optimización, el equipo busca contribuir a los esfuerzos globales para reducir las emisiones de gases de efecto invernadero y combatir el cambio climático.</p>
        `,
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
        description: `
          <p>Este proyecto informal es una colaboración entre los departamentos de Ingeniería Química e Ingeniería en Sistemas de la UTN FRRo. Liderado por la investigadora <strong>Marcela Camila Chiavoni</strong>, el proyecto tiene como objetivo desarrollar mapas de preferencia para mieles monoflorales de la región fitogeográfica pampeana.</p>
          <p>El equipo, que incluye a <strong>Juan Alba</strong> y <strong>Juan Dellepiane</strong>, buscará aplicar técnicas de:</p>
          <ul>
            <li>Tecnología alimentaria (foodtech)</li>
            <li>Análisis de datos</li>
          </ul>
          <p>Estas técnicas serán utilizadas para caracterizar y agregar valor a las mieles monoflorales de la región. Con su experiencia en tecnología alimentaria y desarrollo de software, el equipo está bien posicionado para crear herramientas innovadoras que beneficien a los productores de miel y promuevan los productos regionales.</p>
        `,
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
        description: `
          <p>Este proyecto formal del Centro de Investigación y Desarrollo en Tecnología de Alimentos (CIDTA) de la UTN FRRo se centra en la caracterización de maltas de cebada. Bajo el liderazgo de la investigadora <strong>Rosa Martinez</strong>, el proyecto busca mejorar la comprensión de las propiedades y el potencial de las maltas de cebada en la industria alimentaria.</p>
          <blockquote>Mediante la aplicación de técnicas avanzadas de tecnología alimentaria (foodtech), el equipo analizará las características físicas, químicas y sensoriales de diferentes variedades de maltas de cebada.</blockquote>
          <p>Los resultados de este proyecto contribuirán al desarrollo de productos alimenticios innovadores y de alta calidad, especialmente en la industria cervecera.</p>
        `,
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
        description: `
          <p>Este proyecto formal del Centro de Aplicaciones Informáticas y Modelado en Ingeniería (CAIMI) de la UTN FRRo se enfoca en el desarrollo de estrategias de modelado de procesos bajo la filosofía de diseño inherentemente seguro. Liderado por el investigador <strong>Nicola Scania</strong>, el proyecto busca mejorar la seguridad y la confiabilidad de los procesos industriales.</p>
          <p>Mediante la aplicación de principios de diseño inherentemente seguro y técnicas avanzadas de ingeniería de procesos, el equipo tiene como objetivo desarrollar metodologías y herramientas que permitan diseñar procesos más seguros desde su concepción. Este proyecto contribuirá a:</p>
          <ul>
            <li>La prevención de accidentes</li>
            <li>La protección de los trabajadores</li>
            <li>La protección del medio ambiente en entornos industriales</li>
          </ul>
        `,
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
        description: `
          <p>Este proyecto formal del Centro de Aplicaciones Informáticas y Modelado en Ingeniería (CAIMI) de la UTN FRRo se centra en el desarrollo de estrategias de diseño de procesos de bioingeniería sostenibles. Bajo el liderazgo del investigador <strong>Nicola Scania</strong>, el proyecto busca aplicar estos enfoques a casos de estudio en el marco de la bioeconomía.</p>
          <p>El equipo, que incluye al investigador <strong>Hernan Juan Cruz Lizcovich</strong>, combinará conocimientos de:</p>
          <ul>
            <li>Ingeniería de procesos</li>
            <li>Biotecnología</li>
          </ul>
          <p>Estos conocimientos serán aplicados para diseñar procesos innovadores y sostenibles basados en recursos biológicos. Este proyecto contribuirá al desarrollo de una economía más verde y circular, promoviendo el uso sostenible de los recursos naturales y la reducción del impacto ambiental.</p>
        `,
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
        description: `
          <p>Este proyecto formal del Centro de Investigación y Desarrollo en Tecnologías Especiales (CEDITE) de la UTN FRRo tiene como objetivo diseñar un sistema multisensorial y multimedial ergonométrico para salas universitarias de inclusión académica. Liderado por el investigador <strong>Juan Luis Alba</strong>, el proyecto busca mejorar la accesibilidad y la experiencia de aprendizaje de los estudiantes con necesidades especiales.</p>
          <p>El equipo, que cuenta con la participación de <strong>Juan Rizzo</strong> como administrador, aplicará principios de diseño ergonómico y tecnologías educativas (Edtech) para crear entornos de aprendizaje inclusivos y adaptativos. Este proyecto contribuirá a:</p>
          <ul>
            <li>La igualdad de oportunidades en la educación superior</li>
            <li>La inclusión de los estudiantes con discapacidades</li>
          </ul>
        `,
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
        description: `
          <p>Este proyecto informal del departamento de Ingeniería Eléctrica de la UNR FCEIA tiene como objetivo medir el rendimiento de una planta fotovoltaica y desarrollar una aplicación de cálculo asociada. Bajo el liderazgo del investigador <strong>Pablo Bernal</strong>, el proyecto busca mejorar la eficiencia y el monitoreo de los sistemas de energía solar.</p>
          <p>El equipo, que incluye a los investigadores <strong>Camila Inhof</strong> y <strong>Pablo Alcazar</strong>, utilizará técnicas avanzadas de medición y análisis para evaluar el rendimiento de la planta fotovoltaica. Además, desarrollarán una aplicación de cálculo que permita optimizar el diseño y la operación de los sistemas fotovoltaicos. Este proyecto contribuirá a:</p>
          <ul>
            <li>La adopción y mejora de las tecnologías de energía solar</li>
            <li>La promoción de un futuro energético más sostenible</li>
          </ul>
        `,
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
        description: `
          <p>Este proyecto informal del departamento de Ingeniería Química de la UTN FRRo tiene como objetivo evaluar la actividad total de sulfatación en la atmósfera de la ciudad de Rosario y la región industrial al norte. Bajo el liderazgo del investigador <strong>Edgardo Joaquin Feder</strong>, el proyecto aborda un problema ambiental crítico que afecta la calidad del aire y la salud pública.</p>
          <p>El equipo, que cuenta con la participación del investigador <strong>Alessandro Troilo</strong>, utilizará técnicas avanzadas de monitoreo y análisis para cuantificar los niveles de sulfatación en la atmósfera. Con su experiencia en medio ambiente, contingencias y desarrollo sostenible, el equipo buscará proporcionar información valiosa para el desarrollo de estrategias efectivas de:</p>
          <ul>
            <li>Gestión de la calidad del aire</li>
            <li>Mitigación de la contaminación</li>
          </ul>
        `,
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
        description: `
          <p>Este proyecto informal es una colaboración entre los departamentos de Ingeniería en Sistemas y Ciencias Básicas de la UTN FRRo. Liderado por la profesora <strong>Silvia Elene Denaris</strong>, el proyecto tiene como objetivo estudiar las estructuras conceptuales subyacentes a la ciencia de datos.</p>
          <p>El equipo multidisciplinario, que incluye al profesor <strong>Marcos Sanchez</strong> como administrador, y a los investigadores <strong>Juan Dellepiane</strong> y <strong>Alessandro Troilo</strong>, utilizará un enfoque teórico y práctico para analizar los fundamentos conceptuales de la ciencia de datos. Con su experiencia en sistemas de información y ciencia de datos, el equipo buscará contribuir al desarrollo de un marco conceptual sólido para esta disciplina en rápida evolución, sentando las bases para:</p>
          <ul>
            <li>Futuras investigaciones</li>
            <li>Aplicaciones innovadoras</li>
          </ul>
        `,
      }),
    };
  }

  private async usersFactory(
    researchDepartments: ReturnType<typeof this.researchDepartmentsFactory>,
    interests: ReturnType<typeof this.interestsFactory>,
  ) {
    const userIdGen = new NumUnitaryIncrease(1);
    const numGenMockUsers = new NumUnitaryIncrease(1);
    const numGenMockPasswords = new NumUnitaryIncrease(1);
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
            researchDepartmentId: researchDepartments.utnFrroIc.id,
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
            researchDepartmentId: researchDepartments.utnFrroIsi.id,
            currentType: UserAffiliationType.Professor,
          }),
          this.userAffiliationRepo.create({
            researchDepartmentId: researchDepartments.unrFceiaIe.id,
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
            researchDepartmentId: researchDepartments.utnFrroIq.id,
          }),
          this.userAffiliationRepo.create({
            researchDepartmentId: researchDepartments.unrFceiaIe.id,
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
            researchDepartmentId: researchDepartments.utnFrroBasicas.id,
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
            researchDepartmentId: researchDepartments.utnFrroCaimi.id,
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
            researchDepartmentId: researchDepartments.utnFrroCaimi.id,
            currentType: UserAffiliationType.Researcher,
          }),
          this.userAffiliationRepo.create({
            researchDepartmentId: researchDepartments.unrFceiaIe.id,
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
            researchDepartmentId: researchDepartments.utnFrroCidta.id,
            currentType: UserAffiliationType.Researcher,
          }),
          this.userAffiliationRepo.create({
            researchDepartmentId: researchDepartments.utnFrroIq.id,
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
            researchDepartmentId: researchDepartments.utnFrroCidta.id,
            currentType: UserAffiliationType.Researcher,
          }),
          this.userAffiliationRepo.create({
            researchDepartmentId: researchDepartments.utnFrroIq.id,
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
            researchDepartmentId: researchDepartments.utnFrroOes.id,
            currentType: UserAffiliationType.Researcher,
          }),
          this.userAffiliationRepo.create({
            researchDepartmentId: researchDepartments.unrFceiaElectrica.id,
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
            researchDepartmentId: researchDepartments.utnFrroCaimi.id,
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
            researchDepartmentId: researchDepartments.utnFrroCedite.id,
            currentType: UserAffiliationType.Researcher,
          }),
          this.userAffiliationRepo.create({
            researchDepartmentId: researchDepartments.utnFrroIsi.id,
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
            researchDepartmentId: researchDepartments.utnFrroGese.id,
            currentType: UserAffiliationType.Researcher,
          }),
          this.userAffiliationRepo.create({
            researchDepartmentId: researchDepartments.utnFrroIm.id,
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
            researchDepartmentId: researchDepartments.utnFrroIsi.id,
            currentType: UserAffiliationType.Professor,
          }),
          this.userAffiliationRepo.create({
            researchDepartmentId: researchDepartments.utnFrroBasicas.id,
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
            researchDepartmentId: researchDepartments.unrFceiaIm.id,
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
            researchDepartmentId: researchDepartments.utnFrroIq.id,
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
            researchDepartmentId: researchDepartments.utnFrroIsi.id,
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
            researchDepartmentId: researchDepartments.utnFrroIsi.id,
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
            researchDepartmentId: researchDepartments.utnFrroIm.id,
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
            researchDepartmentId: researchDepartments.unrFceiaElectrica.id,
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
            researchDepartmentId: researchDepartments.unrFceiaElectrica.id,
          }),
        ],
      }),
    };
  }
}
