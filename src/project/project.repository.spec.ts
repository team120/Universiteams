import { TestingModule, Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { ProjectFilters } from './dtos/project.find.dto';
import { Project, ProjectType } from './project.entity';
import { ProjectCustomRepository } from './project.repository';

describe('ProjectCustomRepository', () => {
  let repository: ProjectCustomRepository;
  const projectRepositoryMock = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectCustomRepository,
        {
          provide: getRepositoryToken(Project),
          useValue: projectRepositoryMock,
        },
        {
          provide: PinoLogger,
          useValue: { debug: jest.fn() },
        },
      ],
    }).compile();

    repository = module.get<ProjectCustomRepository>(ProjectCustomRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('getMatchingProjectIds', () => {
    describe('when only one filter argument is provided', () => {
      test.each([{ type: ProjectType.Formal }, { isDown: true }])(
        'should call andWhere only once with exactly that parameter',
        async (filters: ProjectFilters) => {
          const queryMock = {
            andWhere: jest.fn(),
            select: jest.fn().mockReturnValue({ getMany: jest.fn() }),
          };
          repository[
            'getProjectWithRelationsQuery'
          ] = jest.fn().mockReturnValue(queryMock);

          await repository.getMatchingProjectIds(filters);

          expect(queryMock.andWhere).toHaveBeenCalledTimes(1);
          expect(queryMock.andWhere.mock.calls[0][1]).toEqual(filters);
          expect(queryMock.select).toHaveBeenCalledTimes(1);
        },
      );
    });
  });
});
