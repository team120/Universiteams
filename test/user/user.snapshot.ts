export const users = [
  {
    id: 1,
    name: 'Juan',
    lastName: 'Rizzo',
    mail: 'user1@example.com',
    userAffiliations: [
      {
        id: 1,
        researchDepartment: {
          id: 3,
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
        id: 3,
        researchDepartment: {
          id: 12,
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
      {
        id: 2,
        researchDepartment: {
          id: 2,
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
    ],
    interests: [
      {
        id: 2,
        name: 'IT Security',
      },
    ],
  },
  {
    id: 4,
    name: 'Aldo Jose',
    lastName: 'Fanaro',
    mail: 'user4@example.com',
    userAffiliations: [
      {
        id: 6,
        researchDepartment: {
          id: 1,
          name: 'Ciencias Básicas',
          abbreviation: 'CB',
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
    ],
    interests: [
      {
        id: 6,
        name: 'Edtech',
      },
    ],
  },
  {
    id: 5,
    name: 'Julia Sol',
    lastName: 'Benia',
    mail: 'user5@example.com',
    userAffiliations: [
      {
        id: 7,
        researchDepartment: {
          id: 5,
          name: 'Centro de Aplicaciones Informáticas y Modelado en Ingeniería',
          abbreviation: 'CAIMI',
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
    ],
    interests: [
      {
        id: 7,
        name: 'Ingeniería de procesos y de productos',
      },
    ],
  },
  {
    id: 6,
    name: 'Sebastian Fabricio',
    lastName: 'Muso',
    mail: 'user6@example.com',
    userAffiliations: [
      {
        id: 8,
        researchDepartment: {
          id: 5,
          name: 'Centro de Aplicaciones Informáticas y Modelado en Ingeniería',
          abbreviation: 'CAIMI',
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
    ],
    interests: [
      {
        id: 8,
        name: 'Medio ambiente',
      },
      {
        id: 9,
        name: 'Desarrollo sustentable',
      },
    ],
  },
  {
    id: 7,
    name: 'Marcela Camila',
    lastName: 'Chiavoni',
    mail: 'user7@example.com',
    userAffiliations: [
      {
        id: 9,
        researchDepartment: {
          id: 6,
          name: 'Centro de Investigación y Desarrollo en Tecnología de Alimentos',
          abbreviation: 'CIDTA',
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
    ],
    interests: [
      {
        id: 10,
        name: 'Tecnología de los alimentos',
      },
    ],
  },
  {
    id: 8,
    name: 'Rosa',
    lastName: 'Martinez',
    mail: 'user8@example.com',
    userAffiliations: [
      {
        id: 10,
        researchDepartment: {
          id: 6,
          name: 'Centro de Investigación y Desarrollo en Tecnología de Alimentos',
          abbreviation: 'CIDTA',
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
    ],
    interests: [
      {
        id: 10,
        name: 'Tecnología de los alimentos',
      },
    ],
  },
  {
    id: 9,
    name: 'Pablo',
    lastName: 'Bernal',
    mail: 'user9@example.com',
    userAffiliations: [
      {
        id: 11,
        researchDepartment: {
          id: 7,
          name: 'Observatorio de Energía y Sustentabilidad',
          abbreviation: 'OES',
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
    ],
    interests: [
      {
        id: 11,
        name: 'Energia',
      },
    ],
  },
  {
    id: 10,
    name: 'Nicola',
    lastName: 'Scania',
    mail: 'user10@example.com',
    userAffiliations: [
      {
        id: 12,
        researchDepartment: {
          id: 5,
          name: 'Centro de Aplicaciones Informáticas y Modelado en Ingeniería',
          abbreviation: 'CAIMI',
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
    ],
    interests: [
      {
        id: 7,
        name: 'Ingeniería de procesos y de productos',
      },
    ],
  },
  {
    id: 11,
    name: 'Juan Luis',
    lastName: 'Alba',
    mail: 'user11@example.com',
    userAffiliations: [
      {
        id: 13,
        researchDepartment: {
          id: 8,
          name: 'Centro de Investigación y Desarrollo en Tecnologías Especiales',
          abbreviation: 'CEDITE',
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
    ],
    interests: [
      {
        id: 6,
        name: 'Edtech',
      },
    ],
  },
  {
    id: 12,
    name: 'Edgardo Joaquin',
    lastName: 'Feder',
    mail: 'user12@example.com',
    userAffiliations: [
      {
        id: 14,
        researchDepartment: {
          id: 9,
          name: 'Grupo de Estudios Sobre Energía',
          abbreviation: 'GESE',
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
    ],
    interests: [
      {
        id: 8,
        name: 'Medio ambiente',
      },
      {
        id: 15,
        name: 'Contingencias',
      },
      {
        id: 9,
        name: 'Desarrollo sustentable',
      },
    ],
  },
  {
    id: 13,
    name: 'Roberta Roma',
    lastName: 'Marconi',
    mail: 'user13@example.com',
    userAffiliations: [
      {
        id: 15,
        researchDepartment: {
          id: 2,
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
    ],
    interests: [
      {
        id: 6,
        name: 'Edtech',
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
          id: 12,
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
      {
        id: 4,
        researchDepartment: {
          id: 4,
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
      },
    ],
    interests: [],
  },
];
