import { Injectable, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { EntityMapperService } from '../utils/serialization/entity-mapper.service';
import { ProjectFindDto } from './dtos/project.find.dto';
import { ProjectInListDto, ProjectSingleDto } from './dtos/project.show.dto';
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

  async findProjects(findOptions: ProjectFindDto): Promise<ProjectInListDto[]> {
    this.logger.debug('Find matching project ids');
    const selectedProjectIds = await this.projectRepository.getMatchingProjectIds(
      findOptions,
    );
    this.logger.debug(
      'Find projects with those ids and their related users, department, user departments and institution departments',
    );
    const projects = await this.projectRepository.findProjectsById(
      selectedProjectIds,
      {
        sortBy: findOptions.sortBy,
        inAscendingOrder: findOptions.inAscendingOrder,
      },
    );
    this.logger.debug('Map projects to dto');
    return this.entityMapper.mapArray(ProjectInListDto, projects);
  }

  async findOne(id: number): Promise<ProjectSingleDto> {
    this.logger.debug(
      'Find project with matching ids and their related department, users, user institution and department institution',
    );
    const project = await this.projectRepository.findOne(id);

    this.logger.debug(`Project ${project?.id} found`);
    if (!project) throw new NotFoundException();

    this.logger.debug('Map project to dto');
    return this.entityMapper.mapValue(ProjectSingleDto, project);
  }
}
