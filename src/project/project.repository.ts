import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { Brackets, Repository } from 'typeorm';
import { DbException } from '../utils/exceptions/database.exception';
import { ProjectFilters, ProjectSortAttributes } from './dtos/project.find.dto';
import { Project } from './project.entity';

@Injectable()
export class ProjectCustomRepository {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly logger: PinoLogger,
  ) {}

  private sortBy = new Map([
    ['name', 'project.name'],
    ['researchDepartment', 'researchDepartment.name'],
    ['institution', 'researchDepartmentInstitution.name'],
    ['creationDate', 'project.creationDate'],
    ['type', 'project.type'],
  ]);

  async findProjectsById(
    selectedProjectIds: Project[],
    sortAttributes: ProjectSortAttributes,
  ): Promise<Project[]> {
    const projectIdsMappedString = selectedProjectIds
      .map((project) => project.id)
      .join(', ');

    const query = this.getProjectWithRelationsQuery().where(
      `project.id IN (${projectIdsMappedString})`,
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
    const project = await this.getProjectWithRelationsQuery()
      .where('project.id = :projectId', { projectId: id })
      .getOne()
      .catch((err: Error) => {
        throw new DbException(err.message, err.stack);
      });
    return project;
  }

  async getMatchingProjectIds(filters: ProjectFilters): Promise<Project[]> {
    const query = this.getProjectWithRelationsQuery();

    if (filters.generalSearch) {
      query.where(
        new Brackets((qb) => {
          qb.where('project.name like :name', {
            name: `%${filters.generalSearch}%`,
          }).orWhere('user.name like :username', {
            username: `%${filters.generalSearch}%`,
          });
        }),
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

    return query.select('project.id').getMany();
  }

  private getProjectWithRelationsQuery() {
    return this.projectRepository
      .createQueryBuilder('project')
      .innerJoinAndSelect('project.enrollments', 'enrollment')
      .innerJoinAndSelect('enrollment.user', 'user')
      .leftJoinAndSelect('user.userAffiliations', 'userAffiliation')
      .leftJoinAndSelect(
        'userAffiliation.researchDepartment',
        'userResearchDepartment',
      )
      .leftJoinAndSelect(
        'userResearchDepartment.institution',
        'userInstitution',
      )
      .leftJoinAndSelect('project.researchDepartment', 'researchDepartment')
      .leftJoinAndSelect(
        'researchDepartment.institution',
        'researchDepartmentInstitution',
      )
      .leftJoinAndSelect('project.interests', 'interest');
  }
}
