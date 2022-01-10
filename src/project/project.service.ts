import { Injectable, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { DbException } from '../utils/exceptions/database.exception';
import { EntityMapperService } from '../utils/serialization/entity-mapper.service';
import { ProjectFindDto } from './dtos/project.find.dto';
import {
  ProjectInListDto,
  ProjectSingleDto,
  ProjectsResult,
} from './dtos/project.show.dto';
import { ProjectCustomRepository } from './project.repository';

@Injectable()
export class ProjectService {
  constructor(
    private readonly projectRepository: ProjectCustomRepository,
    private readonly entityMapper: EntityMapperService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ProjectService.name);
  }

  async findProjects(findOptions: ProjectFindDto): Promise<ProjectsResult> {
    this.logger.debug('Find matching project ids');
    const projectsResult = await this.projectRepository.getMatchingProjectIds(
      findOptions,
      {
        sortBy: findOptions.sortBy,
        inAscendingOrder: findOptions.inAscendingOrder,
      },
    );
    this.logger.debug('Map projects to dto');
    return {
      projects: this.entityMapper.mapArray(
        ProjectInListDto,
        projectsResult.projects,
      ),
      projectCount: projectsResult.projectCount,
      suggestedSearchTerms: projectsResult.suggestedSearchTerms,
    };
  }

  async findOne(id: number): Promise<ProjectSingleDto> {
    this.logger.debug(
      'Find project with matching ids and their related department, users, user institution and department institution',
    );
    const project = await this.projectRepository
      .findOne(id)
      .catch((err: Error) => {
        throw new DbException(err.message, err.stack);
      });

    this.logger.debug(`Project ${project?.id} found`);
    if (!project) throw new NotFoundException();

    this.logger.debug('Map project to dto');
    return this.entityMapper.mapValue(ProjectSingleDto, project);
  }
}
