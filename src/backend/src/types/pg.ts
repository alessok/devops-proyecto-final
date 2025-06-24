// Tipos utilitarios para mocks de pg.Pool en tests
import { QueryResult } from 'pg';

// Tipo genérico para simular el resultado de pool.query
export type MockQueryResult<T = any> = Partial<QueryResult<T>> & { rows: T[] };
