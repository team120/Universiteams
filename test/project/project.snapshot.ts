export const projects = [
  {
    id: 1,
    name: 'Desarrollo de un sistema para identificar geoposicionamiento en entorno de Internet de la Cosas (IoT)',
    type: 'Formal',
    isDown: false,
    userCount: 2,
    creationDate: '2020-03-16T00:00:00.000Z',
    researchDepartment: {
      id: 1,
      name: 'Ingeniería en Sistemas',
      abbreviation: 'ISI',
      facility: {
        id: 1,
        name: 'Regional Rosario',
        abbreviation: 'FRRo',
        institution: {
          id: 1,
          name: 'Universidad Tecnológica Nacional',
          abbreviation: 'UTN',
        },
      },
    },
  },
  {
    id: 2,
    name: 'Universiteams',
    type: 'Informal',
    isDown: false,
    userCount: 2,
    creationDate: '2021-03-16T00:00:00.000Z',
    researchDepartment: {
      id: 1,
      name: 'Ingeniería en Sistemas',
      abbreviation: 'ISI',
      facility: {
        id: 1,
        name: 'Regional Rosario',
        abbreviation: 'FRRo',
        institution: {
          id: 1,
          name: 'Universidad Tecnológica Nacional',
          abbreviation: 'UTN',
        },
      },
    },
  },
];

export const projectGeolocationWithExtendedDta = {
  id: 1,
  name: 'Desarrollo de un sistema para identificar geoposicionamiento en entorno de Internet de la Cosas (IoT)',
  type: 'Formal',
  isDown: false,
  userCount: 2,
  creationDate: '2020-03-16T00:00:00.000Z',
  researchDepartment: {
    id: 1,
    name: 'Ingeniería en Sistemas',
    abbreviation: 'ISI',
    facility: {
      id: 1,
      name: 'Regional Rosario',
      abbreviation: 'FRRo',
      institution: {
        id: 1,
        name: 'Universidad Tecnológica Nacional',
        abbreviation: 'UTN',
      },
    },
  },
  enrollments: [
    {
      id: 2,
      user: {
        id: 2,
        name: 'Carlos',
        lastName: 'Villa',
        mail: 'user2@example.com',
        userAffiliations: [
          {
            id: 1,
            researchDepartment: {
              id: 1,
              name: 'Ingeniería en Sistemas',
              abbreviation: 'ISI',
              facility: {
                id: 1,
                name: 'Regional Rosario',
                abbreviation: 'FRRo',
                institution: {
                  id: 1,
                  name: 'Universidad Tecnológica Nacional',
                  abbreviation: 'UTN',
                },
              },
            },
            currentType: 'Professor',
          },
          {
            id: 2,
            researchDepartment: {
              id: 6,
              name: 'Ingeniería Electrónica',
              abbreviation: 'IE',
              facility: {
                id: 2,
                name: 'Facultad de Ciencias Exactas, Ingeniería y Agrimensura',
                abbreviation: 'FCEIA',
                institution: {
                  id: 2,
                  name: 'Universidad Nacional de Rosario',
                  abbreviation: 'UNR',
                },
              },
            },
            currentType: 'Professor',
          },
        ],
      },
    },
    {
      id: 1,
      user: {
        id: 1,
        name: 'Juan',
        lastName: 'Rizzo',
        mail: 'user1@example.com',
        userAffiliations: [
          {
            id: 3,
            researchDepartment: {
              id: 2,
              name: 'Ingeniería Civil',
              abbreviation: 'IC',
              facility: {
                id: 1,
                name: 'Regional Rosario',
                abbreviation: 'FRRo',
                institution: {
                  id: 1,
                  name: 'Universidad Tecnológica Nacional',
                  abbreviation: 'UTN',
                },
              },
            },
            currentType: 'Student',
          },
        ],
      },
    },
  ],
  interests: [
    {
      id: 2,
      name: 'IT Security',
    },
    {
      id: 3,
      name: 'Arduino',
    },
  ],
};
