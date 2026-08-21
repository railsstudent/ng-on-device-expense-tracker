/**
 * Represents the definitive set of standard expense categories.
 */
export type CanonicalExpenseCategory =
  'dining' | 'groceries' | 'travel' | 'office' | 'utilities' | 'shopping' | 'other';

/**
 * Represents the structured expense metadata extracted from a receipt image.
 */
export interface ExtractedExpense {
  merchantName: string;
  amount: number;
  transactionDate: string;
  category: CanonicalExpenseCategory;
  isReceipt?: boolean; // True if the parsed file represents a valid receipt
}

/**
 * Represents an expense entry stored in the local database.
 */
export interface Expense extends ExtractedExpense {
  id?: number;
}
