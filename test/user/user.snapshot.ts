export const users = [
  {
    id: 1,
    name: 'Juan',
    lastName: 'Rizzo',
    mail: 'user1@example.com',
    userAffiliations: [
      {
        id: 3,
        department: {
          id: 2,
          name: 'Ingeniería Civil',
          university: {
            id: 1,
            name: 'UTN FRRo',
          },
        },
        currentType: 'Student',
        requestedType: null,
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
        department: {
          id: 6,
          name: 'Ingeniería Electrónica',
          university: {
            id: 2,
            name: 'UNR',
          },
        },
        currentType: 'Professor',
        requestedType: null,
      },
      {
        id: 1,
        department: {
          id: 1,
          name: 'Ingeniería en Sistemas',
          university: {
            id: 1,
            name: 'UTN FRRo',
          },
        },
        currentType: 'Professor',
        requestedType: null,
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
        department: {
          id: 6,
          name: 'Ingeniería Electrónica',
          university: {
            id: 2,
            name: 'UNR',
          },
        },
        currentType: 'Professor',
        requestedType: null,
      },
      {
        id: 4,
        department: {
          id: 3,
          name: 'Ingeniería Química',
          university: {
            id: 1,
            name: 'UTN FRRo',
          },
        },
        currentType: 'Student',
        requestedType: 'Professor',
      },
    ],
  },
];
