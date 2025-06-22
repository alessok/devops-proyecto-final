// Simple import test for metricsService
describe('MetricsService Import Test', () => {
  it('should import and execute metricsService', () => {
    // Import the service to execute its initialization code
    const metricsService = require('../services/metricsService');
    
    expect(metricsService).toBeDefined();
    expect(metricsService.register).toBeDefined();
    expect(metricsService.httpRequestsTotal).toBeDefined();
    expect(metricsService.httpRequestDuration).toBeDefined();
    expect(metricsService.activeConnections).toBeDefined();
    expect(metricsService.databaseConnectionPool).toBeDefined();
    expect(metricsService.totalUsers).toBeDefined();
    expect(metricsService.totalProducts).toBeDefined();
    expect(metricsService.totalCategories).toBeDefined();
  });
});
