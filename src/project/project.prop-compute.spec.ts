import { Test } from '@nestjs/testing';
import { CURRENT_DATE_SERVICE } from '../utils/current-date';
import { CurrentDateServiceMock } from '../utils/current-date.mock';
import { Project, ProjectType } from './project.entity';
import { ProjectPropCompute } from './project.prop-compute';

describe('Prop compute tests', () => {
  const currentDateServiceMock = new CurrentDateServiceMock('2022-01-01');
  let service: ProjectPropCompute;
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProjectPropCompute,
        { provide: CURRENT_DATE_SERVICE, useValue: currentDateServiceMock },
      ],
    }).compile();

    service = module.get<ProjectPropCompute>(ProjectPropCompute);
  });

  describe('addIsDown', () => {
    describe('when an undefined or null project is provided as an argument', () => {
      it.each([undefined, null])('should return undefined', (inputProject) => {
        const result = service.addIsDown(inputProject);

        expect(result).toBe(undefined);
      });
    });

    describe('when a project that lacks endDate is provided as an argument', () => {
      it.each([undefined, null])(
        'should return that project with isDown set to false',
        (endDate) => {
          const project: Project = {
            id: 8,
            name: 'Perfeccionamiento de un Datalogger para Medición de Vientos con fines Energéticos',
            type: ProjectType.Informal,
            userCount: 3,
            creationDate: '2018-01-05',
            endDate: endDate,
            researchDepartments: [],
            interests: [],
            enrollments: [],
            favorites: [],
            favoriteCount: 0,
            logicalDeleteDate: new Date(),
            language: 'spanish',
            web: '',
            referenceOnly: false,
          };

          const result = service.addIsDown(project);

          expect(result).toStrictEqual({ ...project, isDown: false });
        },
      );
    });

    describe('when the input project has an endDate that is less that current set date', () => {
      it('should return that project with isDown set to true', () => {
        const endDate = '2021-06-01';
        currentDateServiceMock.set('2022-01-01');
        const project: Project = {
          id: 8,
          name: 'Perfeccionamiento de un Datalogger para Medición de Vientos con fines Energéticos',
          type: ProjectType.Informal,
          userCount: 3,
          creationDate: '2018-01-05',
          endDate: endDate,
          researchDepartments: [],
          interests: [],
          enrollments: [],
          favorites: [],
          favoriteCount: 0,
          logicalDeleteDate: new Date(),
          language: 'spanish',
          web: '',
          referenceOnly: false,
        };

        const result = service.addIsDown(project);

        expect(result).toStrictEqual({ ...project, isDown: true });
      });
    });

    describe('when the input project has an endDate that is greater that current set date', () => {
      it('should return that project with isDown set to false', () => {
        const endDate = '2022-02-01';
        currentDateServiceMock.set('2022-01-01');
        const project: Project = {
          id: 8,
          name: 'Perfeccionamiento de un Datalogger para Medición de Vientos con fines Energéticos',
          type: ProjectType.Informal,
          userCount: 3,
          creationDate: '2018-01-05',
          endDate: endDate,
          researchDepartments: [],
          interests: [],
          enrollments: [],
          favorites: [],
          favoriteCount: 0,
          logicalDeleteDate: new Date(),
          language: 'spanish',
          web: '',
          referenceOnly: false,
        };

        const result = service.addIsDown(project);

        expect(result).toStrictEqual({ ...project, isDown: false });
      });
    });
  });
});
