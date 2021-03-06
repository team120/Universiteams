export const users = [
  {
    id: 1,
    firstName: 'Juan',
    lastName: 'Rizzo',
    email: 'user1@example.com',
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
        id: 4,
        name: 'Data Science',
      },
      {
        id: 7,
        name: 'Business Intelligence',
      },
    ],
  },
  {
    id: 2,
    firstName: 'Camila',
    lastName: 'Villa',
    email: 'user2@example.com',
    userAffiliations: [
      {
        id: 3,
        researchDepartment: {
          id: 15,
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
        id: 1,
        name: 'Backend Development',
      },
      {
        id: 5,
        name: 'IT Security',
      },
      {
        id: 19,
        name: 'Optimización (matemática)',
      },
      {
        id: 11,
        name: 'Medio ambiente',
      },
    ],
  },
  {
    id: 4,
    firstName: 'Aldo Jose',
    lastName: 'Fanaro',
    email: 'user4@example.com',
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
        id: 9,
        name: 'Edtech',
      },
    ],
  },
  {
    id: 5,
    firstName: 'Julia Sol',
    lastName: 'Benia',
    email: 'user5@example.com',
    userAffiliations: [
      {
        id: 7,
        researchDepartment: {
          id: 7,
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
        currentType: 'Researcher',
      },
    ],
    interests: [
      {
        id: 10,
        name: 'Ingeniería de procesos y de productos',
      },
    ],
  },
  {
    id: 6,
    firstName: 'Sebastian Fabricio',
    lastName: 'Muso',
    email: 'user6@example.com',
    userAffiliations: [
      {
        id: 9,
        researchDepartment: {
          id: 15,
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
        id: 8,
        researchDepartment: {
          id: 7,
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
        currentType: 'Researcher',
      },
    ],
    interests: [
      {
        id: 11,
        name: 'Medio ambiente',
      },
      {
        id: 12,
        name: 'Desarrollo sustentable',
      },
    ],
  },
  {
    id: 7,
    firstName: 'Marcela Camila',
    lastName: 'Chiavoni',
    email: 'user7@example.com',
    userAffiliations: [
      {
        id: 11,
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
        currentType: 'Professor',
      },
      {
        id: 10,
        researchDepartment: {
          id: 8,
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
        currentType: 'Researcher',
      },
    ],
    interests: [
      {
        id: 13,
        name: 'Tecnología de los alimentos',
      },
    ],
  },
  {
    id: 8,
    firstName: 'Rosa',
    lastName: 'Martinez',
    email: 'user8@example.com',
    userAffiliations: [
      {
        id: 13,
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
        currentType: 'Professor',
      },
      {
        id: 12,
        researchDepartment: {
          id: 8,
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
        currentType: 'Researcher',
      },
    ],
    interests: [
      {
        id: 13,
        name: 'Tecnología de los alimentos',
      },
    ],
  },
  {
    id: 9,
    firstName: 'Pablo',
    lastName: 'Bernal',
    email: 'user9@example.com',
    userAffiliations: [
      {
        id: 15,
        researchDepartment: {
          id: 14,
          name: 'Ingeniería Electrica',
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
        id: 14,
        researchDepartment: {
          id: 9,
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
        currentType: 'Researcher',
      },
    ],
    interests: [
      {
        id: 14,
        name: 'Energía',
      },
      {
        id: 11,
        name: 'Medio ambiente',
      },
    ],
  },
  {
    id: 10,
    firstName: 'Nicola',
    lastName: 'Scania',
    email: 'user10@example.com',
    userAffiliations: [
      {
        id: 16,
        researchDepartment: {
          id: 7,
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
        currentType: 'Researcher',
      },
    ],
    interests: [
      {
        id: 10,
        name: 'Ingeniería de procesos y de productos',
      },
    ],
  },
  {
    id: 11,
    firstName: 'Juan Luis',
    lastName: 'Alba',
    email: 'user11@example.com',
    userAffiliations: [
      {
        id: 18,
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
      {
        id: 17,
        researchDepartment: {
          id: 10,
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
        currentType: 'Researcher',
      },
    ],
    interests: [
      {
        id: 9,
        name: 'Edtech',
      },
    ],
  },
  {
    id: 12,
    firstName: 'Edgardo Joaquin',
    lastName: 'Feder',
    email: 'user12@example.com',
    userAffiliations: [
      {
        id: 20,
        researchDepartment: {
          id: 6,
          name: 'Ingeniería Mecánica',
          abbreviation: 'IM',
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
        id: 19,
        researchDepartment: {
          id: 11,
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
        currentType: 'Researcher',
      },
    ],
    interests: [
      {
        id: 11,
        name: 'Medio ambiente',
      },
      {
        id: 18,
        name: 'Contingencias',
      },
      {
        id: 12,
        name: 'Desarrollo sustentable',
      },
    ],
  },
  {
    id: 13,
    firstName: 'Silvia Elene',
    lastName: 'Denaris',
    email: 'user13@example.com',
    userAffiliations: [
      {
        id: 22,
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
      {
        id: 21,
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
        id: 16,
        name: 'Sistemas de información e informática',
      },
    ],
  },
  {
    id: 14,
    firstName: 'Mario',
    lastName: 'Obregon',
    email: 'user14@example.com',
    userAffiliations: [
      {
        id: 23,
        researchDepartment: {
          id: 16,
          name: 'Ingeniería Mecánica',
          abbreviation: 'IM',
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
    interests: [
      {
        id: 6,
        name: 'Arduino',
      },
      {
        id: 19,
        name: 'Optimización (matemática)',
      },
      {
        id: 12,
        name: 'Desarrollo sustentable',
      },
    ],
  },
  {
    id: 15,
    firstName: 'Alessandro',
    lastName: 'Troilo',
    email: 'user15@example.com',
    userAffiliations: [
      {
        id: 24,
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
    interests: [
      {
        id: 4,
        name: 'Data Science',
      },
      {
        id: 11,
        name: 'Medio ambiente',
      },
    ],
  },
  {
    id: 16,
    firstName: 'Lucia',
    lastName: 'Brignoni',
    email: 'user16@example.com',
    userAffiliations: [
      {
        id: 25,
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
        currentType: 'Student',
      },
    ],
    interests: [
      {
        id: 1,
        name: 'Backend Development',
      },
      {
        id: 2,
        name: 'Frontend Development',
      },
    ],
  },
  {
    id: 17,
    firstName: 'Juan',
    lastName: 'Dellepiane',
    email: 'user17@example.com',
    userAffiliations: [
      {
        id: 26,
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
        currentType: 'Student',
      },
    ],
    interests: [
      {
        id: 9,
        name: 'Edtech',
      },
      {
        id: 4,
        name: 'Data Science',
      },
      {
        id: 1,
        name: 'Backend Development',
      },
    ],
  },
  {
    id: 18,
    firstName: 'Hernan Juan Cruz',
    lastName: 'Lizcovich',
    email: 'user18@example.com',
    userAffiliations: [
      {
        id: 27,
        researchDepartment: {
          id: 6,
          name: 'Ingeniería Mecánica',
          abbreviation: 'IM',
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
        id: 6,
        name: 'Arduino',
      },
      {
        id: 12,
        name: 'Desarrollo sustentable',
      },
    ],
  },
  {
    id: 19,
    firstName: 'Pablo',
    lastName: 'Alcazar',
    email: 'user19@example.com',
    userAffiliations: [
      {
        id: 28,
        researchDepartment: {
          id: 14,
          name: 'Ingeniería Electrica',
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
        currentType: 'Student',
      },
    ],
    interests: [
      {
        id: 14,
        name: 'Energía',
      },
      {
        id: 11,
        name: 'Medio ambiente',
      },
    ],
  },
  {
    id: 20,
    firstName: 'Inhof',
    lastName: 'Camila',
    email: 'user20@example.com',
    userAffiliations: [
      {
        id: 29,
        researchDepartment: {
          id: 14,
          name: 'Ingeniería Electrica',
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
        currentType: 'Student',
      },
    ],
    interests: [
      {
        id: 14,
        name: 'Energía',
      },
      {
        id: 18,
        name: 'Contingencias',
      },
    ],
  },
  {
    id: 3,
    firstName: 'Marcos',
    lastName: 'Sanchez',
    email: 'user3@example.com',
    userAffiliations: [
      {
        id: 5,
        researchDepartment: {
          id: 15,
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
