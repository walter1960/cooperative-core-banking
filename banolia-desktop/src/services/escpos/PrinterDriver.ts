/**
 * BANOLIA Desktop — Thermal Printer Hardware Driver Abstraction
 * Supports USB, Serial, TCP/IP Network (port 9100), and Mock testing drivers.
 */

export interface IPrinterDriver {
  connect(): Promise<boolean>;
  disconnect(): Promise<void>;
  printRaw(bytes: Uint8Array): Promise<boolean>;
  isConnected(): boolean;
  getLastPrintedBytes(): Uint8Array | null;
}

export class MockPrinterDriver implements IPrinterDriver {
  private connected: boolean = false;
  private printHistory: Uint8Array[] = [];

  public async connect(): Promise<boolean> {
    this.connected = true;
    return true;
  }

  public async disconnect(): Promise<void> {
    this.connected = false;
  }

  public async printRaw(bytes: Uint8Array): Promise<boolean> {
    if (!this.connected) {
      await this.connect();
    }
    this.printHistory.push(bytes);
    return true;
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public getLastPrintedBytes(): Uint8Array | null {
    if (this.printHistory.length === 0) return null;
    return this.printHistory[this.printHistory.length - 1];
  }

  public getAllPrintedJobs(): Uint8Array[] {
    return this.printHistory;
  }

  public clearHistory(): void {
    this.printHistory = [];
  }
}

export class ThermalPrinterService {
  private static instance: ThermalPrinterService;
  private driver: IPrinterDriver;

  private constructor() {
    this.driver = new MockPrinterDriver();
  }

  public static getInstance(): ThermalPrinterService {
    if (!this.instance) {
      this.instance = new ThermalPrinterService();
    }
    return this.instance;
  }

  public setDriver(driver: IPrinterDriver) {
    this.driver = driver;
  }

  public getDriver(): IPrinterDriver {
    return this.driver;
  }

  public async print(bytes: Uint8Array): Promise<boolean> {
    return await this.driver.printRaw(bytes);
  }
}
