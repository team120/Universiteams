import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';
import { DbException } from '../utils/exceptions/database.exception';
import { ProjectFilters, ProjectSortAttributes } from './dtos/project.find.dto';
import { Project } from './project.entity';
import { UniqueWords } from './uniqueWords.entity';

@Injectable()
export class QueryCreator {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(UniqueWords)
    private readonly uniqueWordsRepository: Repository<UniqueWords>,
  ) {}

  getMatchingWords(searchTerms: string): Promise<string[]> {
    const isolatedTerms = searchTerms.split(' ');
    return Promise.all(
      isolatedTerms.map((term) =>
        this.uniqueWordsRepository
          .createQueryBuilder()
          .where(`similarity(word, :term) > 0`, { term: term })
          // to avoid sql injections, since typeorm doesn't support prepared statements in order by clauses
          .orderBy(`format('%s <-> %L', 'word', '${term}')`)
          .limit(5)
          .getMany()
          .then((uniqueTerms) =>
            uniqueTerms.map((uniqueTerm) => uniqueTerm.word),
          ),
      ),
    ).then((termsWithMatchs) =>
      termsWithMatchs.reduce((joinedMatchs, termWithMatchs) =>
        joinedMatchs.map((joinedTerm, i) =>
          joinedTerm.concat(
            ` ${
              termWithMatchs[i] ??
              termWithMatchs.filter((t) => t !== undefined)[0] ??
              ''
            }`,
          ),
        ),
      ),
    );
  }

  getProjectWithRelationsQuery(): SelectQueryBuilder<Project> {
    return this.projectRepository
      .createQueryBuilder('project')
      .innerJoin('project_search_index', 'p_index', 'p_index.id = project.id')
      .innerJoinAndSelect('project.enrollments', 'enrollment')
      .innerJoinAndSelect('enrollment.user', 'user')
      .leftJoinAndSelect('user.userAffiliations', 'userAffiliation')
      .leftJoinAndSelect(
        'userAffiliation.researchDepartment',
        'userResearchDepartment',
      )
      .leftJoinAndSelect('userResearchDepartment.facility', 'userFacility')
      .leftJoinAndSelect('userFacility.institution', 'userInstitution')
      .leftJoinAndSelect('project.researchDepartment', 'researchDepartment')
      .leftJoinAndSelect(
        'researchDepartment.facility',
        'researchDepartmentFacility',
      )
      .leftJoinAndSelect(
        'researchDepartmentFacility.institution',
        'researchDepartmentInstitution',
      );
  }
}

@Injectable()
export class ProjectCustomRepository {
  constructor(
    private readonly logger: PinoLogger,
    private readonly queryCreator: QueryCreator,
  ) {}

  private sortBy = new Map([
    ['name', 'project.name'],
    ['researchDepartment', 'researchDepartment.name'],
    ['facility', 'researchDepartmentFacility.name'],
    ['creationDate', 'project.creationDate'],
    ['type', 'project.type'],
  ]);

  async findProjectsById(
    selectedProjectIds: Array<{ id: number }>,
    sortAttributes: ProjectSortAttributes,
  ): Promise<Project[]> {
    const projectIdsMappedString = selectedProjectIds
      .map((project) => project.id)
      .join(', ');

    const query = this.queryCreator
      .getProjectWithRelationsQuery()
      .where(
        `project.id IN (${
          projectIdsMappedString == '' ? null : projectIdsMappedString
        })`,
      );

    if (sortAttributes.sortBy) {
      const sortByProperty = this.sortBy.get(sortAttributes.sortBy);
      this.logger.debug(
        `Sort by ${sortByProperty} in ${
          sortAttributes.inAscendingOrder ? 'ascending' : 'descending'
        } order`,
      );
      if (sortByProperty) {
        query.orderBy(
          sortByProperty,
          sortAttributes.inAscendingOrder === true ? 'ASC' : 'DESC',
        );
      }
    }

    return query.getMany();
  }

  async findOne(id: number): Promise<Project> {
    const project = await this.queryCreator
      .getProjectWithRelationsQuery()
      .leftJoinAndSelect('project.interests', 'interests')
      .where('project.id = :projectId', { projectId: id })
      .getOne()
      .catch((err: Error) => {
        throw new DbException(err.message, err.stack);
      });

    this.logger.debug(project);
    return project;
  }

  async getMatchingProjectIds(
    filters: ProjectFilters,
  ): Promise<Array<{ id: number }>> {
    const query = this.queryCreator.getProjectWithRelationsQuery();

    if (filters.generalSearch) {
      query.where(
        `p_index.document_with_weights @@ plainto_tsquery(:generalSearch)`,
        {
          generalSearch: filters.generalSearch,
        },
      );
    }

    if (filters.institutionId) {
      query.andWhere(`userInstitution.id = :userInstitutionId`, {
        userInstitutionId: filters.institutionId,
      });
    }
    if (filters.researchDepartmentId) {
      query.andWhere('researchDepartment.id = :researchDepartmentId', {
        researchDepartmentId: filters.researchDepartmentId,
      });
    }
    if (filters.type) {
      query.andWhere('project.type = :type', { type: filters.type });
    }
    if (filters.isDown) {
      query.andWhere('project.isDown = :isDown', {
        isDown: filters.isDown,
      });
    }
    if (filters.userId) {
      query.andWhere('user.id = :userId', { userId: filters.userId });
    }
    if (filters.dateFrom) {
      query.andWhere('project.creationDate >= :dateFrom', {
        dateFrom: filters.dateFrom.toISOString().split('T')[0],
      });
    }

    const projectCount = await query.getCount();
    if (projectCount == 0) {
      const matchingWords = await this.queryCreator.getMatchingWords(
        filters.generalSearch,
      );
      this.logger.debug(matchingWords);
      if (filters.generalSearch) {
        return this.queryCreator
          .getProjectWithRelationsQuery()
          .where(
            `p_index.document_with_weights @@ plainto_tsquery(:generalSearch)`,
            {
              generalSearch: matchingWords,
            },
          )
          .getMany();
      }
    }

    return query.select('project.id').getMany();
  }
}
