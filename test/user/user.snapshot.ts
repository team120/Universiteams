export const users = [
  {
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
        requestedType: null,
      },
    ],
    interests: [
      {
        id: 1,
        name: 'Data Science',
      },
      {
        id: 4,
        name: 'Business Intelligence',
      },
    ],
  },
  {
    id: 2,
    name: 'Carlos',
    lastName: 'Villa',
    mail: 'user2@example.com',
    userAffiliations: [
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
        requestedType: null,
      },
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
        requestedType: null,
      },
    ],
    interests: [
      {
        id: 2,
        name: 'IT Security',
      },
    ],
  },
  {
    id: 3,
    name: 'Marcos',
    lastName: 'Sanchez',
    mail: 'user3@example.com',
    userAffiliations: [
      {
        id: 5,
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
        requestedType: null,
      },
      {
        id: 4,
        researchDepartment: {
          id: 3,
          name: 'Ingeniería Química',
          abbreviation: 'IQ',
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
        requestedType: 'Professor',
      },
    ],
    interests: [],
  },
];
