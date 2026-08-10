/**
 * Represents the structured expense metadata extracted from a receipt image.
 */
export interface ExtractedExpense {
  merchantName: string;
  amount: number;
  transactionDate: string;
  category: string;
}

/**
 * Represents an expense entry stored in the local database.
 */
export interface Expense extends ExtractedExpense {
  id?: number;
}
