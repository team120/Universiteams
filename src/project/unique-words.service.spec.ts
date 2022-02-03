import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UniqueWordsService } from './unique-words.service';
import { UniqueWords } from './uniqueWords.entity';

describe('UniqueWordsService', () => {
  let service: UniqueWordsService;
  const uniqueWordsRepoMock = {
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UniqueWordsService,
        {
          provide: getRepositoryToken(UniqueWords),
          useValue: uniqueWordsRepoMock,
        },
      ],
    }).compile();

    service = module.get<UniqueWordsService>(UniqueWordsService);
  });

  afterEach(() => uniqueWordsRepoMock.createQueryBuilder.mockReset());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  const redefineGetManyResolvedValue = (value: Array<{ word: string }>) =>
    uniqueWordsRepoMock.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnValue({
        orderBy: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            getMany: jest.fn().mockResolvedValue(value),
          }),
        }),
      }),
    });

  describe('when one search term matches', () => {
    it('should return only one suggested term', async () => {
      redefineGetManyResolvedValue([{ word: 'unt' }]);
      await service.getMatchingWords('urt').then((terms) => {
        expect(terms).toEqual(['unt']);
      });
    });
  });

  describe('when two search term matches', () => {
    it('should return only two suggested terms', async () => {
      uniqueWordsRepoMock.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              getMany: jest
                .fn()
                .mockResolvedValueOnce([{ word: 'utn' }])
                .mockResolvedValueOnce([{ word: 'frro' }]),
            }),
          }),
        }),
      });
      await service.getMatchingWords('utq freo').then((terms) => {
        expect(terms).toEqual(['utn frro']);
      });
    });
  });

  describe('when the last search term does not match', () => {
    it('should return only two suggested term', async () => {
      uniqueWordsRepoMock.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              getMany: jest
                .fn()
                .mockResolvedValueOnce([{ word: 'utn' }])
                .mockResolvedValueOnce([{ word: 'frro' }])
                .mockResolvedValueOnce([{ word: '' }]),
            }),
          }),
        }),
      });
      await service.getMatchingWords('utq freo wqwwqwqe').then((terms) => {
        expect(terms).toEqual(['utn frro']);
      });
    });
  });

  describe('when the middle search term does not match', () => {
    it('should return only two suggested term', async () => {
      uniqueWordsRepoMock.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              getMany: jest
                .fn()
                .mockResolvedValueOnce([
                  { word: 'utn' },
                  { word: 'unt' },
                  { word: 'unr' },
                ])
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([
                  { word: 'isi' },
                  { word: 'iq' },
                  { word: 'ie' },
                ]),
            }),
          }),
        }),
      });
      await service.getMatchingWords('utq wqwwqwqe isi').then((terms) => {
        expect(terms[0]).toEqual('utn isi');
        expect(terms[1]).toEqual('unt iq');
        expect(terms[2]).toEqual('unr ie');
      });
    });
  });

  describe('when an alternative search term does not match, but there is some other matching term for that word', () => {
    it('should replace missing matching term with the previous non null one', async () => {
      uniqueWordsRepoMock.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              getMany: jest
                .fn()
                .mockResolvedValueOnce([
                  { word: 'utn' },
                  { word: 'unt' },
                  { word: 'unr' },
                ])
                .mockResolvedValueOnce([{ word: 'frro' }])
                .mockResolvedValueOnce([{ word: 'isi' }, { word: 'iq' }]),
            }),
          }),
        }),
      });
      await service.getMatchingWords('utq froo isi').then((terms) => {
        expect(terms[0]).toEqual('utn frro isi');
        expect(terms[1]).toEqual('unt frro iq');
        expect(terms[2]).toEqual('unr frro isi');
      });
    });
  });
});
