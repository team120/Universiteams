import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { DbException } from 'src/exceptions/database.exception';
import { EntityMapperService } from 'src/serialization/entity-mapper/entity-mapper.service';
import { Brackets, Repository } from 'typeorm';
import { ProjectFindDto } from './dtos/project.find.dto';
import { ProjectShowDto } from './dtos/project.show.dto';
import { Project } from './project.entity';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly entityMapper: EntityMapperService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ProjectService.name);
  }

  private sortBy = new Map([
    ['name', 'project.name'],
    ['department', 'department.name'],
    ['university', 'departmentUniversity.name'],
    ['creationDate', 'project.creationDate'],
    ['type', 'project.type'],
  ]);

  async findProjects(findOptions: ProjectFindDto): Promise<ProjectShowDto[]> {
    this.logger.debug('Find matching project ids');
    const selectedProjectIds = await this.getMatchingProjects(findOptions);
    const projectIdsMappedString = selectedProjectIds
      .map((project) => project.id)
      .join(', ');

    const query = this.getProjectWithRelationsQuery().where(
      `project.id IN (${projectIdsMappedString})`,
    );

    if (findOptions.sortBy !== undefined) {
      const sortByProperty = this.sortBy.get(findOptions.sortBy);
      console.log(sortByProperty);
      console.log(findOptions.inAscendingOrder);
      if (sortByProperty !== undefined) {
        query.orderBy(
          sortByProperty,
          findOptions.inAscendingOrder === true ? 'ASC' : 'DESC',
        );
      }
    }

    const projects = await query.getMany();

    return this.entityMapper.mapArray(ProjectShowDto, projects);
  }

  async findOne(id: number): Promise<ProjectShowDto> {
    this.logger.debug('Find project with matching');
    const project = await this.getProjectWithRelationsQuery()
      .where('project.id = :projectId', { projectId: id })
      .getOne()
      .catch((err: Error) => {
        throw new DbException(err.message, err.stack);
      });

    this.logger.debug(`Project ${project?.id} found`);
    if (!project) throw new NotFoundException();

    this.logger.debug('Map project to dto');
    return this.entityMapper.mapValue(ProjectShowDto, project);
  }

  private getMatchingProjects(findOptions: ProjectFindDto): Promise<Project[]> {
    const query = this.getProjectWithRelationsQuery();

    if (findOptions.generalSearch !== undefined) {
      query.where(
        new Brackets((qb) => {
          qb.where('project.name like :name', {
            name: `%${findOptions.generalSearch}%`,
          }).orWhere('user.name like :username', {
            username: `%${findOptions.generalSearch}%`,
          });
        }),
      );
    }

    if (findOptions.universityId !== undefined) {
      query.andWhere(`userUniversity.id = :userUniversityId`, {
        userUniversityId: findOptions.universityId,
      });
    }
    if (findOptions.departmentId !== undefined) {
      query.andWhere('department.id = :departmentId', {
        departmentId: findOptions.departmentId,
      });
    }
    if (findOptions.type !== undefined) {
      query.andWhere('project.type = :type', { type: findOptions.type });
    }
    if (findOptions.isDown !== undefined) {
      query.andWhere('project.isDown = :isDown', {
        isDown: findOptions.isDown,
      });
    }
    if (findOptions.userId !== undefined) {
      query.andWhere('user.id = :userId', { userId: findOptions.userId });
    }
    if (findOptions.dateFrom !== undefined) {
      query.andWhere('project.creationDate >= :dateFrom', {
        dateFrom: findOptions.dateFrom.toISOString().split('T')[0],
      });
    }

    return query.select('project.id').getMany();
  }

  private getProjectWithRelationsQuery() {
    return this.projectRepository
      .createQueryBuilder('project')
      .innerJoinAndSelect('project.enrolments', 'enrolment')
      .innerJoinAndSelect('enrolment.user', 'user')
      .leftJoinAndSelect('user.university', 'university')
      .leftJoinAndSelect('project.department', 'department')
      .leftJoinAndSelect('department.university', 'departmentUniversity');
  }
}
