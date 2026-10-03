export type Language = 'en' | 'hi' | 'or' | 'bn';

export type AttendanceStatus = 'present' | 'absent' | 'half_day' | 'late' | 'overtime' | 'leave';

export type SalaryType = 'monthly' | 'daily' | 'hourly';

export interface SalaryRules {
  salaryType: SalaryType;
  basicSalary: number;
  standardHoursPerDay: number; // e.g. 8 or 9
  overtimeRatePerHour: number; // e.g. 100
  halfDayDeductionType: 'fixed' | 'percentage';
  halfDayDeductionValue: number; // e.g. 50%
  lateThresholdMinutes: number; // e.g. 15
  lateDeductionType: 'fixed' | 'percentage';
  lateDeductionValue: number; // e.g. 50
  absenceDeductionType: 'fixed' | 'daily_rate';
  absenceDeductionValue: number; // e.g. dailyRate or fixed ₹
  advanceAmount: number;
  loanDeduction: number;
  incentive: number;
  workingDaysPerMonth: number; // e.g. 26
}

export interface Staff {
  id: string;
  staff_id?: string;
  name: string;
  phone: string;
  role: string;
  basicSalary: number; // in INR
  joinDate: string;
  avatarBg: string;
  qrCodeId: string;
  salaryRules?: SalaryRules;
  // Staff Payment Details
  payment_name?: string;
  upi_id?: string;
  qr_image_url?: string;
  qr_image_local_path?: string;
  updated_at?: string;
}

export interface AttendanceRecord {
  id: string;
  staffId: string;
  staff_id?: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  checkInTime?: string; // HH:mm
  check_in?: string;
  checkOutTime?: string; // HH:mm
  check_out?: string;
  totalWorkingHours?: number;
  working_hours?: number;
  overtimeHours?: number;
  overtime_hours?: number;
  overtimeRate?: number;
  overtime_rate?: number;
  overtimeAmount?: number;
  overtime_amount?: number;
  lateMinutes?: number;
  late_minutes?: number;
  note?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SalaryAdjustment {
  advanceTaken: number;
  loanDeduction: number;
  incentive: number;
  note?: string;
}

export interface StaffSalaryPayment {
  id: string; // payment_id
  payment_id?: string;
  staff_id: string;
  salary_month?: string; // e.g. "September 2026" or "2026-09"
  payable_amount?: number;
  paid_amount: number;
  amount?: number; // alias for paid_amount
  payment_date: string;
  payment_method: 'Cash' | 'UPI' | 'Bank' | 'Other' | 'Bank Transfer';
  upi_id?: string;
  transaction_reference?: string;
  reference_number?: string;
  note?: string;
  status?: 'Payment Completed' | 'Payment Failed' | 'Payment Cancelled' | 'Completed' | 'Failed' | 'Cancelled' | 'Pending';
  remaining_balance_after?: number;
  created_at: string;
  updated_at?: string;
}

export interface SalaryCalculationResult {
  staffId: string;
  staffName: string;
  role: string;
  month: string; // e.g. "September 2026"
  totalDaysInMonth: number;
  basicSalary: number;
  dailyRate: number;
  presentDays: number;
  halfDays: number;
  absentDays: number;
  lateDays: number;
  leaveDays?: number;
  overtimeHours: number;
  overtimeRate: number;
  standardHoursPerDay: number;
  salaryType: SalaryType;
  
  // Earnings
  baseEarned: number;
  overtimePay: number;
  overtimeAmount?: number;
  incentive: number;
  grossSalary: number;

  // Deductions
  lateDeduction: number;
  absenceDeduction: number;
  advanceDeduction: number;
  loanDeduction: number;
  totalDeductions: number;

  // Net payable
  netSalary: number;

  // Ledger fields
  totalPaid: number;
  remainingSalary: number;
  paymentStatus: 'paid' | 'partially_paid' | 'pending';
  payments?: StaffSalaryPayment[];
}

export interface ItemPaymentAllocation {
  itemId: string;
  itemName: string;
  allocatedAmount: number;
  remainingItemBalance: number;
}

export interface CustomerPaymentRecord {
  id: string;
  customer_id: string; // phone or clean customer key
  customerName?: string;
  payment_amount: number;
  payment_date: string;
  payment_method: 'Cash' | 'UPI' | 'Bank' | 'Other' | 'Bank Transfer';
  reference_number?: string;
  note?: string;
  allocation_details?: ItemPaymentAllocation[];
  remaining_balance_after?: number;
  created_at: string;
  updated_at?: string;
}

export interface CustomerTimelineEvent {
  id: string;
  type: 'created' | 'item_added' | 'payment_received' | 'reminder_sent' | 'paid_in_full';
  title: string;
  description?: string;
  date: string;
  amount?: number;
}

export interface UdhariItem {
  id: string;
  itemName: string;
  quantity: string | number;
  unit?: string;
  price?: number;
  totalAmount: number;
  paidAmount?: number;
  remainingAmount?: number;
  dueDate?: string;
  note?: string;
}

export interface UdhariEntry {
  id: string; // transaction_id
  transaction_id?: string;
  customer_id?: string;
  customerName: string;
  customerPhone: string;
  itemName: string;
  quantity: string;
  unit?: string;
  price?: number;
  items?: UdhariItem[];
  item_list?: UdhariItem[];
  amount: number; // total_amount
  total_amount?: number;
  paidAmount?: number; // paid_amount
  paid_amount?: number;
  remainingAmount?: number; // remaining_amount
  remaining_amount?: number;
  date: string; // transaction_date (YYYY-MM-DD)
  transaction_date?: string;
  dueDate: string; // due_date (YYYY-MM-DD)
  due_date?: string;
  note?: string;
  isPaid: boolean;
  status?: 'pending' | 'partially_paid' | 'paid' | 'overdue';
  paidDate?: string;
  paymentMethod?: string;
  paymentHistory?: {
    paymentId: string;
    date: string;
    amount: number;
    paymentMethod: string;
    note?: string;
  }[];
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

export interface SupplierPurchaseItem {
  id: string;
  itemName: string;
  quantity: string | number;
  unit?: string;
  price: number;
  totalAmount: number;
}

export interface SupplierPayment {
  id: string; // payment_id
  payment_id?: string;
  supplier_id?: string;
  supplierPhone?: string;
  supplierName?: string;
  linked_purchase_id?: string;
  purchase_id?: string;
  billId?: string;
  amount: number;
  payment_amount?: number;
  date: string; // YYYY-MM-DD
  payment_date?: string;
  paymentMode?: 'cash' | 'upi' | 'bank' | 'other';
  payment_method?: 'Cash' | 'UPI' | 'Bank' | 'Other' | 'cash' | 'upi' | 'bank' | 'other';
  reference_number?: string;
  note?: string;
  remaining_balance_after?: number;
  remaining_supplier_balance?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SupplierDueEntry {
  id: string; // purchase_id
  purchase_id?: string;
  supplier_id?: string;
  supplierName: string;
  supplierPhone: string;
  itemPurchased: string; // Summary description
  items?: SupplierPurchaseItem[]; // Multi-item bill breakdown
  item_list?: SupplierPurchaseItem[];
  quantity: string;
  amount: number; // total_amount
  total_amount?: number;
  paidAmount: number; // paid_amount
  paid_amount?: number;
  dueAmount: number; // remaining_amount
  remaining_amount?: number;
  date: string; // YYYY-MM-DD
  purchase_date?: string;
  dueDate: string; // YYYY-MM-DD
  due_date?: string;
  note?: string;
  status: 'pending' | 'partially_paid' | 'paid' | 'overdue';
  payments?: SupplierPayment[];
  paymentHistory?: SupplierPayment[];
  created_at?: string;
  updated_at?: string;
}

export interface CashDenominations {
  n500: number;
  n200: number;
  n100: number;
  n50: number;
  n20: number;
  n10: number;
  coins: number;
}

export interface DailyGalla {
  id: string;
  date: string; // YYYY-MM-DD
  openingCash: number;
  cashIn: number;
  upiIn: number;
  cardIn: number;
  expenseOut: number;
  actualClosingCash: number;
  expectedClosingCash: number;
  cashDifference: number;
  denominations?: CashDenominations;
  isClosed: boolean;
  closedAt?: string;
  note?: string;
}

export type ExpenseCategory = 
  | 'Tea & Snacks'
  | 'Transport / Tempo'
  | 'Electricity & Utilities'
  | 'Shop Rent'
  | 'Packaging & Bags'
  | 'Staff Food'
  | 'Repairs & Maintenance'
  | 'Police & Muni'
  | 'Other';

export interface ExpenseEntry {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  paymentMode: 'cash' | 'upi';
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  note?: string;
}

export interface ShopSettings {
  shopName: string;
  ownerName: string;
  phone: string;
  upiId: string;
  address: string;
  language: Language;
  currency: string;
  autoBackupDaily: boolean;
  lastBackupDate: string;
  workingDaysPerMonth: number;
  voiceAddUdhariEnabled?: boolean;
}

export interface PopularItem {
  id: string;
  itemName: string;
  defaultPrice: number;
  unit?: string; // e.g. "kg", "litre", "piece", "packet"
  createdAt: string;
  updatedAt: string;
}

export interface SupplierPopularItem {
  id: string;
  itemName: string;
  defaultPrice: number;
  unit?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppStateData {
  settings: ShopSettings;
  staffList: Staff[];
  attendance: AttendanceRecord[];
  salaryAdjustments: Record<string, SalaryAdjustment>; // key: staffId_YYYY-MM
  salaryPayments?: StaffSalaryPayment[];
  udhariList: UdhariEntry[];
  customerPayments?: CustomerPaymentRecord[];
  supplierList: SupplierDueEntry[];
  supplierPayments?: SupplierPayment[];
  gallaHistory: DailyGalla[];
  expenseList: ExpenseEntry[];
  popularUdhariItems?: PopularItem[];
  popularSupplierItems?: SupplierPopularItem[];
}
