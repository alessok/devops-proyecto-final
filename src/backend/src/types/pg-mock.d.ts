// Declaración global para permitir el tipado de mockPool.query en tests
// Esto soluciona el error de tipo "never" en los mocks de pool.query

// Solo aplicar en entorno de test para no interferir con la importación de Pool como valor
export {};

// Si necesitas extender Pool para los tests, hazlo en los archivos de test usando import type
// import type { Pool } from 'pg';
// type MockedPool = jest.Mocked<Pool>;
