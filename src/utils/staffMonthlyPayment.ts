import { Staff, AttendanceRecord, SalaryAdjustment, StaffSalaryPayment, ShopSettings } from '../types';
import { calculateStaffSalary, defaultSalaryRules } from './salaryCalculator';

export interface NormalizedStaffPayment {
  id: string;
  payment_id: string;
  staff_id: string;
  amount: number;
  paid_amount: number;
  payment_date: string;
  status: string;
  isCompleted: boolean;
  payment_method: string;
  upi_id?: string;
  transaction_reference?: string;
  note?: string;
  remaining_balance_after?: number;
  raw: any;
}

/**
 * Normalizes payment fields across different model variations.
 * Supports:
 * - amount / paid_amount / paymentAmount
 * - payment_date / paymentDate / date
 * - staff_id / staffId
 * - status / paymentStatus
 */
export function normalizeStaffPayment(p: any): NormalizedStaffPayment {
  if (!p) {
    return {
      id: '',
      payment_id: '',
      staff_id: '',
      amount: 0,
      paid_amount: 0,
      payment_date: '',
      status: '',
      isCompleted: false,
      payment_method: 'Cash',
      raw: p,
    };
  }

  const staff_id = String(p.staff_id || p.staffId || '').trim();

  // Normalize amount
  const rawAmt = p.amount !== undefined ? p.amount : p.paid_amount !== undefined ? p.paid_amount : p.paymentAmount;
  const numAmt = typeof rawAmt === 'number' ? rawAmt : parseFloat(String(rawAmt || 0)) || 0;

  // Normalize date
  const payment_date = String(p.payment_date || p.paymentDate || p.date || '').trim();

  // Normalize status
  const rawStatus = String(p.status || p.paymentStatus || '').trim();
  const lowerStatus = rawStatus.toLowerCase();

  const isFailed = lowerStatus.includes('fail');
  const isCancelled = lowerStatus.includes('cancel');
  const isPending = lowerStatus.includes('pending');
  const isDeleted = Boolean(p.is_deleted || p.deleted || p.isDeleted);

  let isCompleted = false;
  let finalStatus = rawStatus;

  if (!isFailed && !isCancelled && !isPending && !isDeleted) {
    if (
      rawStatus === 'Completed' ||
      rawStatus === 'Payment Completed' ||
      lowerStatus === 'completed' ||
      (!rawStatus && numAmt > 0)
    ) {
      isCompleted = true;
      if (!finalStatus || finalStatus === 'Payment Completed') {
        finalStatus = 'Completed';
      }
    }
  }

  return {
    id: String(p.id || p.payment_id || `spay-${Date.now()}`),
    payment_id: String(p.payment_id || p.id || ''),
    staff_id,
    amount: numAmt,
    paid_amount: numAmt,
    payment_date,
    status: finalStatus || (isCompleted ? 'Completed' : 'Pending'),
    isCompleted,
    payment_method: p.payment_method || p.paymentMethod || 'Cash',
    upi_id: p.upi_id || p.upiId,
    transaction_reference: p.transaction_reference || p.transactionReference || p.reference_number || p.referenceNumber,
    note: p.note,
    remaining_balance_after:
      p.remaining_balance_after !== undefined ? Number(p.remaining_balance_after) : undefined,
    raw: p,
  };
}

/**
 * Parses payment_date into a Date object safely.
 */
export function parsePaymentDate(dateStr: string): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const cleanStr = dateStr.trim();
  const ymdMatch = cleanStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (ymdMatch) {
    const y = parseInt(ymdMatch[1], 10);
    const m = parseInt(ymdMatch[2], 10) - 1;
    const d = parseInt(ymdMatch[3], 10);
    const timeMatch = cleanStr.match(/T(\d{1,2}):(\d{1,2}):?(\d{1,2})?/);
    if (timeMatch) {
      const hh = parseInt(timeMatch[1], 10);
      const mm = parseInt(timeMatch[2], 10);
      const ss = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
      return new Date(y, m, d, hh, mm, ss);
    }
    return new Date(y, m, d, 0, 0, 0, 0);
  }
  const parsed = new Date(cleanStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export type MonthlyPaymentStatus = 'Unpaid' | 'Partially Paid' | 'Paid' | 'Overpaid';

export interface StaffMonthlySummary {
  staffId: string;
  year: number;
  month: number; // 1-12
  monthLabel: string; // e.g. "October 2026"
  monthlySalary: number;
  monthlyPaid: number;
  monthlyRemaining: number;
  paymentStatus: MonthlyPaymentStatus;
  isUsingCurrentSalary: boolean;
  completedPayments: NormalizedStaffPayment[];
  allMonthPayments: NormalizedStaffPayment[];
}

/**
 * Calculates current month summary for a staff member.
 * Requirements:
 * - monthStart = first day of current month at 00:00:00
 * - monthEnd = first day of next month at 00:00:00
 * - payment.staff_id == selectedStaffId
 * - payment.payment_date >= monthStart && payment.payment_date < monthEnd
 * - payment.status == "Completed"
 * - monthlyPaid = sum of completed payment.amount
 * - monthlyRemaining = Math.max(0, monthlySalary - monthlyPaid)
 * - Status logic:
 *   monthlyPaid == 0 -> Unpaid
 *   monthlyPaid > 0 && monthlyRemaining > 0 -> Partially Paid
 *   monthlyRemaining == 0 -> Paid
 *   monthlyPaid > monthlySalary -> Overpaid
 */
export function calculateStaffMonthlySummary(
  staff: Staff,
  year: number,
  month: number, // 1 to 12
  attendanceList: AttendanceRecord[] = [],
  salaryPayments: StaffSalaryPayment[] = [],
  salaryAdjustments: Record<string, SalaryAdjustment> = {},
  settings?: ShopSettings
): StaffMonthlySummary {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthLabel = `${monthNames[month - 1]} ${year}`;
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;

  // Month date bounds
  const monthStart = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const monthEnd = new Date(year, month, 1, 0, 0, 0, 0);

  // Normalize payments belonging strictly to selected staff
  const staffPayments = (salaryPayments || [])
    .map(normalizeStaffPayment)
    .filter((p) => p.staff_id === staff.id);

  // Filter payments within the month window using payment_date
  const allMonthPayments = staffPayments.filter((p) => {
    const pDate = parsePaymentDate(p.payment_date);
    if (!pDate) return false;
    const t = pDate.getTime();
    return t >= monthStart.getTime() && t < monthEnd.getTime();
  });

  // Only include completed payments
  const completedPayments = allMonthPayments.filter((p) => p.isCompleted);

  // Calculate monthlyPaid
  const monthlyPaid = completedPayments.reduce((sum, p) => sum + p.amount, 0);

  // Calculate monthlySalary
  // Check attendance records for this month
  const monthAtt = attendanceList.filter(
    (a) => (a.staffId === staff.id || (a as any).staff_id === staff.id) && a.date.startsWith(monthKey)
  );

  const adjKey = `${staff.id}_${monthKey}`;
  const adjustment = salaryAdjustments[adjKey] || { advanceTaken: 0, loanDeduction: 0, incentive: 0, note: '' };
  const workingDays = settings?.workingDaysPerMonth || 26;

  let monthlySalary = 0;
  let isUsingCurrentSalary = false;

  if (monthAtt.length > 0) {
    const calc = calculateStaffSalary(staff, monthAtt, adjustment, workingDays, monthLabel);
    if (calc.netSalary > 0) {
      monthlySalary = calc.netSalary;
    }
  }

  // If no month-specific attendance salary exists:
  // "Use the staff member's current monthly salary. Do not show zero. Add a small note: 'Using current salary'"
  if (monthlySalary === 0) {
    const baseSal = Number(staff.basicSalary) || Number(staff.salaryRules?.basicSalary) || 0;
    if (baseSal > 0) {
      monthlySalary = baseSal;
      isUsingCurrentSalary = true;
    }
  }

  // Calculate monthlyRemaining
  const monthlyRemaining = Math.max(0, monthlySalary - monthlyPaid);

  // Determine Payment Status
  let paymentStatus: MonthlyPaymentStatus = 'Unpaid';
  if (monthlyPaid === 0) {
    paymentStatus = 'Unpaid';
  } else if (monthlyPaid > monthlySalary) {
    paymentStatus = 'Overpaid';
  } else if (monthlyRemaining === 0 || monthlyPaid === monthlySalary) {
    paymentStatus = 'Paid';
  } else if (monthlyPaid > 0 && monthlyRemaining > 0) {
    paymentStatus = 'Partially Paid';
  }

  return {
    staffId: staff.id,
    year,
    month,
    monthLabel,
    monthlySalary,
    monthlyPaid,
    monthlyRemaining,
    paymentStatus,
    isUsingCurrentSalary,
    completedPayments,
    allMonthPayments,
  };
}
