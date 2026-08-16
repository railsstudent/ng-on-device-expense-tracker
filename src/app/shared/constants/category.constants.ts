export interface CategoryDefinition {
  key: string;
  label: string;
}

export const EXPENSE_CATEGORIES: readonly CategoryDefinition[] = [
  { key: 'dining', label: 'Dining & Meals / 餐飲' },
  { key: 'travel', label: 'Travel & Transport / 交通' },
  { key: 'office', label: 'Office & Software / 辦公' },
  { key: 'utilities', label: 'Utilities & Bills / 水電雜費' },
  { key: 'shopping', label: 'Shopping & Entertainment / 購物與娛樂' },
  { key: 'other', label: 'Other / 其他' },
];

export const OCR_CATEGORY_MAP: Readonly<Record<string, string>> = {
  Food: 'dining',
  Groceries: 'shopping',
  Transport: 'travel',
  Entertainment: 'shopping',
  Shopping: 'shopping',
  Utilities: 'utilities',
  Medical: 'other',
  Others: 'other',
};
