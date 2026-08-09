import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const expenses = sqliteTable('expenses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  merchantName: text('merchant_name').notNull(),
  amount: real('amount').notNull(),
  transactionDate: text('transaction_date').notNull(),
  category: text('category').notNull(),
});

export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
