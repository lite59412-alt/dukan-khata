import { Staff, AttendanceRecord, SalaryAdjustment, SalaryCalculationResult, SalaryRules, StaffSalaryPayment } from '../types';

export const defaultSalaryRules = (staffBasicSalary: number, workingDays: number = 26): SalaryRules => {
  const dailyRate = Math.round(staffBasicSalary / Math.max(1, workingDays));
  const hourlyRate = Math.round(dailyRate / 9);
  return {
    salaryType: 'monthly',
    basicSalary: staffBasicSalary,
    standardHoursPerDay: 9,
    overtimeRatePerHour: Math.round(hourlyRate * 1.5) || 100,
    halfDayDeductionType: 'percentage',
    halfDayDeductionValue: 50,
    lateThresholdMinutes: 15,
    lateDeductionType: 'fixed',
    lateDeductionValue: 50,
    absenceDeductionType: 'daily_rate',
    absenceDeductionValue: dailyRate,
    advanceAmount: 0,
    loanDeduction: 0,
    incentive: 0,
    workingDaysPerMonth: workingDays,
  };
};

export function calculateStaffSalary(
  staff: Staff,
  attendanceRecords: AttendanceRecord[],
  adjustment?: SalaryAdjustment,
  defaultWorkingDays: number = 26,
  monthName: string = 'September 2026',
  salaryPayments?: StaffSalaryPayment[]
): SalaryCalculationResult {
  const rules: SalaryRules = staff.salaryRules || defaultSalaryRules(staff.basicSalary, defaultWorkingDays);
  const staffAttendance = attendanceRecords.filter((a) => (a.staffId === staff.id || a.staff_id === staff.id));

  let presentDays = 0;
  let halfDays = 0;
  let absentDays = 0;
  let lateDays = 0;
  let leaveDays = 0;
  let overtimeHours = 0;
  let lateMinutes = 0;

  staffAttendance.forEach((att) => {
    switch (att.status) {
      case 'present':
        presentDays += 1;
        break;
      case 'half_day':
        halfDays += 1;
        break;
      case 'absent':
        absentDays += 1;
        break;
      case 'late':
        presentDays += 1;
        lateDays += 1;
        lateMinutes += att.lateMinutes || att.late_minutes || 30;
        break;
      case 'overtime':
        presentDays += 1;
        break;
      case 'leave':
        leaveDays += 1;
        break;
    }

    const otHrs = att.overtimeHours ?? att.overtime_hours ?? 0;
    if (otHrs > 0) {
      overtimeHours += otHrs;
    }
  });

  const workingDays = rules.workingDaysPerMonth || defaultWorkingDays || 26;
  const basicSalary = rules.basicSalary || staff.basicSalary;
  
  // Rate calculations
  let dailyRate = 0;
  if (rules.salaryType === 'daily') {
    dailyRate = basicSalary;
  } else if (rules.salaryType === 'hourly') {
    dailyRate = basicSalary * rules.standardHoursPerDay;
  } else {
    dailyRate = Math.round(basicSalary / Math.max(1, workingDays));
  }

  // Base earned calculation
  let baseEarned = basicSalary;
  if (rules.salaryType === 'daily') {
    baseEarned = Math.round(presentDays * dailyRate + halfDays * (dailyRate / 2));
  } else if (rules.salaryType === 'hourly') {
    baseEarned = Math.round(presentDays * rules.standardHoursPerDay * basicSalary);
  }

  // Overtime calculation
  const overtimeRate = rules.overtimeRatePerHour || Math.round((dailyRate / (rules.standardHoursPerDay || 9)) * 1.5);
  const overtimePay = Math.round(overtimeHours * overtimeRate);

  // Incentive
  const incentive = (adjustment?.incentive ?? rules.incentive) || 0;

  // Deductions
  // Late deduction
  let lateDeduction = 0;
  if (lateDays > 0) {
    if (rules.lateDeductionType === 'fixed') {
      lateDeduction = lateDays * rules.lateDeductionValue;
    } else {
      lateDeduction = Math.round((dailyRate * (rules.lateDeductionValue / 100)) * lateDays);
    }
  }

  // Absence deduction
  let absenceDeduction = 0;
  if (rules.salaryType === 'monthly') {
    if (rules.absenceDeductionType === 'daily_rate') {
      absenceDeduction = Math.round(absentDays * dailyRate);
    } else {
      absenceDeduction = Math.round(absentDays * rules.absenceDeductionValue);
    }
    // Half day deduction if monthly
    if (halfDays > 0) {
      if (rules.halfDayDeductionType === 'percentage') {
        absenceDeduction += Math.round(halfDays * (dailyRate * (rules.halfDayDeductionValue / 100)));
      } else {
        absenceDeduction += Math.round(halfDays * rules.halfDayDeductionValue);
      }
    }
  }

  const advanceDeduction = (adjustment?.advanceTaken ?? rules.advanceAmount) || 0;
  const loanDeduction = (adjustment?.loanDeduction ?? rules.loanDeduction) || 0;
  const totalDeductions = lateDeduction + absenceDeduction + advanceDeduction + loanDeduction;

  const grossSalary = baseEarned + overtimePay + incentive;
  const netSalary = Math.max(0, grossSalary - totalDeductions);

  // Ledger payment tracking
  const matchingPayments = (salaryPayments || []).filter((p) => {
    if (p.staff_id !== staff.id) return false;
    if (!p.salary_month) return true;
    return p.salary_month.toLowerCase().includes('sep') || p.salary_month.includes('2026-09') || p.salary_month === monthName;
  });

  const totalPaid = matchingPayments.reduce((sum, p) => sum + p.paid_amount, 0);
  const remainingSalary = Math.max(0, netSalary - totalPaid);

  let paymentStatus: 'paid' | 'partially_paid' | 'pending' = 'pending';
  if (remainingSalary === 0 && (totalPaid > 0 || netSalary === 0)) {
    paymentStatus = 'paid';
  } else if (totalPaid > 0 && remainingSalary > 0) {
    paymentStatus = 'partially_paid';
  } else {
    paymentStatus = 'pending';
  }

  return {
    staffId: staff.id,
    staffName: staff.name,
    role: staff.role,
    month: monthName,
    totalDaysInMonth: workingDays,
    basicSalary,
    dailyRate,
    presentDays,
    halfDays,
    absentDays,
    lateDays,
    leaveDays,
    overtimeHours,
    overtimeRate,
    standardHoursPerDay: rules.standardHoursPerDay,
    salaryType: rules.salaryType,
    baseEarned,
    overtimePay,
    incentive,
    grossSalary,
    lateDeduction,
    absenceDeduction,
    advanceDeduction,
    loanDeduction,
    totalDeductions,
    netSalary,
    totalPaid,
    remainingSalary,
    paymentStatus,
    payments: matchingPayments,
  };
}
