import { DataSource, SelectQueryBuilder } from 'typeorm';
import { PinoLogger } from 'nestjs-pino';
import { QueryCreator } from './project.query.creator';
import { Project } from './project.entity';
import { ProjectSortAttributes, SortByProperty } from './dtos/project.find.dto';
import { AscendingDescendingOrder } from '../utils/sorting';
import { UniqueWordsService } from './unique-words.service';
import { ICurrentDateService } from '../utils/current-date';
import { CurrentUserWithoutTokens } from '../auth/dtos/current-user.dto';
import { BadRequest } from '../utils/exceptions/exceptions';

describe('QueryCreator', () => {
  // Only builds SQL: the data source never connects
  const dataSource = new DataSource({
    type: 'postgres',
    entities: ['src/**/*.entity.ts'],
  });
  let queryCreator: QueryCreator;

  beforeAll(async () => {
    await dataSource['buildMetadatas']();
  });

  beforeEach(() => {
    queryCreator = new QueryCreator(
      dataSource.getRepository(Project),
      {} as UniqueWordsService,
      { setContext: jest.fn(), debug: jest.fn() } as unknown as PinoLogger,
      { get: () => '2026-01-01' } as ICurrentDateService,
    );
  });

  describe('applyFuzzyTextSearch', () => {
    const getMatchingWords = jest.fn();
    let fuzzyQueryCreator: QueryCreator;

    beforeEach(() => {
      getMatchingWords.mockReset();
      fuzzyQueryCreator = new QueryCreator(
        dataSource.getRepository(Project),
        { getMatchingWords } as unknown as UniqueWordsService,
        { setContext: jest.fn(), debug: jest.fn() } as unknown as PinoLogger,
        { get: () => '2026-01-01' } as ICurrentDateService,
      );
    });

    // The normal search query, which found this many projects
    const searchFinding = (projectCount: number) =>
      ({
        getCount: jest.fn().mockResolvedValue(projectCount),
      } as unknown as SelectQueryBuilder<Project>);

    it('should keep the search when it found projects', async () => {
      const query = searchFinding(2);

      const result = await fuzzyQueryCreator.applyFuzzyTextSearch(
        { generalSearch: 'teams' },
        query,
      );

      expect(result).toEqual([query, undefined]);
      expect(getMatchingWords).not.toHaveBeenCalled();
    });

    it('should keep the search when the term has no words', async () => {
      const query = searchFinding(0);

      const result = await fuzzyQueryCreator.applyFuzzyTextSearch(
        { generalSearch: '!!!' },
        query,
      );

      expect(result).toEqual([query, undefined]);
      expect(query.getCount).not.toHaveBeenCalled();
    });

    it.each([[[]], [['']]])(
      'should keep the empty search, with no suggestions, when the similar words are %p',
      async (matchingWords: string[]) => {
        getMatchingWords.mockResolvedValue(matchingWords);
        const query = searchFinding(0);

        const result = await fuzzyQueryCreator.applyFuzzyTextSearch(
          { generalSearch: 'zzzzqqq' },
          query,
        );

        expect(result).toEqual([query, undefined]);
      },
    );

    it('should search the first similar words, and suggest them all', async () => {
      getMatchingWords.mockResolvedValue(['utn frro', 'utn fra']);

      const [fuzzyQuery, suggestions] =
        await fuzzyQueryCreator.applyFuzzyTextSearch(
          { generalSearch: "utq' froo&" },
          searchFinding(0),
        );

      expect(getMatchingWords).toHaveBeenCalledWith('utq froo');
      expect(fuzzyQuery.getParameters()).toEqual({
        generalSearch: 'utn & frro',
      });
      expect(suggestions).toEqual(['utn frro', 'utn fra']);
    });
  });

  describe('applySortingAndPagination', () => {
    const currentUser = { id: 2 } as CurrentUserWithoutTokens;

    const sortAndPaginate = (
      sortAttributes: ProjectSortAttributes,
      user?: CurrentUserWithoutTokens,
    ) => {
      const query = queryCreator.applySortingAndPagination(
        dataSource
          .getRepository(Project)
          .createQueryBuilder('project')
          .select('project.id as id')
          .groupBy('project.id'),
        { offset: 10, limit: 5 },
        sortAttributes,
        user,
      );
      const sql = query.getQuery().replace(/\s+/g, ' ');
      // The subquery that picks the ids on the page
      const projectIds = sql.match(/INNER JOIN \((SELECT .*?)\) "projectIds"/);
      return { projectIds: projectIds[1], sql, query };
    };

    const pageOrderedBy = (order: string) =>
      `row_number() over ( ORDER BY ${order} ) as orderKey`;
    const pageCut = 'ORDER BY orderKey ASC LIMIT 5 OFFSET 10';

    it('should list the newest projects first when no sortBy is given', () => {
      const { projectIds } = sortAndPaginate({});

      expect(projectIds).toContain(
        pageOrderedBy('"project"."creationDate" DESC, "project"."id" DESC'),
      );
      expect(projectIds).toContain(pageCut);
    });

    it('should use the given order when only the order is given', () => {
      const { projectIds } = sortAndPaginate({
        order: AscendingDescendingOrder.ascending,
      });

      expect(projectIds).toContain(
        pageOrderedBy('"project"."creationDate" ASC, "project"."id" ASC'),
      );
    });

    it.each([
      [SortByProperty.name, '"project"."name"'],
      [SortByProperty.creationDate, '"project"."creationDate"'],
    ])(
      'should sort by %s in ascending order when no order is given',
      (sortBy, column) => {
        const { projectIds } = sortAndPaginate({ sortBy });

        expect(projectIds).toContain(
          pageOrderedBy(`${column} ASC, "project"."id" ASC`),
        );
        expect(projectIds).toContain(pageCut);
      },
    );

    it.each([SortByProperty.facility, SortByProperty.researchDepartment])(
      'should fall back to the creation date for %s, which has no sort column',
      (sortBy) => {
        const { projectIds } = sortAndPaginate({
          sortBy,
          order: AscendingDescendingOrder.descending,
        });

        expect(projectIds).toContain(
          pageOrderedBy('"project"."creationDate" DESC, "project"."id" DESC'),
        );
      },
    );

    describe('when sorting by requestEnrollmentCount', () => {
      it('should sort the page by the count the user can see, hidden counts last', () => {
        const { projectIds, query } = sortAndPaginate(
          {
            sortBy: SortByProperty.requestEnrollmentCount,
            order: AscendingDescendingOrder.descending,
          },
          currentUser,
        );

        expect(projectIds).toContain(
          pageOrderedBy(
            'MAX(CASE WHEN "sortEnrollment"."role" IN (:...requestCountRoles) AND "sortEnrollment"."requestState" = :requestCountState THEN "project"."requestEnrollmentCount" ELSE NULL END) DESC NULLS LAST, "project"."id" DESC',
          ),
        );
        expect(projectIds).toContain(
          'LEFT JOIN "enrollment" "sortEnrollment" ON "sortEnrollment"."projectId"="project"."id" AND ("sortEnrollment"."userId" = :sortUserId)',
        );
        expect(projectIds).toContain(pageCut);
        expect(query.getParameters()).toEqual(
          expect.objectContaining({
            sortUserId: currentUser.id,
            requestCountRoles: ['Leader', 'Admin'],
            requestCountState: 'Accepted',
          }),
        );
      });

      it('should rank the projects only once, in the page subquery', () => {
        const { sql } = sortAndPaginate(
          { sortBy: SortByProperty.requestEnrollmentCount },
          currentUser,
        );

        expect(sql.match(/row_number\(\)/g)).toHaveLength(1);
      });

      it('should be refused without a current user', () => {
        expect(() =>
          sortAndPaginate({ sortBy: SortByProperty.requestEnrollmentCount }),
        ).toThrow(BadRequest);
      });
    });
  });
});
