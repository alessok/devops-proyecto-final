import { Builder, WebDriver, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

export class TestHelper {
  private driver: WebDriver;
  private readonly baseUrl: string;
  private readonly seleniumUrl: string;

  constructor() {
    this.baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    this.seleniumUrl = process.env.SELENIUM_URL || 'http://localhost:4444/wd/hub';
  }

  async setup(): Promise<void> {
    const options = new chrome.Options();
    options.addArguments('--headless');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');
    options.addArguments('--window-size=1920,1080');

    this.driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .usingServer(this.seleniumUrl)
      .build();

    await this.driver.manage().setTimeouts({
      implicit: 10000,
      pageLoad: 30000,
      script: 30000
    });
  }

  async teardown(): Promise<void> {
    if (this.driver) {
      await this.driver.quit();
    }
  }

  async navigateTo(path: string = ''): Promise<void> {
    const url = `${this.baseUrl}${path}`;
    await this.driver.get(url);
  }

  async waitForElement(selector: string, timeout: number = 10000): Promise<any> {
    return await this.driver.wait(
      until.elementLocated(By.css(selector)),
      timeout
    );
  }

  async waitForElementVisible(selector: string, timeout: number = 10000): Promise<any> {
    const element = await this.waitForElement(selector, timeout);
    await this.driver.wait(until.elementIsVisible(element), timeout);
    return element;
  }

  async click(selector: string): Promise<void> {
    const element = await this.waitForElementVisible(selector);
    await element.click();
  }

  async type(selector: string, text: string): Promise<void> {
    const element = await this.waitForElementVisible(selector);
    await element.clear();
    await element.sendKeys(text);
  }

  async getText(selector: string): Promise<string> {
    const element = await this.waitForElementVisible(selector);
    return await element.getText();
  }

  async getAttribute(selector: string, attribute: string): Promise<string> {
    const element = await this.waitForElementVisible(selector);
    return await element.getAttribute(attribute);
  }

  async isElementPresent(selector: string): Promise<boolean> {
    try {
      await this.driver.findElement(By.css(selector));
      return true;
    } catch (error) {
      return false;
    }
  }

  async takeScreenshot(): Promise<string> {
    return await this.driver.takeScreenshot();
  }

  async getCurrentUrl(): Promise<string> {
    return await this.driver.getCurrentUrl();
  }

  async getPageTitle(): Promise<string> {
    return await this.driver.getTitle();
  }

  async executeScript(script: string): Promise<any> {
    return await this.driver.executeScript(script);
  }

  async waitForPageLoad(): Promise<void> {
    await this.driver.wait(
      async () => {
        const readyState = await this.executeScript('return document.readyState');
        return readyState === 'complete';
      },
      30000
    );
  }

  getDriver(): WebDriver {
    return this.driver;
  }
}
