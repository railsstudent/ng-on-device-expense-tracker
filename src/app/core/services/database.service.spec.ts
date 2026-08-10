import { APP_DATABASE_TOKEN } from '@/core/consts/app-database.const';
import { DatabaseService } from './database.service';

// Mock variables representing the Database structures
const mockTable = {
  toArray: vi
    .fn()
    .mockResolvedValue([{ id: 1, merchantName: 'Test', amount: 10, transactionDate: '2026-08-10', category: 'Test' }]),
  add: vi.fn().mockResolvedValue(1),
  update: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn().mockResolvedValue(undefined),
  where: vi.fn().mockReturnThis(),
  between: vi.fn().mockReturnThis(),
};

const mockAppDatabase = {
  expenses: mockTable,
  open: vi.fn().mockResolvedValue(undefined),
};

// Mock the inject function from @angular/core to intercept APP_DATABASE_TOKEN lookup
vi.mock('@angular/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@angular/core')>();
  return {
    ...actual,
    inject: vi.fn((token) => {
      if (token === APP_DATABASE_TOKEN) {
        return mockAppDatabase;
      }
      return actual.inject(token);
    }),
  };
});

describe('DatabaseService', () => {
  it('should establish connection and perform CRUD operations', async () => {
    const service = new DatabaseService();
    expect(service.isConnected()).toBe(false);

    await service.initialize();
    expect(service.isConnected()).toBe(true);

    const selectResult = await service.select();
    expect(selectResult.length).toBe(1);
    expect(selectResult[0].merchantName).toBe('Test');

    const insertResult = await service.insert({
      merchantName: 'Test',
      amount: 10,
      transactionDate: '2026-08-10',
      category: 'Test',
    });
    expect(insertResult).toBe(1);

    await service.update(1, { amount: 15 });
    await service.delete(1);

    const rangeResult = await service.selectByDateRange('2026-08-01', '2026-08-15');
    expect(rangeResult.length).toBe(1);
  });
});
