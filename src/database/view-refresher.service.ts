import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { Connection } from 'typeorm';
import { SkipWhenTestingInterval } from '../utils/decorators/skip-when-testing-interval.decorator';

@Injectable()
export class ViewRefresherService {
  constructor(
    @InjectConnection() private connection: Connection,
    private logger: PinoLogger,
  ) {
    this.logger.setContext(ViewRefresherService.name);
  }

  @SkipWhenTestingInterval('search-index-refresher', 900000)
  refreshFullTextSearchIndexMaterializedView() {
    this.logger.info('Refreshing project_search_index materialized view');
    this.connection
      .query('REFRESH MATERIALIZED VIEW CONCURRENTLY project_search_index')
      .catch((err) => {
        this.logger.error(
          'Error refreshing project_search_index materialized view',
          err,
        );
      });
  }

  @SkipWhenTestingInterval('unique-words-refresher', 1000000)
  refreshUniqueWordsMaterializedView() {
    this.logger.info('Refreshing unique_words materialized view');
    this.connection
      .query('REFRESH MATERIALIZED VIEW unique_words')
      .catch((err) => {
        this.logger.error(
          'Error refreshing unique_words materialized view',
          err,
        );
      });
  }
}
