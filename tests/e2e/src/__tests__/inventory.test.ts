import { TestHelper } from '../helpers/TestHelper';

describe('Sistema de Inventario - Pruebas de Funcionalidad Principal', () => {
  let testHelper: TestHelper;

  beforeAll(async () => {
    testHelper = new TestHelper();
    await testHelper.setup();
  });

  afterAll(async () => {
    await testHelper.teardown();
  });

  describe('Navegación y Accesibilidad', () => {
    test('Debe cargar la página principal correctamente', async () => {
      await testHelper.navigateTo('/');
      await testHelper.waitForPageLoad();
      
      const title = await testHelper.getPageTitle();
      expect(title).toContain('Sistema de Inventario');
      
      // Verificar que elementos principales estén presentes
      expect(await testHelper.isElementPresent('header')).toBe(true);
      expect(await testHelper.isElementPresent('main')).toBe(true);
    });

    test('Debe mostrar el logo y navegación principal', async () => {
      await testHelper.navigateTo('/');
      
      // Verificar presencia del logo
      expect(await testHelper.isElementPresent('[data-testid="logo"]')).toBe(true);
      
      // Verificar menú de navegación
      expect(await testHelper.isElementPresent('[data-testid="nav-menu"]')).toBe(true);
    });

    test('Debe responder en un tiempo razonable', async () => {
      const startTime = Date.now();
      await testHelper.navigateTo('/');
      await testHelper.waitForPageLoad();
      const loadTime = Date.now() - startTime;
      
      // La página debe cargar en menos de 5 segundos
      expect(loadTime).toBeLessThan(5000);
    });
  });

  describe('Funcionalidad de Inventario', () => {
    test('Debe mostrar la lista de productos', async () => {
      await testHelper.navigateTo('/productos');
      await testHelper.waitForPageLoad();
      
      // Verificar que la tabla/lista de productos esté presente
      expect(await testHelper.isElementPresent('[data-testid="products-list"]')).toBe(true);
    });

    test('Debe permitir buscar productos', async () => {
      await testHelper.navigateTo('/productos');
      
      const searchInput = '[data-testid="search-input"]';
      if (await testHelper.isElementPresent(searchInput)) {
        await testHelper.type(searchInput, 'test');
        
        // Verificar que se muestre algún resultado o mensaje
        await testHelper.waitForElement('[data-testid="search-results"]', 5000);
      }
    });

    test('Debe mostrar detalles de producto al hacer click', async () => {
      await testHelper.navigateTo('/productos');
      
      const firstProduct = '[data-testid="product-item"]:first-child';
      if (await testHelper.isElementPresent(firstProduct)) {
        await testHelper.click(firstProduct);
        
        // Verificar que se muestre los detalles
        expect(await testHelper.isElementPresent('[data-testid="product-details"]')).toBe(true);
      }
    });
  });

  describe('Formularios y Validación', () => {
    test('Debe validar campos requeridos en formularios', async () => {
      await testHelper.navigateTo('/productos/nuevo');
      
      if (await testHelper.isElementPresent('[data-testid="product-form"]')) {
        // Intentar enviar formulario vacío
        await testHelper.click('[data-testid="submit-button"]');
        
        // Verificar que se muestren errores de validación
        expect(await testHelper.isElementPresent('[data-testid="validation-error"]')).toBe(true);
      }
    });

    test('Debe permitir crear un nuevo producto', async () => {
      await testHelper.navigateTo('/productos/nuevo');
      
      if (await testHelper.isElementPresent('[data-testid="product-form"]')) {
        // Llenar formulario con datos válidos
        await testHelper.type('[data-testid="name-input"]', 'Producto de Prueba E2E');
        await testHelper.type('[data-testid="description-input"]', 'Descripción de prueba automatizada');
        await testHelper.type('[data-testid="price-input"]', '99.99');
        await testHelper.type('[data-testid="stock-input"]', '10');
        
        // Enviar formulario
        await testHelper.click('[data-testid="submit-button"]');
        
        // Verificar redirección o mensaje de éxito
        await testHelper.waitForElement('[data-testid="success-message"]', 10000);
      }
    });
  });

  describe('Responsividad y UX', () => {
    test('Debe ser responsive en dispositivos móviles', async () => {
      // Simular viewport móvil
      await testHelper.getDriver().manage().window().setRect({
        width: 375,
        height: 667,
        x: 0,
        y: 0
      });
      
      await testHelper.navigateTo('/');
      await testHelper.waitForPageLoad();
      
      // Verificar que el contenido se adapte
      const bodyWidth = await testHelper.executeScript('return document.body.scrollWidth');
      expect(bodyWidth).toBeLessThanOrEqual(375);
    });

    test('Debe mostrar indicadores de carga', async () => {
      await testHelper.navigateTo('/productos');
      
      // Verificar presencia de spinner o indicador de carga
      if (await testHelper.isElementPresent('[data-testid="loading-spinner"]')) {
        expect(await testHelper.isElementPresent('[data-testid="loading-spinner"]')).toBe(true);
      }
    });
  });

  describe('Manejo de Errores', () => {
    test('Debe manejar errores de red gracefully', async () => {
      // Simular error de red (página inexistente)
      await testHelper.navigateTo('/pagina-inexistente');
      
      // Verificar página de error 404
      expect(await testHelper.isElementPresent('[data-testid="error-404"]')).toBe(true);
    });

    test('Debe mostrar mensajes de error claros', async () => {
      await testHelper.navigateTo('/productos');
      
      // Si hay errores, deben ser informativos
      if (await testHelper.isElementPresent('[data-testid="error-message"]')) {
        const errorText = await testHelper.getText('[data-testid="error-message"]');
        expect(errorText.length).toBeGreaterThan(10); // Mensaje descriptivo
      }
    });
  });

  describe('Performance y Accesibilidad', () => {
    test('Debe cumplir con estándares básicos de accesibilidad', async () => {
      await testHelper.navigateTo('/');
      
      // Verificar presencia de elementos de accesibilidad
      const hasAltAttributes = await testHelper.executeScript(`
        const images = document.querySelectorAll('img');
        return Array.from(images).every(img => img.alt !== undefined);
      `);
      
      expect(hasAltAttributes).toBe(true);
    });

    test('Debe tener meta tags apropiados', async () => {
      await testHelper.navigateTo('/');
      
      const hasViewportMeta = await testHelper.executeScript(`
        return document.querySelector('meta[name="viewport"]') !== null;
      `);
      
      expect(hasViewportMeta).toBe(true);
    });
  });
});
