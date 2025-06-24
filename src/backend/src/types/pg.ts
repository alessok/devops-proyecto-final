// Tipos utilitarios para mocks de pg.Pool en tests

// Tipo genérico para simular el resultado de pool.query
export type MockQueryResult<T = any> = { rows: T[] };
