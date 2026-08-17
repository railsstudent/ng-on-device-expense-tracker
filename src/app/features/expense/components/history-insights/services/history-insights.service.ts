import { DatabaseService } from '@/core/services/database.service';
import { InsightService } from '@/core/services/ai/insight.service';
import { Expense } from '@/shared/interfaces/expense.interface';
import { Insight } from '@/shared/interfaces/insight.interface';
import { Service, inject } from '@angular/core';

@Service()
export class HistoryInsightsService {
  readonly #dbService = inject(DatabaseService);
  readonly #insightService = inject(InsightService);

  // Directly reference already-read-only signals to simplify the reactive graph and keep core engine hidden
  public readonly aiStatus = this.#insightService.status;
  public readonly aiError = this.#insightService.error;

  /**
   * Stateless database loader: queries expenses by date range and returns a raw Promise list.
   */
  public async loadExpenses(startDate: string, endDate: string): Promise<Expense[]> {
    return this.#dbService.selectByDateRange(startDate, endDate);
  }

  /**
   * Stateless deletion execution: deletes a database record by id.
   */
  public async deleteExpense(id: number): Promise<void> {
    return this.#dbService.delete(id);
  }

  /**
   * Stateless AI adapter: returns the insight generator stream from the engine.
   */
  public streamInsights(query: string, expenses: Expense[]): AsyncGenerator<Insight[]> {
    return this.#insightService.streamInsights(query.trim(), expenses);
  }
}
