import { Department } from '../../../src/department/department.entity';
import { Enrollment } from '../../../src/enrollment/enrolment.entity';
import { Project, ProjectType } from '../../../src/project/project.entity';
import { University } from '../../../src/university/university.entity';
import { User } from '../../../src/user/user.entity';
import { MigrationInterface, getRepository } from 'typeorm';
import * as argon2 from 'argon2';
import { NotImplementedException } from '@nestjs/common';

export class SeedTestDb1590967789743 implements MigrationInterface {
  public async up(): Promise<void> {
    const usersRepo = getRepository(User);
    const universityRepo = getRepository(University);
    const projectRepo = getRepository(Project);
    const userToProjectsRepo = getRepository(Enrollment);
    const departmentRepo = getRepository(Department);

    const universities: University[] = [
      universityRepo.create({ name: 'UTN' }),
      universityRepo.create({ name: 'UNR' }),
    ];

    await universityRepo.save(universities);

    const departments: Department[] = [
      departmentRepo.create({
        name: 'Ingeniería en Sistemas',
        university: universities[0],
      }),
      departmentRepo.create({
        name: 'Ingeniería Civil',
        university: universities[0],
      }),
      departmentRepo.create({
        name: 'Ingeniería Química',
        university: universities[0],
      }),
      departmentRepo.create({
        name: universities[0].name,
        university: universities[0],
      }),
      departmentRepo.create({
        name: 'Ciencias Básicas',
        university: universities[1],
      }),
      departmentRepo.create({
        name: 'Ingeniería Electrónica',
        university: universities[1],
      }),
      departmentRepo.create({
        name: universities[1].name,
        university: universities[1],
      }),
    ];

    await departmentRepo.save(departments);

    const projects: Project[] = [
      projectRepo.create({
        name:
          'Desarrollo de un sistema para identificar geoposicionamiento en entorno de Internet de la Cosas (IoT)',
        type: ProjectType.Formal,
        department: departments[0],
        creationDate: '2020-03-16 14:13:02',
      }),
      projectRepo.create({
        name: 'University Projects Manager',
        type: ProjectType.Informal,
        department: departments[3],
        creationDate: '2021-03-16 14:13:02',
      }),
    ];

    await projectRepo.save(projects);

    const users: User[] = [
      usersRepo.create({
        mail: 'user1@example.com',
        isMailVerified: true,
        password: await argon2.hash('password1'),
        name: 'John',
        lastName: 'Doe',
        university: universities[0],
        professorId: 11444,
      }),
      usersRepo.create({
        mail: 'user2@example.com',
        isMailVerified: true,
        password: await argon2.hash('password2'),
        name: 'Afak',
        lastName: 'Ename',
        university: universities[0],
      }),
      usersRepo.create({
        mail: 'user3@example.com',
        isMailVerified: true,
        password: await argon2.hash('password3'),
        name: 'Nom',
        lastName: 'Eaning',
        university: universities[0],
        requestPosition: true,
      }),
    ];

    await usersRepo.save(users);

    const usersToProjects: Enrollment[] = [
      userToProjectsRepo.create({
        user: users[0],
        project: projects[0],
      }),
      userToProjectsRepo.create({
        user: users[1],
        project: projects[0],
      }),
      userToProjectsRepo.create({
        user: users[1],
        project: projects[1],
      }),
      userToProjectsRepo.create({
        user: users[2],
        project: projects[1],
      }),
    ];

    await userToProjectsRepo.save(usersToProjects);
  }

  public async down(): Promise<void> {
    throw new NotImplementedException();
  }
}
