import { TestingModule, Test } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { ProjectFilters } from './dtos/project.find.dto';
import { ProjectType } from './project.entity';
import { ProjectCustomRepository, QueryCreator } from './project.repository';

describe('ProjectCustomRepository', () => {
  let repository: ProjectCustomRepository;
  const queryMock = {
    andWhere: jest.fn(),
    select: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    getCount: jest.fn(),
    getMany: jest.fn(),
  };
  const queryCreatorMock = {
    getProjectWithRelationsQuery: jest.fn().mockReturnValue(queryMock),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectCustomRepository,
        {
          provide: QueryCreator,
          useValue: queryCreatorMock,
        },
        {
          provide: PinoLogger,
          useValue: { debug: jest.fn() },
        },
      ],
    }).compile();

    repository = module.get<ProjectCustomRepository>(ProjectCustomRepository);
  });

  afterEach(() => {
    Object.values(queryMock).map((mock) => mock.mockReset());
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('getMatchingProjectIds', () => {
    describe('when only one filter argument is provided', () => {
      test.each([
        { type: ProjectType.Formal },
        { isDown: true },
        { researchDepartmentId: 1 },
        { institutionId: 1 },
        { dateFrom: new Date() },
      ])('should call andWhere only once', async (filters: ProjectFilters) => {
        queryMock.select.mockReturnValue({ getMany: jest.fn() });

        await repository.getMatchingProjectIds(filters);

        expect(queryMock.andWhere).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('find projects by id', () => {
    describe('when a bunch of projects are requested in a certain order', () => {
      it('should join the project ids and then apply that kind of sorting', async () => {
        queryMock.where.mockReturnThis();
        const sortByProperty = 'name';
        const inAscendingOrder = true;

        await repository.findProjectsById([{ id: 1 }, { id: 2 }], {
          sortBy: sortByProperty,
          inAscendingOrder: inAscendingOrder,
        });

        expect(queryMock.where).toHaveBeenCalledWith(`project.id IN (1, 2)`);
        expect(queryMock.orderBy).toHaveBeenCalledWith('project.name', 'ASC');
      });
    });
  });
});
