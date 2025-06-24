// Declaración global para permitir el tipado de mockPool.query en tests
// Esto soluciona el error de tipo "never" en los mocks de pool.query

declare module 'pg' {
  interface Pool {
    query: jest.Mock<any, any>;
  }
}
