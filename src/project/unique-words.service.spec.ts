import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UniqueWordsService } from './unique-words.service';
import { UniqueWords } from './unique-words.entity';
import { StopWords } from '../database/stop-words.entity';

describe('UniqueWordsService', () => {
  let service: UniqueWordsService;
  const uniqueWordsRepoMock = {
    createQueryBuilder: jest.fn(),
  };
  const stopsWordsRepoMock = {
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
        {
          provide: getRepositoryToken(StopWords),
          useValue: stopsWordsRepoMock,
        },
      ],
    }).compile();

    service = module.get<UniqueWordsService>(UniqueWordsService);
  });

  afterEach(() => {
    uniqueWordsRepoMock.createQueryBuilder.mockReset();
    stopsWordsRepoMock.createQueryBuilder.mockReset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  const redefineGetOneStopWordsResolvedValue = (value: { word: string }) =>
    stopsWordsRepoMock.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnValue({
        orderBy: jest.fn().mockReturnValue({
          getOne: jest.fn().mockResolvedValue(value),
        }),
      }),
    });

  describe('when no search term is a matching stop word', () => {
    describe('one search term matches', () => {
      it('should return only one suggested term', async () => {
        redefineGetOneStopWordsResolvedValue({ word: undefined });
        uniqueWordsRepoMock.createQueryBuilder.mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                getMany: jest.fn().mockResolvedValue([{ word: 'unt' }]),
              }),
            }),
          }),
        });
        await service.getMatchingWords('urt').then((terms) => {
          expect(terms).toEqual(['unt']);
        });
      });
    });

    describe('two search term matches', () => {
      it('should return only two suggested terms', async () => {
        redefineGetOneStopWordsResolvedValue({ word: undefined });
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

    describe('the last search term does not match', () => {
      it('should return only two suggested term', async () => {
        redefineGetOneStopWordsResolvedValue({ word: undefined });
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

    describe('the middle search term does not match', () => {
      it('should return only two suggested term', async () => {
        redefineGetOneStopWordsResolvedValue({ word: undefined });
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

    describe('an alternative search term does not match, but there is some other matching term for that word', () => {
      it('should replace missing matching term with the previous non null one', async () => {
        redefineGetOneStopWordsResolvedValue({ word: undefined });
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
  describe('when the only search term is a matching stop word', () => {
    it('should return an array of a single empty string', async () => {
      redefineGetOneStopWordsResolvedValue({ word: 'de' });
      await service.getMatchingWords('de').then((terms) => {
        expect(terms).toEqual(['']);
        expect(uniqueWordsRepoMock.createQueryBuilder).toBeCalledTimes(0);
      });
    });
  });

  describe('when some search term is a matching stop word', () => {
    it('should return an array of suggested terms strings with every stop word removed', async () => {
      stopsWordsRepoMock.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockReturnValue({
            getOne: jest
              .fn()
              .mockResolvedValueOnce({ word: undefined })
              .mockResolvedValueOnce({ word: 'para' })
              .mockResolvedValueOnce({ word: undefined }),
          }),
        }),
      });
      uniqueWordsRepoMock.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              getMany: jest
                .fn()
                .mockResolvedValueOnce([
                  { word: 'testing' },
                  { word: 'trampas' },
                  { word: 'trello' },
                ])
                .mockResolvedValueOnce([
                  { word: 'empresas' },
                  { word: 'empalme' },
                  { word: 'encargues' },
                ])
                .mockResolvedValueOnce([
                  { word: 'empresas' },
                  { word: 'empalme' },
                  { word: 'encargues' },
                ]),
            }),
          }),
        }),
      });
      await service.getMatchingWords('teting para empesas').then((terms) => {
        expect(terms[0]).toEqual('testing empresas');
        expect(terms[1]).toEqual('trampas empalme');
        expect(terms[2]).toEqual('trello encargues');
        expect(uniqueWordsRepoMock.createQueryBuilder).toBeCalledTimes(2);
      });
    });
  });
});
