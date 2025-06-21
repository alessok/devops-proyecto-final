import { Request, Response, NextFunction } from 'express';
import { httpRequestsTotal, httpRequestDuration } from '../services/metricsService';

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Incrementar contador de requests
  httpRequestsTotal.inc({
    method: req.method,
    route: req.route?.path || req.path,
    status_code: '200' // Se actualizará en el evento 'finish'
  });

  // Medir duración de la request
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration.observe(
      {
        method: req.method,
        route: req.route?.path || req.path,
        status_code: res.statusCode.toString()
      },
      duration
    );
  });

  next();
};
