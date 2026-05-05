export type DefaultCategory = {
  name: string;
  icon: string;
  color: string;
  subs: string[];
};

export const DEFAULT_INCOME_CATEGORIES: DefaultCategory[] = [
  { name: 'University Stipend', icon: 'GraduationCap', color: 'sky', subs: [] },
  { name: 'Salary', icon: 'Briefcase', color: 'emerald', subs: ['Monthly', 'Bonus', 'Overtime'] },
  { name: 'Freelance', icon: 'Laptop', color: 'indigo', subs: [] },
  { name: 'Business', icon: 'Building2', color: 'amber', subs: [] },
  { name: 'Investment', icon: 'TrendingUp', color: 'teal', subs: ['Dividend', 'Interest', 'Capital gain'] },
  { name: 'Gift', icon: 'Gift', color: 'rose', subs: [] },
  { name: 'Other', icon: 'Circle', color: 'indigo', subs: [] },
];

export const DEFAULT_EXPENSE_CATEGORIES: DefaultCategory[] = [
  { name: 'Food', icon: 'UtensilsCrossed', color: 'amber', subs: ['Groceries', 'Restaurant', 'Snacks'] },
  { name: 'Transport', icon: 'Bus', color: 'sky', subs: ['Metro', 'Didi', 'Bus', 'Train', 'Air'] },
  { name: 'Housing', icon: 'Home', color: 'indigo', subs: ['Rent', 'Utilities', 'Maintenance'] },
  { name: 'Education', icon: 'GraduationCap', color: 'teal', subs: ['Tuition', 'Books', 'Tools'] },
  { name: 'Health', icon: 'HeartPulse', color: 'rose', subs: ['Medicine', 'Doctor'] },
  { name: 'Shopping', icon: 'ShoppingBag', color: 'rose', subs: ['Clothes', 'Electronics'] },
  { name: 'Entertainment', icon: 'Film', color: 'indigo', subs: [] },
  { name: 'Bills', icon: 'Receipt', color: 'amber', subs: [] },
  { name: 'Charity/Sadaqah', icon: 'HandHeart', color: 'emerald', subs: [] },
  { name: 'Travel', icon: 'Plane', color: 'sky', subs: [] },
  { name: 'Other', icon: 'Circle', color: 'indigo', subs: [] },
];

export const PAYMENT_METHODS = ['WeChat', 'Alipay', 'Cash', 'bKash', 'Nagad', 'Bank', 'Card'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const CURRENCIES = ['BDT', 'CNY', 'USD'] as const;
export type Currency = (typeof CURRENCIES)[number];

export const FREQUENCIES = ['daily', 'weekly', 'monthly', 'yearly'] as const;
export type Frequency = (typeof FREQUENCIES)[number];

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  BDT: '৳',
  CNY: '¥',
  USD: '$',
};