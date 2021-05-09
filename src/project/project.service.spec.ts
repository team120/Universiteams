import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { DbException } from '../utils/exceptions/database.exception';
import { SerializationModule } from '../utils/serialization/serialization.module';
import { ProjectCustomRepository } from './project.repository';
import { ProjectService } from './project.service';

describe('ProjectService', () => {
  let service: ProjectService;
  const projectCustomRepositoryMock = { findOne: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        {
          provide: PinoLogger,
          useValue: { debug: jest.fn(), setContext: jest.fn() },
        },
        {
          provide: ProjectCustomRepository,
          useValue: projectCustomRepositoryMock,
        },
      ],
      imports: [SerializationModule],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    describe('when no project is found', () => {
      it('should throw a NotFound exception', async () => {
        const noMatchingId = 155;
        projectCustomRepositoryMock.findOne.mockResolvedValue(undefined);
        await service.findOne(noMatchingId).catch((error) => {
          expect(error).toBeInstanceOf(NotFoundException);
          expect(error.response.message).toBe('Not Found');
        });
        expect.assertions(2);
      });
    });
  });
});
