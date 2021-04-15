import { Injectable } from '@nestjs/common';
import { classToClass, plainToClass } from 'class-transformer';
import { EntityMapperService } from 'src/shared/entity-mapper/entity-mapper.service';
import { getRepository, Brackets } from 'typeorm';
import { ProjectFindDto } from './dtos/project.find.dto';
import { ProjectShowDto } from './dtos/project.show.dto';
import { Project } from './project.entity';

@Injectable()
export class ProjectService {
  constructor(private entityMapper: EntityMapperService) {}

  private sortBy = new Map([
    ['name', 'project.name'],
    ['department', 'department.name'],
    ['university', 'departmentUniversity.name'],
    ['creationDate', 'project.creationDate'],
    ['type', 'project.type'],
  ]);

  async findProjects(findOptions: ProjectFindDto): Promise<ProjectShowDto[]> {
    const selectedProjects = await this.getMatchingProjects(findOptions);
    const projectsMappedString = selectedProjects
      .map((project) => project.id)
      .join(', ');

    const query = getRepository(Project)
      .createQueryBuilder('project')
      .innerJoinAndSelect('project.enrolments', 'enrolment')
      .innerJoinAndSelect('enrolment.user', 'user')
      .leftJoinAndSelect('user.university', 'university')
      .leftJoinAndSelect('project.department', 'department')
      .leftJoinAndSelect('department.university', 'departmentUniversity')
      .where(`project.id IN (${projectsMappedString})`);

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

  private getMatchingProjects(findOptions: ProjectFindDto): Promise<Project[]> {
    const query = getRepository(Project)
      .createQueryBuilder('project')
      .innerJoinAndSelect('project.enrolments', 'enrolment')
      .innerJoinAndSelect('enrolment.user', 'user')
      .leftJoinAndSelect('user.university', 'userUniversity')
      .leftJoinAndSelect('project.department', 'department')
      .leftJoinAndSelect('department.university', 'departmentUniversity');

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
}
