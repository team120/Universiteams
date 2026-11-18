import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource, In } from 'typeorm';
import * as cookieParser from 'cookie-parser';
import { createProjectTestingApp } from './project.e2e.module';
import {
  Enrollment,
  ProjectRole,
  RequestState,
} from '../../src/enrollment/enrollment.entity';
import { Project } from '../../src/project/project.entity';

type ProjectInList = { id: number; name: string; creationDate: string };

const pageSize = 3;

describe('Project list sorting and pagination (e2e)', () => {
  let app: INestApplication;
  let conn: DataSource;

  beforeEach(async () => {
    const testingAppCreationResult = await createProjectTestingApp();
    app = testingAppCreationResult.app;
    app.use(cookieParser());

    await app.init();

    conn = app.get(DataSource);
    await conn.runMigrations();
  });

  afterEach(async () => {
    await app.close();
  });

  // Every page, one after the other, until the project count is reached
  const getAllPages = async (query: string, cookie?: string) => {
    const projects: ProjectInList[] = [];
    let projectCount = Infinity;
    for (let offset = 0; offset < projectCount; offset += pageSize) {
      const req = request(app.getHttpServer()).get(
        `/projects?${query}&offset=${offset}&limit=${pageSize}`,
      );
      if (cookie) req.set('Cookie', cookie);
      const res = await req;
      expect(res.status).toBe(200);
      projectCount = res.body.projectCount;
      projects.push(...res.body.projects);
    }
    return projects;
  };

  // A single page holding every project, sorted as requested
  const getOnePage = async (query: string, cookie?: string) => {
    const req = request(app.getHttpServer()).get(`/projects?${query}`);
    if (cookie) req.set('Cookie', cookie);
    const res = await req;
    expect(res.status).toBe(200);
    expect(res.body.projects.length).toBeGreaterThan(pageSize);
    return res.body.projects as ProjectInList[];
  };

  const ids = (projects: ProjectInList[]) => projects.map(({ id }) => id);

  describe('when no sortBy is given', () => {
    it('should list the newest projects first, by id on the same date', async () => {
      const projects = await getOnePage('');

      const expected = [...projects].sort(
        (a, b) => b.creationDate.localeCompare(a.creationDate) || b.id - a.id,
      );
      expect(ids(projects)).toEqual(ids(expected));
    });

    it('should put every project on exactly one page, in that order', async () => {
      expect(ids(await getAllPages(''))).toEqual(ids(await getOnePage('')));
    });
  });

  describe.each(['name', 'creationDate'] as const)(
    'when sorting by %s',
    (sortBy) => {
      it.each(['ASC', 'DESC'])(
        'should page the projects in %s order across pages',
        async (order) => {
          const query = `sortBy=${sortBy}&order=${order}`;

          const onePage = await getOnePage(query);
          // The database compares names by byte order (C collation), like `<`
          const direction = order === 'ASC' ? 1 : -1;
          const compare = (a: ProjectInList, b: ProjectInList) => {
            if (a[sortBy] < b[sortBy]) return -1;
            if (a[sortBy] > b[sortBy]) return 1;
            return a.id - b.id;
          };
          const expected = [...onePage].sort(
            (a, b) => direction * compare(a, b),
          );
          expect(ids(onePage)).toEqual(ids(expected));
          expect(ids(await getAllPages(query))).toEqual(ids(onePage));
        },
      );
    },
  );

  describe('when a leader sorts by requestEnrollmentCount', () => {
    const camilaId = 2;
    // Distinct counts (ids are below 17) in an order unrelated to the ids
    const requestCount = (projectId: number) => (projectId * 5) % 17;
    let enrolled: Enrollment[];
    let addedEnrollmentIds: number[];
    let memberProjectId: number;
    let initialCounts: Pick<Project, 'id' | 'requestEnrollmentCount'>[];
    let cookie: string;

    beforeEach(async () => {
      initialCounts = await conn.getRepository(Project).find({
        select: ['id', 'requestEnrollmentCount'],
      });

      // Camila sees the request count of every project she leads or admins,
      // so make her an admin of all of them
      enrolled = await conn
        .getRepository(Enrollment)
        .find({ where: { user: { id: camilaId } }, relations: ['project'] });
      await conn
        .getRepository(Enrollment)
        .update(
          { id: In(enrolled.map(({ id }) => id)) },
          { role: ProjectRole.Admin, requestState: RequestState.Accepted },
        );
      const enrolledProjectIds = enrolled.map(({ project }) => project.id);
      const added = await conn.getRepository(Enrollment).insert(
        initialCounts
          .filter(({ id }) => !enrolledProjectIds.includes(id))
          .map(({ id }) => ({
            project: { id },
            user: { id: camilaId },
            role: ProjectRole.Admin,
            requestState: RequestState.Accepted,
          })),
      );
      addedEnrollmentIds = added.identifiers.map(({ id }) => id);

      // Except a plain member of the project with the most requests, who
      // doesn't see its count
      const listed = await request(app.getHttpServer()).get('/projects');
      memberProjectId = (listed.body.projects as ProjectInList[]).reduce(
        (top, project) =>
          requestCount(project.id) > requestCount(top.id) ? project : top,
      ).id;
      const memberEnrollment = await conn
        .getRepository(Enrollment)
        .findOneOrFail({
          where: { project: { id: memberProjectId }, user: { id: camilaId } },
        });
      await conn
        .getRepository(Enrollment)
        .update(memberEnrollment.id, { role: ProjectRole.Member });

      for (const { id } of initialCounts) {
        await conn
          .getRepository(Project)
          .update(id, { requestEnrollmentCount: requestCount(id) });
      }

      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'user2@example.com', password: 'Password_2' });
      cookie = login.header['set-cookie'];
    });

    afterEach(async () => {
      await conn.getRepository(Enrollment).delete(addedEnrollmentIds);
      for (const { id, role, requestState } of enrolled) {
        await conn.getRepository(Enrollment).update(id, { role, requestState });
      }
      for (const { id, requestEnrollmentCount } of initialCounts) {
        await conn
          .getRepository(Project)
          .update(id, { requestEnrollmentCount });
      }
    });

    it.each(['ASC', 'DESC'])(
      'should page the projects in %s order across pages, hidden counts last',
      async (order) => {
        const query = `sortBy=requestEnrollmentCount&order=${order}`;

        const onePage = await getOnePage(query, cookie);
        expect(onePage[onePage.length - 1].id).toBe(memberProjectId);
        const counts = onePage.slice(0, -1).map(({ id }) => requestCount(id));
        const sortedCounts = [...counts].sort((a, b) =>
          order === 'ASC' ? a - b : b - a,
        );
        expect(counts).toEqual(sortedCounts);
        expect(ids(await getAllPages(query, cookie))).toEqual(ids(onePage));
      },
    );
  });
});
