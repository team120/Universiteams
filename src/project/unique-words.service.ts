import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UniqueWords } from './uniqueWords.entity';

@Injectable()
export class UniqueWordsService {
  constructor(
    @InjectRepository(UniqueWords)
    private readonly uniqueWordsRepository: Repository<UniqueWords>,
  ) {}

  async getMatchingWords(searchTerms: string): Promise<string[]> {
    const isolatedTerms = searchTerms.split(' ');
    const termsWithMatches = await Promise.all(
      isolatedTerms.map((term) =>
        this.uniqueWordsRepository
          .createQueryBuilder()
          .where(`similarity(word, :term) > 0`, { term: term })
          // to avoid sql injections, since typeorm doesn't support prepared statements in order by clauses
          .orderBy(`word <-> format('%L', '${term}')`)
          .limit(5)
          .getMany()
          .then((uniqueTerms) =>
            uniqueTerms.map((uniqueTerm) => uniqueTerm.word),
          ),
      ),
    );
    return termsWithMatches.reduce((joinedMatches, termWithMatches) => {
      const nonNullReplaceMatchingTerm = termWithMatches.filter(
        (t) => t !== undefined,
      )[0];
      return joinedMatches.map((joinedTerm, i) =>
        termWithMatches[i] || nonNullReplaceMatchingTerm
          ? joinedTerm.concat(
              ` ${termWithMatches[i] ?? nonNullReplaceMatchingTerm}`,
            )
          : joinedTerm.concat(''),
      );
    });
  }
}
