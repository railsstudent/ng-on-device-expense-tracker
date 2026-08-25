import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { APP_DATABASE_TOKEN } from '../consts/app-database.const';
import { DatabaseService } from './database.service';

describe('DatabaseService', () => {
  // Mock variables representing the Database structures
  const mockTable = {
    toArray: vi
      .fn()
      .mockResolvedValue([
        { id: 1, merchantName: 'Test', amount: 10, transactionDate: '2026-08-10', category: 'dining' },
      ]),
    add: vi.fn().mockResolvedValue(1),
    update: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    where: vi.fn().mockReturnThis(),
    between: vi.fn().mockReturnThis(),
  };

  const mockAppDatabase = {
    expenses: mockTable,
    open: vi.fn().mockResolvedValue(undefined),
    close: vi.fn(),
  };

  function createService(): DatabaseService {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [DatabaseService, { provide: APP_DATABASE_TOKEN, useValue: mockAppDatabase }],
    });
    return TestBed.inject(DatabaseService);
  }

  it('should establish connection and perform CRUD operations', async () => {
    const service = createService();
    expect(service.isConnected()).toBe(false);

    await service.initialize();
    expect(service.isConnected()).toBe(true);

    const insertResult = await service.insert({
      merchantName: 'Test',
      amount: 10,
      transactionDate: '2026-08-10',
      category: 'dining',
    });
    expect(insertResult).toBe(1);

    await service.update(1, { amount: 15 });
    await service.delete(1);

    const rangeResult = await service.selectByDateRange('2026-08-01', '2026-08-15');
    expect(rangeResult.length).toBe(1);
  });

  it('should close connection explicitly and via ngOnDestroy', async () => {
    const service = createService();
    mockAppDatabase.close.mockClear();

    await service.initialize();
    expect(service.isConnected()).toBe(true);

    service.close();
    expect(service.isConnected()).toBe(false);
    expect(mockAppDatabase.close).toHaveBeenCalledTimes(1);

    await service.initialize();
    expect(service.isConnected()).toBe(true);

    service.ngOnDestroy();
    expect(service.isConnected()).toBe(false);
    expect(mockAppDatabase.close).toHaveBeenCalledTimes(2);
  });
});
