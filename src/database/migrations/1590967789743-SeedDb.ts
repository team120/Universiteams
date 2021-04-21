import { Department } from '../../department/department.entity';
import { Enrollment } from '../../enrollment/enrolment.entity';
import { Project, ProjectType } from '../../project/project.entity';
import { University } from '../../university/university.entity';
import { User } from '../../user/user.entity';
import { MigrationInterface, getRepository } from 'typeorm';
import * as argon2 from 'argon2';
import { NotImplementedException } from '@nestjs/common';

export class SeedDb1590967789743 implements MigrationInterface {
  public async up(): Promise<void> {
    const usersRepo = getRepository(User);
    const universityRepo = getRepository(University);
    const projectRepo = getRepository(Project);
    const enrollmentsRepo = getRepository(Enrollment);
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
        name: 'Independiente',
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
        name: 'Independiente',
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
        department: departments[0],
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
        department: departments[0],
        professorId: 11444,
      }),
      usersRepo.create({
        mail: 'user2@example.com',
        isMailVerified: true,
        password: await argon2.hash('password2'),
        name: 'Afak',
        lastName: 'Ename',
        department: departments[1],
      }),
      usersRepo.create({
        mail: 'user3@example.com',
        isMailVerified: true,
        password: await argon2.hash('password3'),
        name: 'Nom',
        lastName: 'Eaning',
        department: departments[2],
        requestPosition: true,
      }),
    ];

    await usersRepo.save(users);

    const enrollments: Enrollment[] = [
      enrollmentsRepo.create({
        user: users[0],
        project: projects[0],
      }),
      enrollmentsRepo.create({
        user: users[1],
        project: projects[0],
      }),
      enrollmentsRepo.create({
        user: users[1],
        project: projects[1],
      }),
      enrollmentsRepo.create({
        user: users[2],
        project: projects[1],
      }),
    ];

    await enrollmentsRepo.save(enrollments);
  }

  public async down(): Promise<void> {
    throw new NotImplementedException();
  }
}
