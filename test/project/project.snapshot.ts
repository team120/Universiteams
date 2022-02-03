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
    interests: [
      {
        id: 3,
        name: 'Arduino',
      },
      {
        id: 2,
        name: 'IT Security',
      },
    ],
    enrollments: [
      {
        id: 2,
        role: 'Leader',
        user: {
          id: 2,
          name: 'Carlos',
          lastName: 'Villa',
          mail: 'user2@example.com',
        },
      },
    ],
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
    interests: [
      {
        id: 1,
        name: 'Data Science',
      },
      {
        id: 5,
        name: 'Crypto Currency',
      },
    ],
    enrollments: [
      {
        id: 3,
        role: 'Admin',
        user: {
          id: 2,
          name: 'Carlos',
          lastName: 'Villa',
          mail: 'user2@example.com',
        },
      },
      {
        id: 4,
        role: 'Leader',
        user: {
          id: 3,
          name: 'Marcos',
          lastName: 'Sanchez',
          mail: 'user3@example.com',
        },
      },
    ],
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
  interests: [
    {
      id: 3,
      name: 'Arduino',
    },
    {
      id: 2,
      name: 'IT Security',
    },
  ],
  enrollments: [
    {
      id: 1,
      role: 'Member',
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
    {
      id: 2,
      role: 'Leader',
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
  ],
};
