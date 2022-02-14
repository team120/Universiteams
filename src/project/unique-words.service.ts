import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StopWords } from '../database/stop-words.entity';
import { UniqueWords } from './unique-words.entity';

@Injectable()
export class UniqueWordsService {
  constructor(
    @InjectRepository(UniqueWords)
    private readonly uniqueWordsRepo: Repository<UniqueWords>,
    @InjectRepository(StopWords)
    private readonly stopWordsRepo: Repository<StopWords>,
  ) {}

  private async matchWord(term: string) {
    const matchingStopWord: string | undefined = await this.stopWordsRepo
      .createQueryBuilder()
      .where('word_similarity(word, :term) > 0.75', {
        term: term,
      })
      // to avoid sql injections, since typeorm doesn't support prepared statements in order by clauses
      .orderBy(`word <-> format('%L', '${term}')`)
      .getOne()
      .then((stopWord) => stopWord?.word);

    if (matchingStopWord) return [''];

    return this.uniqueWordsRepo
      .createQueryBuilder()
      .where('word_similarity(word, :term) > 0', { term: term })
      .orderBy(`word <-> format('%L', '${term}')`)
      .limit(5)
      .getMany()
      .then((uniqueTerms) => uniqueTerms.map((uniqueTerm) => uniqueTerm?.word));
  }

  async getMatchingWords(searchTerms: string): Promise<string[]> {
    const isolatedTerms = searchTerms.split(' ');
    const termsWithMatches = await Promise.all(
      isolatedTerms.map((term) => this.matchWord(term)),
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
