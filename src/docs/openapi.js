const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const json = (schema) => ({ content: { 'application/json': { schema } } });
const ok = (description, schema) => ({ description, ...json(schema) });
const err = (name) => ({ $ref: `#/components/responses/${name}` });

const idParam = (description) => ({
  name: 'id',
  in: 'path',
  required: true,
  description,
  schema: { type: 'integer', minimum: 1 },
});

const queryParam = (name, schema, description) => ({ name, in: 'query', required: false, schema, description });

module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'Room Booking API',
    version: '1.0.0',
    description: 'Rezerwacja sal: budynki, sale, rezerwacje, uwierzytelnianie JWT.',
  },
  servers: [{ url: '/' }],
  security: [{ bearerAuth: [] }],
  tags: [{ name: 'Auth' }, { name: 'Buildings' }, { name: 'Rooms' }, { name: 'Reservations' }],

  paths: {
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Rejestracja nowego użytkownika (zawsze rola USER)',
        security: [],
        requestBody: { required: true, ...json(ref('RegisterRequest')) },
        responses: {
          201: ok('Utworzony użytkownik', ref('User')),
          400: err('BadRequest'),
          409: err('Conflict'),
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Logowanie - zwraca token JWT',
        security: [],
        requestBody: { required: true, ...json(ref('LoginRequest')) },
        responses: {
          200: ok('Token dostępowy', ref('LoginResponse')),
          400: err('BadRequest'),
          401: err('Unauthorized'),
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Dane zalogowanego użytkownika',
        responses: {
          200: ok('Zalogowany użytkownik', ref('User')),
          401: err('Unauthorized'),
          404: err('NotFound'),
        },
      },
    },

    '/api/buildings': {
      get: {
        tags: ['Buildings'],
        summary: 'Lista budynków',
        responses: {
          200: ok('Lista budynków', { type: 'array', items: ref('Building') }),
          401: err('Unauthorized'),
        },
      },
      post: {
        tags: ['Buildings'],
        summary: 'Dodanie budynku (ADMIN)',
        requestBody: { required: true, ...json(ref('CreateBuildingRequest')) },
        responses: {
          201: ok('Utworzony budynek', ref('Building')),
          400: err('BadRequest'),
          401: err('Unauthorized'),
          403: err('Forbidden'),
          409: err('Conflict'),
        },
      },
    },
    '/api/buildings/{id}': {
      get: {
        tags: ['Buildings'],
        summary: 'Szczegóły budynku',
        parameters: [idParam('ID budynku')],
        responses: {
          200: ok('Budynek', ref('Building')),
          400: err('BadRequest'),
          401: err('Unauthorized'),
          404: err('NotFound'),
        },
      },
    },
    '/api/buildings/{id}/rooms': {
      get: {
        tags: ['Buildings'],
        summary: 'Sale w budynku',
        parameters: [idParam('ID budynku')],
        responses: {
          200: ok('Lista sal', { type: 'array', items: ref('Room') }),
          400: err('BadRequest'),
          401: err('Unauthorized'),
          404: err('NotFound'),
        },
      },
    },

    '/api/rooms': {
      get: {
        tags: ['Rooms'],
        summary: 'Lista sal',
        responses: {
          200: ok('Lista sal', { type: 'array', items: ref('Room') }),
          401: err('Unauthorized'),
        },
      },
      post: {
        tags: ['Rooms'],
        summary: 'Dodanie sali (ADMIN)',
        requestBody: { required: true, ...json(ref('CreateRoomRequest')) },
        responses: {
          201: ok('Utworzona sala', ref('Room')),
          400: err('BadRequest'),
          401: err('Unauthorized'),
          403: err('Forbidden'),
          404: err('NotFound'),
          409: err('Conflict'),
        },
      },
    },
    '/api/rooms/{id}': {
      get: {
        tags: ['Rooms'],
        summary: 'Szczegóły sali',
        parameters: [idParam('ID sali')],
        responses: {
          200: ok('Sala', ref('RoomDetail')),
          400: err('BadRequest'),
          401: err('Unauthorized'),
          404: err('NotFound'),
        },
      },
    },

    '/api/reservations': {
      get: {
        tags: ['Reservations'],
        summary: 'Lista rezerwacji (USER - tylko własne, ADMIN - wszystkie)',
        parameters: [
          queryParam('roomId', { type: 'integer', minimum: 1 }, 'Filtr po sali'),
          queryParam('buildingId', { type: 'integer', minimum: 1 }, 'Filtr po budynku'),
          queryParam('userId', { type: 'integer', minimum: 1 }, 'Filtr po użytkowniku - tylko ADMIN (USER -> 403)'),
          queryParam('status', { type: 'string', enum: ['CONFIRMED', 'CANCELLED'] }, 'Filtr po statusie'),
          queryParam('from', { type: 'string', format: 'date-time' }, 'Początek przedziału (ISO 8601 ze strefą)'),
          queryParam('to', { type: 'string', format: 'date-time' }, 'Koniec przedziału (ISO 8601 ze strefą)'),
          queryParam('page', { type: 'integer', minimum: 1, default: 1 }, 'Numer strony'),
          queryParam('limit', { type: 'integer', minimum: 1, maximum: 100, default: 20 }, 'Rozmiar strony'),
          queryParam(
            'sort',
            {
              type: 'string',
              enum: ['startTime', '-startTime', 'createdAt', '-createdAt', 'participants', '-participants'],
              default: 'startTime',
            },
            'Sortowanie (minus = malejąco)'
          ),
        ],
        responses: {
          200: ok('Strona rezerwacji', ref('ReservationPage')),
          400: err('BadRequest'),
          401: err('Unauthorized'),
          403: err('Forbidden'),
        },
      },
      post: {
        tags: ['Reservations'],
        summary: 'Nowa rezerwacja (właściciel ustawiany z tokenu)',
        requestBody: { required: true, ...json(ref('CreateReservationRequest')) },
        responses: {
          201: ok('Utworzona rezerwacja', ref('Reservation')),
          400: err('BadRequest'),
          401: err('Unauthorized'),
          404: err('NotFound'),
          409: err('Conflict'),
        },
      },
    },
    '/api/reservations/{id}': {
      get: {
        tags: ['Reservations'],
        summary: 'Szczegóły rezerwacji (właściciel lub ADMIN)',
        parameters: [idParam('ID rezerwacji')],
        responses: {
          200: ok('Rezerwacja', ref('ReservationDetail')),
          400: err('BadRequest'),
          401: err('Unauthorized'),
          404: err('NotFound'),
        },
      },
    },
    '/api/reservations/{id}/cancel': {
      patch: {
        tags: ['Reservations'],
        summary: 'Anulowanie rezerwacji (właściciel lub ADMIN)',
        parameters: [idParam('ID rezerwacji')],
        responses: {
          200: ok('Anulowana rezerwacja', ref('Reservation')),
          400: err('BadRequest'),
          401: err('Unauthorized'),
          404: err('NotFound'),
          409: err('Conflict'),
        },
      },
    },
  },

  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },

    responses: {
      BadRequest: { description: 'Błąd walidacji (VALIDATION_ERROR, INVALID_JSON)', ...json(ref('Error')) },
      Unauthorized: {
        description: 'Brak lub niepoprawny token (UNAUTHORIZED, INVALID_TOKEN, TOKEN_EXPIRED, INVALID_CREDENTIALS)',
        ...json(ref('Error')),
      },
      Forbidden: { description: 'Brak uprawnień (FORBIDDEN)', ...json(ref('Error')) },
      NotFound: { description: 'Zasób nie istnieje', ...json(ref('Error')) },
      Conflict: {
        description: 'Konflikt (EMAIL_TAKEN, DUPLICATE_RESOURCE, ROOM_ALREADY_BOOKED, ROOM_CAPACITY_EXCEEDED, RESERVATION_ALREADY_STARTED)',
        ...json(ref('Error')),
      },
    },

    schemas: {
      Error: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'object',
            required: ['code', 'message', 'requestId'],
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string', example: 'Validation failed' },
              details: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    location: { type: 'string', example: 'body' },
                    field: { type: 'string', example: 'password' },
                    message: { type: 'string', example: 'Too small: expected string to have >=10 characters' },
                  },
                },
              },
              requestId: { type: 'string', example: '8c343a92-fdf9-45e8-b053-ed1814b4982f' },
            },
          },
        },
      },

      RegisterRequest: {
        type: 'object',
        required: ['email', 'password'],
        additionalProperties: false,
        properties: {
          email: { type: 'string', format: 'email', example: 'Jan.Kowalski@example.com' },
          password: { type: 'string', minLength: 10, maxLength: 72, example: 'bardzo-dlugie-haslo' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        additionalProperties: false,
        properties: {
          email: { type: 'string', format: 'email', example: 'jan.kowalski@example.com' },
          password: { type: 'string', example: 'bardzo-dlugie-haslo' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          tokenType: { type: 'string', example: 'Bearer' },
          expiresIn: { type: 'string', example: '15m' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 2 },
          email: { type: 'string', example: 'jan.kowalski@example.com' },
          role: { type: 'string', enum: ['USER', 'ADMIN'] },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },

      Building: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Budynek A' },
          address: { type: 'string', example: 'ul. Warszawska 24, Kraków' },
          roomsCount: { type: 'integer', example: 3, description: 'Tylko na liście budynków' },
        },
      },
      CreateBuildingRequest: {
        type: 'object',
        required: ['name', 'address'],
        additionalProperties: false,
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100, example: 'Budynek C' },
          address: { type: 'string', minLength: 1, maxLength: 255, example: 'ul. Testowa 1' },
        },
      },

      Room: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          buildingId: { type: 'integer', example: 1 },
          name: { type: 'string', example: '101' },
          capacity: { type: 'integer', example: 30 },
        },
      },
      RoomDetail: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: '101' },
          capacity: { type: 'integer', example: 30 },
          building: ref('BuildingRef'),
        },
      },
      CreateRoomRequest: {
        type: 'object',
        required: ['buildingId', 'name', 'capacity'],
        additionalProperties: false,
        properties: {
          buildingId: { type: 'integer', minimum: 1, example: 1 },
          name: { type: 'string', minLength: 1, maxLength: 50, example: '301' },
          capacity: { type: 'integer', minimum: 1, example: 25 },
        },
      },
      BuildingRef: {
        type: 'object',
        properties: { id: { type: 'integer' }, name: { type: 'string' } },
      },
      UserRef: {
        type: 'object',
        properties: { id: { type: 'integer', example: 2 }, email: { type: 'string', example: 'jan.kowalski@example.com' } },
      },

      CreateReservationRequest: {
        type: 'object',
        required: ['roomId', 'participants', 'startTime', 'endTime'],
        additionalProperties: false,
        properties: {
          roomId: { type: 'integer', minimum: 1, example: 2 },
          participants: { type: 'integer', minimum: 1, example: 4 },
          startTime: { type: 'string', format: 'date-time', example: '2026-12-01T10:00:00Z' },
          endTime: { type: 'string', format: 'date-time', example: '2026-12-01T11:00:00Z' },
        },
      },
      Reservation: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          roomId: { type: 'integer' },
          user: ref('UserRef'),
          participants: { type: 'integer' },
          startTime: { type: 'string', format: 'date-time' },
          endTime: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: ['CONFIRMED', 'CANCELLED'] },
          createdAt: { type: 'string', format: 'date-time' },
          cancelledAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      ReservationDetail: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          room: {
            type: 'object',
            properties: { id: { type: 'integer' }, name: { type: 'string' }, building: ref('BuildingRef') },
          },
          user: ref('UserRef'),
          participants: { type: 'integer' },
          startTime: { type: 'string', format: 'date-time' },
          endTime: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: ['CONFIRMED', 'CANCELLED'] },
          createdAt: { type: 'string', format: 'date-time' },
          cancelledAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      ReservationPage: {
        type: 'object',
        properties: {
          data: { type: 'array', items: ref('ReservationDetail') },
          meta: {
            type: 'object',
            properties: {
              page: { type: 'integer' },
              limit: { type: 'integer' },
              total: { type: 'integer' },
              totalPages: { type: 'integer' },
            },
          },
        },
      },
    },
  },
};
