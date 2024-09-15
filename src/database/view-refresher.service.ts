import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { SkipWhenTestingInterval } from '../utils/decorators/skip-when-testing-interval.decorator';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class ViewRefresherService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
    private logger: PinoLogger,
  ) {
    this.logger.setContext(ViewRefresherService.name);
  }

  @SkipWhenTestingInterval('search-index-project-refresher', 900000)
  refreshProjectFullTextSearchIndexMaterializedView() {
    this.logger.info('Refreshing project_search_index materialized view');
    this.dataSource
      .query('REFRESH MATERIALIZED VIEW CONCURRENTLY project_search_index')
      .catch((err) => {
        this.logger.error(
          'Error refreshing project_search_index materialized view',
          err,
        );
      });
  }

  @SkipWhenTestingInterval('search-index-user-refresher', 900000)
  refreshUserFullTextSearchIndexMaterializedView() {
    this.logger.info('Refreshing user_search_index materialized view');
    this.dataSource
      .query('REFRESH MATERIALIZED VIEW CONCURRENTLY user_search_index')
      .catch((err) => {
        this.logger.error(
          'Error refreshing user_search_index materialized view',
          err,
        );
      });
  }

  @SkipWhenTestingInterval('unique-words-refresher', 1000000)
  refreshUniqueWordsMaterializedView() {
    this.logger.info('Refreshing unique_words materialized view');
    this.dataSource
      .query('REFRESH MATERIALIZED VIEW unique_words')
      .catch((err) => {
        this.logger.error(
          'Error refreshing unique_words materialized view',
          err,
        );
      });
  }
}
