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
          institution: {
            id: 1,
            name: 'UTN FRRo',
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
        projectRefsCounter: 1,
        userRefsCounter: 4,
        verified: true,
      },
      {
        id: 4,
        name: 'Business Intelligence',
        projectRefsCounter: 2,
        userRefsCounter: 0,
        verified: true,
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
          institution: {
            id: 2,
            name: 'UNR',
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
          institution: {
            id: 1,
            name: 'UTN FRRo',
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
        projectRefsCounter: 0,
        userRefsCounter: 3,
        verified: true,
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
          institution: {
            id: 2,
            name: 'UNR',
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
          institution: {
            id: 1,
            name: 'UTN FRRo',
          },
        },
        currentType: 'Student',
        requestedType: 'Professor',
      },
    ],
    interests: [],
  },
];
