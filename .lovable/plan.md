# Finance Tab — Build Plan

A complete personal finance module replacing the `/app/finance` placeholder, with bilingual support, multi-currency tracking, image receipts, and full AI integration.

## Page layout

Sub-tab pill switcher at the top (mobile-friendly), with the **Dashboard** always being the default view:

```text
[ Dashboard | Income | Expense | Loans | Recurring ]
```

```text
┌──────────────── Dashboard ────────────────┐
│ Month summary cards:                      │
│   Income · Expense · Net · Balance trend  │
│ Currency switcher (BDT / CNY / USD / All) │
│ Mini charts: 30-day income vs expense     │
│ Category breakdown (top 5 expense)        │
│ Upcoming recurring renewals (next 7 days) │
│ Outstanding loans (given / taken totals)  │
│ Recent transactions (latest 5)            │
└───────────────────────────────────────────┘
```

## Sections

### 1. Income & Expense (shared form/list pattern)

Fields:

- **Category** dropdown + **Sub-category** dropdown (filtered by category) (option to add new category and sub-category)
- **Amount** + **Currency** (BDT, CNY, USD)
- **Pay for / From** (free text, e.g. "Salary", "Groceries at Walmart")
- **Payment method**: WeChat, Alipay, Cash, bKash, Nagad, Bank, Card (Dropdown)
- **Receipt image** (upload to storage)
- **Date & time** (datetime picker, defaults to now)
- **Note** (optional)

Default categories seeded per user on first visit:

- **Income**:  University Stipend, Salary (Monthly, Bonus, Overtime), Freelance, Business, Investment (Dividend, Interest, Capital gain), Gift, Other,
- **Expense**: Food (Groceries, Restaurant, Snacks), Transport (Metro, Didi, Bus, Train, Air), Housing (Rent, Utilities, Maintenance), Education (Tuition, Books, Tools), Health (Medicine, Doctor), Shopping (Clothes, Electronics), Entertainment, Bills, Charity/Sadaqah, Travel, Other

User can add/edit/delete custom categories and sub-categories.

List view: grouped by date, shows category icon, amount in original currency + converted to user's primary currency, payment method badge, and tappable thumbnail of receipt.

Filters: date range, category, currency, payment method, search by note.

### 2. Loans

Two tabs inside: **Taken by me** | **Given by me**  
Fields: person name, reason, date, amount + currency, expected return date, status (open / paid), note.  
Each loan card shows days remaining/overdue (shows card color blue if given by me, Orange if taken by me, Green if Paid | color opacity 50%), with a one-tap **"Mark as paid"** button (records paid date).
Summary at top: total outstanding given / taken per currency.

### 3. Recurring

Two types: **Recurring Income** | **Recurring Expense** (subscriptions live here).
Fields: service name, amount + currency, payment method, category, start date, next renewal date, frequency (Daily / Weekly / Monthly / Yearly), auto-debit toggle, note, optional logo/screenshot.
Card list shows next renewal countdown (e.g., "Renews in 3 days") and total monthly cost.
A daily client-side check auto-creates a transaction on renewal date and rolls the next renewal date forward (for items marked auto-post).  
Card color shows red if Renew in 5 Days.

### 4. Dashboard

Composed from all above tables. All amounts shown in user's **primary currency** (set in Profile, default BDT) using configurable exchange rates stored per user.

## Bonus features (recommended additions)

1. **Budget targets** — monthly cap per category; dashboard shows progress bars and warns when nearing limit.
2. **Currency exchange rates** are editable in settings (BDT/CNY/USD pairs); used to normalize the dashboard, add a manual currency rate, and the base currency is CNY.
3. **Sadaqah / Zakat tracker** — auto-tag charity expenses; yearly Zakat calculator on net savings (2.5%).
4. **CSV export** of transactions for any month.
5. **Receipt OCR via AI** — when uploading a receipt image, AI extracts the amount, vendor, and date, and pre-fills the form.
6. **Recurring renewal reminders** — toast notification when a subscription is renewing in ≤5 days.
7. **Search & quick-add** — natural language input ("Spent 250 BDT on groceries with bKash") that AI parses into a transaction.

## Out of scope (call out for later)

- Bank account sync (no Open Banking).
- Push notifications (browser Web Push out of scope).

---

## Technical details

### Database (new tables, RLS by `user_id`)

- `finance_categories` — `id, user_id, kind ('income'|'expense'), name, icon, color, position, created_at`
- `finance_subcategories` — `id, user_id, category_id, name, position`
- `finance_transactions` — `id, user_id, kind ('income'|'expense'), category_id, subcategory_id (null), amount (numeric), currency ('BDT'|'CNY'|'USD'), pay_for (text), payment_method (text), receipt_url (text null), occurred_at (timestamptz), note (text null), recurring_id (uuid null, links to source recurring), created_at`
- `finance_loans` — `id, user_id, direction ('taken'|'given'), person_name, reason, amount, currency, loan_date, expected_return_date, paid_at (timestamptz null), note, created_at`
- `finance_recurring` — `id, user_id, kind ('income'|'expense'), service_name, amount, currency, payment_method, category_id, start_date, next_renewal_date, frequency ('daily'|'weekly'|'monthly'|'yearly'), auto_post (bool default false), logo_url (text null), note, created_at`
- `finance_budgets` — `id, user_id, category_id, month (date, first day), amount_limit, currency`
- `finance_settings` — `id, user_id unique, primary_currency, fx_bdt_per_usd, fx_bdt_per_cny`

Seed default categories on first dashboard load (idempotent: skip if user already has any).

### Storage

- New bucket `finance-receipts` (private). RLS: users can only read/write paths under `{user_id}/`.

### Frontend

- Replace placeholder route with `src/pages/app/Finance.tsx` (sub-tab switcher matching Prayer pattern).
- New folder `src/components/finance/`:
  - `FinanceDashboard.tsx`, `FinanceTabs.tsx`
  - `TransactionForm.tsx` (shared income/expense), `TransactionList.tsx`, `TransactionRow.tsx`, `TransactionFilters.tsx`
  - `CategoryManager.tsx` (manage categories + subcategories)
  - `LoanForm.tsx`, `LoanList.tsx`, `LoanCard.tsx`
  - `RecurringForm.tsx`, `RecurringList.tsx`, `RecurringCard.tsx`
  - `ReceiptUpload.tsx` (image picker + preview, calls storage)
  - `BudgetCard.tsx`, `ZakatCard.tsx`
  - `CurrencyAmount.tsx` (display helper that converts using settings)
- New hooks: `src/hooks/useFinance.ts` (transactions, categories, settings) and `src/hooks/useLoans.ts`, `src/hooks/useRecurring.ts`. All emit `ai-data-changed` after mutations.
- `src/data/financeDefaults.ts` — default category seed.

### Edge functions

- New `finance-ocr` — accepts a receipt image URL, calls Lovable AI vision (`google/gemini-2.5-flash`) with structured tool-calling to return `{amount, currency, vendor, occurred_at, suggested_category}`. Validates JWT.
- Extend existing `ai-assistant` with new tools:
  - `list_finance_categories`, `create_finance_category`
  - `list_transactions` (filter by kind, date range, category)
  - `add_transaction` (income or expense)
  - `list_loans`, `add_loan`, `mark_loan_paid`
  - `list_recurring`, `add_recurring`
  - `get_finance_summary` (current-month totals per currency, top categories)
  - `parse_natural_finance_input` (handled by the model itself; tools above are the action layer)

### i18n

Add `finance.*` keys in `src/i18n/en.ts` and `src/i18n/bn.ts` for: section titles, all categories, payment methods, frequencies, currencies, button labels, empty states, dashboard cards, tooltips.

### Acceptance

- `/app/finance` shows Dashboard by default with month summary, recent transactions, and upcoming renewals.
- Adding an income/expense with a receipt image stores it, displays the thumbnail in the list, and updates the dashboard immediately.
- Loans show outstanding totals and let me mark them paid in one tap.
- Recurring items show next renewal countdown; auto-post creates a transaction on the due date.
- AI assistant can answer "how much did I spend on food this month?" and "log 250 BDT bKash expense for groceries" using the new tools.
- Switching language toggles every label including category names where translations exist.