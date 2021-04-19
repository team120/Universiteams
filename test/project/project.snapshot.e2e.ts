export const projects = [
  {
    id: 1,
    name:
      'Desarrollo de un sistema para identificar geoposicionamiento en entorno de Internet de la Cosas (IoT)',
    type: 'Formal',
    isDown: false,
    creationDate: '2020-03-16T17:13:02.000Z',
    department: {
      id: 1,
      name: 'Ingeniería en Sistemas',
      university: {
        id: 1,
        name: 'UTN',
      },
    },
    users: [
      {
        id: 1,
        name: 'John',
        lastName: 'Doe',
        mail: 'user1@example.com',
        university: {
          id: 1,
          name: 'UTN',
        },
      },
      {
        id: 2,
        name: 'Afak',
        lastName: 'Ename',
        mail: 'user2@example.com',
        university: {
          id: 1,
          name: 'UTN',
        },
      },
    ],
  },
  {
    id: 2,
    name: 'University Projects Manager',
    type: 'Informal',
    isDown: false,
    creationDate: '2021-03-16T17:13:02.000Z',
    department: {
      id: 4,
      name: 'UTN',
      university: {
        id: 1,
        name: 'UTN',
      },
    },
    users: [
      {
        id: 2,
        name: 'Afak',
        lastName: 'Ename',
        mail: 'user2@example.com',
        university: {
          id: 1,
          name: 'UTN',
        },
      },
      {
        id: 3,
        name: 'Nom',
        lastName: 'Eaning',
        mail: 'user3@example.com',
        university: {
          id: 1,
          name: 'UTN',
        },
      },
    ],
  },
];
