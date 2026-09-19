import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { AppDatabase } from '@/core/db/app-database';
import { DatabaseService } from '@/core/services/database.service';

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
    isOpen: vi.fn().mockReturnValue(false),
    open: vi.fn().mockResolvedValue(undefined),
    close: vi.fn(),
  };

  function createService(): DatabaseService {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [DatabaseService, { provide: AppDatabase, useValue: mockAppDatabase }],
    });
    return TestBed.inject(DatabaseService);
  }

  it('should lazily connect on-demand and perform CRUD operations', async () => {
    const service = createService();
    expect(service.isConnected()).toBe(false);

    const id = await service.insert({
      merchantName: 'Test Coffee',
      amount: 4.5,
      transactionDate: '2026-08-10',
      category: 'dining',
    });
    expect(id).toBe(1);
    expect(service.isConnected()).toBe(true);

    await service.update(1, { amount: 5.0 });
    await service.delete(1);

    const list = await service.selectByDateRange('2026-08-01', '2026-08-15');
    expect(list.length).toBe(1);
  });

  it('should handle connection teardown explicitly and via DestroyRef onDestroy', async () => {
    const service = createService();
    mockAppDatabase.close.mockClear();

    await service.selectByDateRange('2026-08-01', '2026-08-15');
    expect(service.isConnected()).toBe(true);

    service.close();
    expect(service.isConnected()).toBe(false);
    expect(mockAppDatabase.close).toHaveBeenCalledTimes(1);

    await service.selectByDateRange('2026-08-01', '2026-08-15');
    expect(service.isConnected()).toBe(true);

    TestBed.resetTestingModule();
    expect(mockAppDatabase.close).toHaveBeenCalledTimes(2);
  });
});
