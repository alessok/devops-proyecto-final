// Archivo de configuración para pruebas funcionales con Selenium
// tests/functional/config.js

module.exports = {
  // Configuración del navegador
  browser: {
    name: process.env.BROWSER || 'chrome',
    headless: process.env.HEADLESS !== 'false',
    width: 1920,
    height: 1080,
    timeout: 30000
  },

  // URLs de la aplicación
  urls: {
    base: process.env.APP_URL || 'http://localhost:3001',
    login: process.env.APP_URL || 'http://localhost:3001' + '/login',
    dashboard: process.env.APP_URL || 'http://localhost:3001' + '/dashboard',
    products: process.env.APP_URL || 'http://localhost:3001' + '/productos'
  },

  // Credenciales de prueba
  credentials: {
    admin: {
      username: 'admin',
      password: 'admin123'
    },
    user: {
      username: 'usuario1',
      password: 'user123'
    }
  },

  // Configuración de Selenium Hub
  selenium: {
    hub: process.env.SELENIUM_HUB || 'http://localhost:4444/wd/hub',
    timeout: 30000
  },

  // Configuración de reportes
  reports: {
    directory: './reports',
    screenshots: true,
    video: false
  }
};
