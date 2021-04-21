export const users = [
  {
    id: 1,
    name: 'John',
    lastName: 'Doe',
    mail: 'user1@example.com',
    department: {
      id: 1,
      name: 'Ingeniería en Sistemas',
      university: {
        id: 1,
        name: 'UTN',
      },
    },
    requestPosition: false,
  },
  {
    id: 2,
    name: 'Afak',
    lastName: 'Ename',
    mail: 'user2@example.com',
    department: {
      id: 2,
      name: 'Ingeniería Civil',
      university: {
        id: 1,
        name: 'UTN',
      },
    },
    requestPosition: false,
  },
  {
    id: 3,
    name: 'Nom',
    lastName: 'Eaning',
    mail: 'user3@example.com',
    department: {
      id: 3,
      name: 'Ingeniería Química',
      university: {
        id: 1,
        name: 'UTN',
      },
    },
    requestPosition: true,
  },
];
