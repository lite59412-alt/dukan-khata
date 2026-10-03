import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  QrCode,
  CheckCircle2,
  XCircle,
  Clock,
  UserPlus,
  FileSpreadsheet,
  AlertCircle,
  DollarSign,
  Sliders,
  Edit3,
  Calendar,
  CreditCard,
  Plus,
  TrendingDown,
  TrendingUp,
  History,
  ArrowLeft,
  ChevronRight,
  Phone,
  Printer,
  Share2,
  Trash2,
  Edit2,
  X,
  Check,
  MessageCircle,
  AlertTriangle,
  Search,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  Staff,
  AttendanceRecord,
  AttendanceStatus,
  Language,
  SalaryAdjustment,
  SalaryRules,
  StaffSalaryPayment,
  ShopSettings,
  SalaryType,
} from '../types';
import { translations } from '../translations';
import { formatINR, formatDate, getTodayDateString } from '../utils/formatters';
import { defaultSalaryRules, calculateStaffSalary } from '../utils/salaryCalculator';
import { generateQrMatrix } from '../utils/qrHelper';
import { EditAttendanceModal } from './EditAttendanceModal';
import { AddSalaryPaymentModal } from './AddSalaryPaymentModal';
import { AttendanceCalendarScreen } from './AttendanceCalendarScreen';
import { PayStaffModal } from './PayStaffModal';
import { StaffPaymentDetailsSection } from './StaffPaymentDetailsSection';
import { StaffPaymentHistorySection } from './StaffPaymentHistorySection';
import { StaffMonthlySummarySection } from './StaffMonthlySummarySection';
import { calculateStaffMonthlySummary } from '../utils/staffMonthlyPayment';

interface StaffTabProps {
  staffList: Staff[];
  attendanceList: AttendanceRecord[];
  salaryAdjustments: Record<string, SalaryAdjustment>;
  salaryPayments?: StaffSalaryPayment[];
  settings: ShopSettings;
  language: Language;
  onUpdateAttendance: (
    staffId: string,
    status: AttendanceStatus,
    overtimeHours?: number,
    lateMinutes?: number
  ) => void;
  onUpdateAttendanceRecord: (record: AttendanceRecord) => void;
  onUpdateSalaryRules: (staffId: string, rules: SalaryRules) => void;
  onOpenQrScanner: () => void;
  onViewStaffQr: (staff: Staff) => void;
  onGenerateSalarySlip: (staff: Staff) => void;
  onAddNewStaff: (newStaff: Omit<Staff, 'id' | 'qrCodeId'>) => void;
  onUpdateStaff?: (staff: Staff) => void;
  onUpdateAdjustment: (staffId: string, adjustment: SalaryAdjustment) => void;
  onAddSalaryPayment?: (payment: Omit<StaffSalaryPayment, 'id' | 'created_at' | 'updated_at'>) => void;
  onEditSalaryPayment?: (payment: StaffSalaryPayment) => void;
  onDeleteSalaryPayment?: (paymentId: string) => void;
}

type SubScreen = 'profile' | 'attendance' | 'salary_payments' | 'salary_rules' | 'qr';

export const StaffTab: React.FC<StaffTabProps> = ({
  staffList,
  attendanceList,
  salaryAdjustments,
  salaryPayments = [],
  settings,
  language,
  onUpdateAttendance,
  onUpdateAttendanceRecord,
  onUpdateSalaryRules,
  onOpenQrScanner,
  onViewStaffQr,
  onGenerateSalarySlip,
  onAddNewStaff,
  onUpdateStaff,
  onUpdateAdjustment,
  onAddSalaryPayment,
  onEditSalaryPayment,
  onDeleteSalaryPayment,
}) => {
  const t = translations[language] || translations.en;
  const todayStr = getTodayDateString();

  // Navigation state: which staff is selected, and which sub-screen is active
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [activeSubScreen, setActiveSubScreen] = useState<SubScreen>('profile');

  // List Screen Filter: All, Present Today, Absent Today, Salary Pending
  const [listFilter, setListFilter] = useState<'all' | 'present' | 'absent' | 'pending'>('all');
  const [staffSearchQuery, setStaffSearchQuery] = useState('');

  // Month selector for Attendance and Salary screens
  const [selectedMonth, setSelectedMonth] = useState('2026-09');

  // Modals
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showEditStaffModal, setShowEditStaffModal] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showPayStaffModal, setShowPayStaffModal] = useState(false);
  const [isEditingPaymentDetails, setIsEditingPaymentDetails] = useState(false);
  const [editingAttendanceRecord, setEditingAttendanceRecord] = useState<AttendanceRecord | null>(null);
  const [showMarkAttendanceModal, setShowMarkAttendanceModal] = useState(false);
  const [showCalendarScreen, setShowCalendarScreen] = useState(false);
  const [calendarInitialStaffId, setCalendarInitialStaffId] = useState<string | undefined>(undefined);

  // New staff form state
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newBasicSalary, setNewBasicSalary] = useState('');

  // Edit staff form state
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editBasicSalary, setEditBasicSalary] = useState('');

  // Salary Rules Form State (when activeSubScreen === 'salary_rules')
  const [rulesSalaryType, setRulesSalaryType] = useState<SalaryType>('monthly');
  const [rulesBasicSalary, setRulesBasicSalary] = useState('');
  const [rulesStandardHours, setRulesStandardHours] = useState('9');
  const [rulesOvertimeRate, setRulesOvertimeRate] = useState('100');
  const [rulesHalfDayType, setRulesHalfDayType] = useState<'fixed' | 'percentage'>('percentage');
  const [rulesHalfDayValue, setRulesHalfDayValue] = useState('50');
  const [rulesLateThreshold, setRulesLateThreshold] = useState('15');
  const [rulesLateType, setRulesLateType] = useState<'fixed' | 'percentage'>('fixed');
  const [rulesLateValue, setRulesLateValue] = useState('50');
  const [rulesAbsenceType, setRulesAbsenceType] = useState<'fixed' | 'daily_rate'>('daily_rate');
  const [rulesAbsenceValue, setRulesAbsenceValue] = useState('500');
  const [rulesAdvance, setRulesAdvance] = useState('0');
  const [rulesLoan, setRulesLoan] = useState('0');
  const [rulesIncentive, setRulesIncentive] = useState('0');
  const [rulesWorkingDays, setRulesWorkingDays] = useState('26');

  // Quick mark attendance form state for selected staff
  const [markDate, setMarkDate] = useState(todayStr);
  const [markStatus, setMarkStatus] = useState<AttendanceStatus>('present');
  const [markCheckIn, setMarkCheckIn] = useState('09:00');
  const [markCheckOut, setMarkCheckOut] = useState('18:00');
  const [markOtHours, setMarkOtHours] = useState('0');
  const [markLateMin, setMarkLateMin] = useState('0');

  // Active selected staff object
  const selectedStaff = useMemo(() => {
    return staffList.find((s) => s.id === selectedStaffId) || null;
  }, [staffList, selectedStaffId]);

  const currentNow = new Date();
  const initialYear = parseInt(todayStr.slice(0, 4), 10) || currentNow.getFullYear() || 2026;
  const initialMonth = parseInt(todayStr.slice(5, 7), 10) || (currentNow.getMonth() + 1) || 10;

  // Monthly summary state for the active staff member
  const [summaryYear, setSummaryYear] = useState<number>(initialYear);
  const [summaryMonth, setSummaryMonth] = useState<number>(initialMonth);
  const [paymentSuccessToast, setPaymentSuccessToast] = useState<string | null>(null);

  // When switching staff member: reset summary month to current month and clear previous totals
  useEffect(() => {
    setSummaryYear(initialYear);
    setSummaryMonth(initialMonth);
    setPaymentSuccessToast(null);
  }, [selectedStaffId, initialYear, initialMonth]);

  // Memoized Monthly Summary for selectedStaff
  const monthlySummary = useMemo(() => {
    if (!selectedStaff) return null;
    return calculateStaffMonthlySummary(
      selectedStaff,
      summaryYear,
      summaryMonth,
      attendanceList,
      salaryPayments,
      salaryAdjustments,
      settings
    );
  }, [selectedStaff, summaryYear, summaryMonth, attendanceList, salaryPayments, salaryAdjustments, settings]);

  const handlePrevMonth = () => {
    setSummaryMonth((prev) => {
      if (prev === 1) {
        setSummaryYear((y) => y - 1);
        return 12;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setSummaryMonth((prev) => {
      if (prev === 12) {
        setSummaryYear((y) => y + 1);
        return 1;
      }
      return prev + 1;
    });
  };

  const handleResetToCurrentMonth = () => {
    setSummaryYear(initialYear);
    setSummaryMonth(initialMonth);
  };

  // Sync edit staff form when opening modal
  const handleOpenEditStaffModal = () => {
    if (!selectedStaff) return;
    setEditName(selectedStaff.name);
    setEditPhone(selectedStaff.phone);
    setEditRole(selectedStaff.role);
    setEditBasicSalary(String(selectedStaff.basicSalary));
    setShowEditStaffModal(true);
  };

  // Save edited staff
  const handleSaveEditStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff || !editName.trim() || !editPhone.trim() || !editBasicSalary) return;

    if (onUpdateStaff) {
      onUpdateStaff({
        ...selectedStaff,
        name: editName.trim(),
        phone: editPhone.trim(),
        role: editRole.trim() || 'Staff',
        basicSalary: parseFloat(editBasicSalary) || selectedStaff.basicSalary,
      });
    }
    setShowEditStaffModal(false);
  };

  // Sync Salary Rules form whenever entering 'salary_rules' sub-screen
  const handleEnterSalaryRulesScreen = (staff: Staff) => {
    const rules = staff.salaryRules || defaultSalaryRules(staff.basicSalary);
    setRulesSalaryType(rules.salaryType || 'monthly');
    setRulesBasicSalary(String(rules.basicSalary || staff.basicSalary));
    setRulesStandardHours(String(rules.standardHoursPerDay || 9));
    setRulesOvertimeRate(String(rules.overtimeRatePerHour || 100));
    setRulesHalfDayType(rules.halfDayDeductionType || 'percentage');
    setRulesHalfDayValue(String(rules.halfDayDeductionValue ?? 50));
    setRulesLateThreshold(String(rules.lateThresholdMinutes || 15));
    setRulesLateType(rules.lateDeductionType || 'fixed');
    setRulesLateValue(String(rules.lateDeductionValue ?? 50));
    setRulesAbsenceType(rules.absenceDeductionType || 'daily_rate');
    setRulesAbsenceValue(String(rules.absenceDeductionValue ?? 500));
    setRulesAdvance(String(rules.advanceAmount || 0));
    setRulesLoan(String(rules.loanDeduction || 0));
    setRulesIncentive(String(rules.incentive || 0));
    setRulesWorkingDays(String(rules.workingDaysPerMonth || 26));
    setActiveSubScreen('salary_rules');
  };

  // Save updated salary rules
  const handleSaveSalaryRules = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;

    const updatedRules: SalaryRules = {
      salaryType: rulesSalaryType,
      basicSalary: parseFloat(rulesBasicSalary) || selectedStaff.basicSalary,
      standardHoursPerDay: parseFloat(rulesStandardHours) || 9,
      overtimeRatePerHour: parseFloat(rulesOvertimeRate) || 100,
      halfDayDeductionType: rulesHalfDayType,
      halfDayDeductionValue: parseFloat(rulesHalfDayValue) || 50,
      lateThresholdMinutes: parseFloat(rulesLateThreshold) || 15,
      lateDeductionType: rulesLateType,
      lateDeductionValue: parseFloat(rulesLateValue) || 50,
      absenceDeductionType: rulesAbsenceType,
      absenceDeductionValue: parseFloat(rulesAbsenceValue) || 500,
      advanceAmount: parseFloat(rulesAdvance) || 0,
      loanDeduction: parseFloat(rulesLoan) || 0,
      incentive: parseFloat(rulesIncentive) || 0,
      workingDaysPerMonth: parseFloat(rulesWorkingDays) || 26,
    };

    onUpdateSalaryRules(selectedStaff.id, updatedRules);
    setActiveSubScreen('profile');
  };

  // Reset salary rules to defaults
  const handleResetSalaryRules = () => {
    if (!selectedStaff) return;
    const def = defaultSalaryRules(selectedStaff.basicSalary);
    setRulesSalaryType(def.salaryType);
    setRulesBasicSalary(String(def.basicSalary));
    setRulesStandardHours(String(def.standardHoursPerDay));
    setRulesOvertimeRate(String(def.overtimeRatePerHour));
    setRulesHalfDayType(def.halfDayDeductionType);
    setRulesHalfDayValue(String(def.halfDayDeductionValue));
    setRulesLateThreshold(String(def.lateThresholdMinutes));
    setRulesLateType(def.lateDeductionType);
    setRulesLateValue(String(def.lateDeductionValue));
    setRulesAbsenceType(def.absenceDeductionType);
    setRulesAbsenceValue(String(def.absenceDeductionValue));
    setRulesAdvance('0');
    setRulesLoan('0');
    setRulesIncentive('0');
    setRulesWorkingDays('26');
  };

  // Add new staff handler
  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim() || !newBasicSalary) return;

    const bgColors = ['bg-emerald-600', 'bg-blue-600', 'bg-amber-600', 'bg-purple-600', 'bg-teal-600', 'bg-rose-600'];
    const randomBg = bgColors[Math.floor(Math.random() * bgColors.length)];

    onAddNewStaff({
      name: newName.trim(),
      phone: newPhone.trim(),
      role: newRole.trim() || 'Staff',
      basicSalary: parseFloat(newBasicSalary) || 12000,
      joinDate: todayStr,
      avatarBg: randomBg,
    });

    setNewName('');
    setNewPhone('');
    setNewRole('');
    setNewBasicSalary('');
    setShowAddStaffModal(false);
  };

  // Helper to get staff salary metrics for selectedMonth
  const getStaffSalaryMetrics = (staff: Staff, monthStr: string = selectedMonth) => {
    const adjKey = `${staff.id}_${monthStr}`;
    const adj = salaryAdjustments[adjKey] || { advanceTaken: 0, loanDeduction: 0, incentive: 0, note: '' };
    const monthAtt = attendanceList.filter((a) => a.staffId === staff.id && a.date.startsWith(monthStr));
    const payments = salaryPayments.filter(
      (p) => p.staff_id === staff.id && (p.salary_month === monthStr || p.salary_month === 'September 2026')
    );
    const breakdown = calculateStaffSalary(staff, monthAtt, adj, 26, monthStr, payments);

    const totalPaid = payments.reduce((acc, p) => acc + (p.paid_amount || 0), 0);
    const remaining = Math.max(0, breakdown.netSalary - totalPaid);

    let status: 'paid' | 'partially_paid' | 'pending' = 'pending';
    if (breakdown.netSalary === 0 || remaining === 0) {
      status = 'paid';
    } else if (totalPaid > 0) {
      status = 'partially_paid';
    }

    return {
      breakdown,
      totalPaid,
      remaining,
      status,
      payments,
    };
  };

  // Helper to get today's attendance status of staff
  const getTodayStatus = (staffId: string): AttendanceStatus | undefined => {
    const rec = attendanceList.find((a) => a.staffId === staffId && a.date === todayStr);
    return rec?.status;
  };

  // Filtered staff list for Screen 1
  const filteredStaffList = useMemo(() => {
    return staffList.filter((staff) => {
      // Status filter
      const todayStatus = getTodayStatus(staff.id);
      if (listFilter === 'present' && todayStatus !== 'present') return false;
      if (listFilter === 'absent' && todayStatus !== 'absent') return false;
      if (listFilter === 'pending') {
        const { status } = getStaffSalaryMetrics(staff);
        if (status === 'paid') return false;
      }

      // Search filter: Name, Phone, Role
      if (staffSearchQuery.trim()) {
        const q = staffSearchQuery.toLowerCase().trim();
        const cleanQ = q.replace(/[^0-9]/g, '');
        const matchesName = staff.name.toLowerCase().includes(q);
        const matchesPhone = cleanQ
          ? staff.phone.replace(/[^0-9]/g, '').includes(cleanQ)
          : staff.phone.includes(q);
        const matchesRole = (staff.role || '').toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesRole) return false;
      }

      return true;
    });
  }, [staffList, listFilter, staffSearchQuery, attendanceList, salaryPayments, salaryAdjustments, selectedMonth]);

  // Today's summary counts
  const presentTodayCount = staffList.filter((s) => getTodayStatus(s.id) === 'present').length;
  const absentTodayCount = staffList.filter((s) => getTodayStatus(s.id) === 'absent').length;

  // Render SVG QR Matrix for Screen 6
  const renderQrSvg = (code: string) => {
    const matrix = generateQrMatrix(code, 21);
    const size = matrix.length;
    const cellSize = 10;
    const totalPx = size * cellSize;

    return (
      <svg
        viewBox={`0 0 ${totalPx} ${totalPx}`}
        className="w-48 h-48 sm:w-56 sm:h-56 mx-auto bg-white p-2 rounded-xl shadow-md"
      >
        {matrix.map((row, r) =>
          row.map((cell, c) =>
            cell ? (
              <rect
                key={`${r}-${c}`}
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize}
                height={cellSize}
                fill="#0f172a"
              />
            ) : null
          )
        )}
      </svg>
    );
  };

  // Submit quick attendance mark
  const handleQuickMarkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;

    const existing = attendanceList.find(
      (a) => a.staffId === selectedStaff.id && a.date === markDate
    );

    const rec: AttendanceRecord = {
      id: existing ? existing.id : `att-${Date.now()}`,
      staffId: selectedStaff.id,
      date: markDate,
      status: markStatus,
      checkInTime: markStatus === 'absent' || markStatus === 'leave' ? undefined : markCheckIn,
      checkOutTime: markStatus === 'absent' || markStatus === 'leave' ? undefined : markCheckOut,
      overtimeHours: parseFloat(markOtHours) || 0,
      lateMinutes: parseFloat(markLateMin) || 0,
    };

    onUpdateAttendanceRecord(rec);
    setShowMarkAttendanceModal(false);
  };

  // Share Salary Slip via WhatsApp
  const handleShareSalarySlipWhatsApp = (staff: Staff) => {
    const { breakdown, totalPaid, remaining } = getStaffSalaryMetrics(staff);
    const cleanPhone = (staff.phone || '').replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const message = `*${settings.shopName} - SALARY SLIP*
Month: ${selectedMonth}
Staff: ${staff.name} (${staff.role})

*Earnings:*
Basic Salary: ${formatINR(breakdown.basicSalary)}
Overtime Amount: ${formatINR(breakdown.overtimePay || 0)}
Incentive: ${formatINR(breakdown.incentive)}
*Gross Earnings:* ${formatINR(breakdown.grossSalary)}

*Deductions:*
Late / Half-day / Absent: ${formatINR(breakdown.lateDeduction + breakdown.absenceDeduction)}
Advance / Loan: ${formatINR(breakdown.advanceDeduction + breakdown.loanDeduction)}
*Total Deductions:* ${formatINR(breakdown.totalDeductions)}

*Net Salary Payable:* ${formatINR(breakdown.netSalary)}
*Paid So Far:* ${formatINR(totalPaid)}
*Balance Remaining:* ${formatINR(remaining)}

Thank you!
${settings.shopName}`;

    window.open(`https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // ===========================================================================
  // ATTENDANCE CALENDAR SCREEN (SEPARATE PAGE)
  // ===========================================================================
  if (showCalendarScreen) {
    return (
      <AttendanceCalendarScreen
        staffList={staffList}
        attendanceList={attendanceList}
        language={language}
        initialStaffId={calendarInitialStaffId || selectedStaffId || staffList[0]?.id}
        onUpdateAttendanceRecord={onUpdateAttendanceRecord}
        onBack={() => setShowCalendarScreen(false)}
        onViewSalarySlip={onGenerateSalarySlip}
      />
    );
  }

  // ===========================================================================
  // SCREEN 3: STAFF ATTENDANCE SCREEN
  // ===========================================================================
  if (selectedStaff && activeSubScreen === 'attendance') {
    const monthAtt = attendanceList
      .filter((a) => a.staffId === selectedStaff.id && a.date.startsWith(selectedMonth))
      .sort((a, b) => b.date.localeCompare(a.date));

    const presentCount = monthAtt.filter((a) => a.status === 'present').length;
    const absentCount = monthAtt.filter((a) => a.status === 'absent').length;
    const halfDayCount = monthAtt.filter((a) => a.status === 'half_day').length;
    const lateCount = monthAtt.filter((a) => a.status === 'late').length;
    const otCount = monthAtt.filter((a) => a.status === 'overtime' || (a.overtimeHours && a.overtimeHours > 0)).length;
    const leaveCount = monthAtt.filter((a) => a.status === 'leave').length;

    const rules = selectedStaff.salaryRules || defaultSalaryRules(selectedStaff.basicSalary);
    const otRate = rules.overtimeRatePerHour || 100;

    return (
      <div className="space-y-4">
        {/* Header with Back button to Staff Profile */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setActiveSubScreen('profile')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold border border-slate-700 transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Profile</span>
          </button>

          <div className="text-right">
            <h2 className="text-sm font-bold text-white leading-tight">
              Staff Attendance
            </h2>
            <p className="text-[11px] text-slate-400">
              {selectedStaff.name} ({selectedStaff.role})
            </p>
          </div>
        </div>

        {/* Month Selector */}
        <div className="bg-slate-900 rounded-2xl p-3 border border-slate-800 flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-purple-400" />
            <span>Select Month:</span>
          </span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-purple-500"
          >
            <option value="2026-09">September 2026</option>
            <option value="2026-08">August 2026</option>
            <option value="2026-07">July 2026</option>
            <option value="2026-06">June 2026</option>
          </select>
        </div>

        {/* Attendance Summary Cards (Required 6 metrics) */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
          {/* Present */}
          <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40">
            <span className="block text-[10px] text-emerald-400 font-semibold mb-0.5">Present</span>
            <span className="text-base font-black text-emerald-400">{presentCount}</span>
          </div>

          {/* Absent */}
          <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/40">
            <span className="block text-[10px] text-rose-400 font-semibold mb-0.5">Absent</span>
            <span className="text-base font-black text-rose-400">{absentCount}</span>
          </div>

          {/* Half Day */}
          <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/40">
            <span className="block text-[10px] text-amber-400 font-semibold mb-0.5">Half Day</span>
            <span className="text-base font-black text-amber-400">{halfDayCount}</span>
          </div>

          {/* Late */}
          <div className="p-2.5 rounded-xl bg-orange-950/40 border border-orange-800/40">
            <span className="block text-[10px] text-orange-400 font-semibold mb-0.5">Late</span>
            <span className="text-base font-black text-orange-400">{lateCount}</span>
          </div>

          {/* Overtime */}
          <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/40">
            <span className="block text-[10px] text-purple-400 font-semibold mb-0.5">Overtime</span>
            <span className="text-base font-black text-purple-400">{otCount}</span>
          </div>

          {/* Leave */}
          <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-800/40">
            <span className="block text-[10px] text-blue-400 font-semibold mb-0.5">Leave</span>
            <span className="text-base font-black text-blue-400">{leaveCount}</span>
          </div>
        </div>

        {/* Action Buttons: Mark Attendance & Scan QR Attendance */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => {
              setMarkDate(todayStr);
              setMarkStatus('present');
              setMarkCheckIn('09:00');
              setMarkCheckOut('18:00');
              setMarkOtHours('0');
              setMarkLateMin('0');
              setShowMarkAttendanceModal(true);
            }}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Mark Attendance</span>
          </button>

          <button
            onClick={onOpenQrScanner}
            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-bold transition-all active:scale-95"
          >
            <QrCode className="w-4 h-4 text-emerald-400" />
            <span>Scan QR Attendance</span>
          </button>
        </div>

        {/* Date-wise Attendance List */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Date-wise Records ({monthAtt.length})
          </h3>

          {monthAtt.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
              No attendance records for {selectedMonth}. Tap "+ Mark Attendance" above.
            </div>
          ) : (
            <div className="space-y-2">
              {monthAtt.map((record) => {
                const dayName = new Date(record.date).toLocaleDateString('en-IN', { weekday: 'short' });
                const otHours = record.overtimeHours || 0;
                const otAmt = Math.round(otHours * otRate);

                // Badge colors strictly as requested:
                // Green = Present, Red = Absent, Orange = Half Day / Late, Purple = Overtime, Blue = Leave
                let statusBadge = (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Present
                  </span>
                );
                if (record.status === 'absent') {
                  statusBadge = (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      Absent
                    </span>
                  );
                } else if (record.status === 'half_day') {
                  statusBadge = (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      Half Day
                    </span>
                  );
                } else if (record.status === 'late') {
                  statusBadge = (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                      Late ({record.lateMinutes || 0}m)
                    </span>
                  );
                } else if (record.status === 'overtime') {
                  statusBadge = (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                      Overtime
                    </span>
                  );
                } else if (record.status === 'leave') {
                  statusBadge = (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      Leave
                    </span>
                  );
                }

                return (
                  <div
                    key={record.id}
                    className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">
                          {formatDate(record.date, language)}
                        </span>
                        <span className="text-[11px] text-slate-400">({dayName})</span>
                        {statusBadge}
                      </div>

                      <button
                        onClick={() => setEditingAttendanceRecord(record)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="Edit Record"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-teal-400" />
                      </button>
                    </div>

                    {/* Check In / Check Out / Hours / Overtime */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-850">
                      <div>
                        In: <strong className="text-white">{record.checkInTime || '--:--'}</strong>
                      </div>
                      <div>
                        Out: <strong className="text-white">{record.checkOutTime || '--:--'}</strong>
                      </div>
                      <div>
                        Late: <strong className={record.lateMinutes ? 'text-amber-400' : 'text-slate-400'}>{record.lateMinutes ? `${record.lateMinutes} min` : 'None'}</strong>
                      </div>
                      <div>
                        OT: <strong className={otHours > 0 ? 'text-purple-400' : 'text-slate-400'}>{otHours > 0 ? `${otHours}h (+${formatINR(otAmt)})` : 'None'}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Edit Attendance Modal */}
        {editingAttendanceRecord && (
          <EditAttendanceModal
            staff={selectedStaff}
            record={editingAttendanceRecord}
            language={language}
            onSave={(updated) => {
              onUpdateAttendanceRecord(updated);
              setEditingAttendanceRecord(null);
            }}
            onClose={() => setEditingAttendanceRecord(null)}
          />
        )}

        {/* Quick Mark Attendance Modal */}
        {showMarkAttendanceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Mark Attendance</h3>
                <button
                  onClick={() => setShowMarkAttendanceModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleQuickMarkSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={markDate}
                    onChange={(e) => setMarkDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Status</label>
                  <select
                    value={markStatus}
                    onChange={(e) => setMarkStatus(e.target.value as AttendanceStatus)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                  >
                    <option value="present">Present (Green)</option>
                    <option value="half_day">Half Day (Orange)</option>
                    <option value="late">Late (Orange)</option>
                    <option value="overtime">Overtime (Purple)</option>
                    <option value="absent">Absent (Red)</option>
                    <option value="leave">Leave (Blue)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Check In</label>
                    <input
                      type="time"
                      value={markCheckIn}
                      onChange={(e) => setMarkCheckIn(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Check Out</label>
                    <input
                      type="time"
                      value={markCheckOut}
                      onChange={(e) => setMarkCheckOut(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">OT Hours</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={markOtHours}
                      onChange={(e) => setMarkOtHours(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Late Minutes</label>
                    <input
                      type="number"
                      min="0"
                      value={markLateMin}
                      onChange={(e) => setMarkLateMin(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowMarkAttendanceModal(false)}
                    className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md"
                  >
                    Save Attendance
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ===========================================================================
  // SCREEN 4: STAFF SALARY AND PAYMENT SCREEN
  // ===========================================================================
  if (selectedStaff && activeSubScreen === 'salary_payments') {
    const { breakdown, totalPaid, remaining, status, payments } = getStaffSalaryMetrics(selectedStaff, selectedMonth);

    return (
      <div className="space-y-4">
        {/* Header with Back button to Staff Profile */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setActiveSubScreen('profile')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold border border-slate-700 transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Profile</span>
          </button>

          <div className="text-right">
            <h2 className="text-sm font-bold text-white leading-tight">
              Salary & Payments
            </h2>
            <p className="text-[11px] text-slate-400">
              {selectedStaff.name} ({selectedStaff.role})
            </p>
          </div>
        </div>

        {/* Month Selector */}
        <div className="bg-slate-900 rounded-2xl p-3 border border-slate-800 flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-purple-400" />
            <span>Salary Month:</span>
          </span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-purple-500"
          >
            <option value="2026-09">September 2026</option>
            <option value="2026-08">August 2026</option>
            <option value="2026-07">July 2026</option>
            <option value="2026-06">June 2026</option>
          </select>
        </div>

        {/* Salary Ledger Summary Card */}
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block">Total Payable Net Salary</span>
              <span className="text-2xl font-black text-white">{formatINR(breakdown.netSalary)}</span>
            </div>

            {/* Payment Status Badge */}
            {status === 'paid' ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Paid
              </span>
            ) : status === 'partially_paid' ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                Partially Paid
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Pending
              </span>
            )}
          </div>

          {/* 3 Metric blocks: Paid, Remaining, Overtime */}
          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40">
              <span className="block text-[10px] text-emerald-400 font-semibold mb-0.5">Total Paid</span>
              <span className="text-sm font-black text-emerald-400">{formatINR(totalPaid)}</span>
            </div>

            <div className={`p-2.5 rounded-xl border ${
              remaining > 0
                ? 'bg-rose-950/40 border-rose-800/40 text-rose-400'
                : 'bg-slate-950/70 border-slate-800 text-slate-400'
            }`}>
              <span className="block text-[10px] text-rose-400 font-semibold mb-0.5">Remaining</span>
              <span className="text-sm font-black">{formatINR(remaining)}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-800/40">
              <span className="block text-[10px] text-purple-400 font-semibold mb-0.5">Overtime Amt</span>
              <span className="text-sm font-black text-purple-400">{formatINR(breakdown.overtimePay || 0)}</span>
            </div>
          </div>

          {/* Deductions Breakdown */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
            <div className="flex justify-between text-slate-400">
              <span>Basic Salary:</span>
              <span className="text-white font-medium">{formatINR(breakdown.basicSalary)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Late / Half-day / Absent Deductions:</span>
              <span className="text-rose-400 font-medium">-{formatINR(breakdown.lateDeduction + breakdown.absenceDeduction)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Advance & Loan Deductions:</span>
              <span className="text-rose-400 font-medium">-{formatINR(breakdown.advanceDeduction + breakdown.loanDeduction)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Incentive / Bonus:</span>
              <span className="text-emerald-400 font-medium">+{formatINR(breakdown.incentive)}</span>
            </div>
          </div>

          {/* Action Buttons: + Add Salary Payment & Share Salary Slip */}
          <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-800">
            <button
              onClick={() => setShowAddPaymentModal(true)}
              className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Salary Payment</span>
            </button>

            <button
              onClick={() => handleShareSalarySlipWhatsApp(selectedStaff)}
              className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-750 text-emerald-400 border border-emerald-500/40 transition-all active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Slip</span>
            </button>
          </div>
        </div>

        {/* Clean Payment History List */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Payment History ({payments.length})
          </h3>

          {payments.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
              No payments recorded for {selectedMonth}. Tap "+ Add Salary Payment" above.
            </div>
          ) : (
            <div className="space-y-2">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-emerald-400">
                        {formatINR(p.paid_amount)}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold uppercase">
                        {p.payment_method}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400">
                      <span>Date: {formatDate(p.payment_date, language)}</span>
                      {p.reference_number && <span> • Ref: {p.reference_number}</span>}
                      {p.note && <span className="italic block mt-0.5">Note: {p.note}</span>}
                    </div>
                  </div>

                  {onDeleteSalaryPayment && (
                    <button
                      onClick={() => onDeleteSalaryPayment(p.id)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete payment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Salary Payment Modal */}
        {showAddPaymentModal && onAddSalaryPayment && (
          <AddSalaryPaymentModal
            staff={selectedStaff}
            salaryMonth={selectedMonth}
            totalSalaryPayable={breakdown.netSalary}
            currentPaid={totalPaid}
            remainingSalary={remaining}
            language={language}
            onSavePayment={(payment: Omit<StaffSalaryPayment, 'id' | 'created_at' | 'updated_at'>) => {
              onAddSalaryPayment(payment);
              setShowAddPaymentModal(false);
            }}
            onClose={() => setShowAddPaymentModal(false)}
          />
        )}
      </div>
    );
  }

  // ===========================================================================
  // SCREEN 5: STAFF SALARY RULES SCREEN
  // ===========================================================================
  if (selectedStaff && activeSubScreen === 'salary_rules') {
    return (
      <div className="space-y-4">
        {/* Header with Back button to Staff Profile */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setActiveSubScreen('profile')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold border border-slate-700 transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Profile</span>
          </button>

          <div className="text-right">
            <h2 className="text-sm font-bold text-white leading-tight">
              Salary Rules
            </h2>
            <p className="text-[11px] text-slate-400">
              {selectedStaff.name} ({selectedStaff.role})
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveSalaryRules} className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-sm space-y-4">
          {/* Salary Type & Basic Rate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Salary Type</label>
              <select
                value={rulesSalaryType}
                onChange={(e) => setRulesSalaryType(e.target.value as SalaryType)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-purple-500"
              >
                <option value="monthly">Monthly Fixed</option>
                <option value="daily">Daily Wage</option>
                <option value="hourly">Hourly Wage</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {rulesSalaryType === 'monthly' ? 'Monthly Basic Salary (₹)' : rulesSalaryType === 'daily' ? 'Daily Wage (₹)' : 'Hourly Wage (₹)'}
              </label>
              <input
                type="number"
                required
                value={rulesBasicSalary}
                onChange={(e) => setRulesBasicSalary(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Standard Working Hours & Overtime Rate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Standard Daily Hours</label>
              <input
                type="number"
                value={rulesStandardHours}
                onChange={(e) => setRulesStandardHours(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Overtime Rate per Hour (₹)</label>
              <input
                type="number"
                value={rulesOvertimeRate}
                onChange={(e) => setRulesOvertimeRate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Half-Day & Late Rules */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Half-Day Deduction</label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={rulesHalfDayType}
                  onChange={(e) => setRulesHalfDayType(e.target.value as 'fixed' | 'percentage')}
                  className="px-2 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                >
                  <option value="percentage">% of Daily</option>
                  <option value="fixed">Fixed ₹</option>
                </select>
                <input
                  type="number"
                  value={rulesHalfDayValue}
                  onChange={(e) => setRulesHalfDayValue(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Late Threshold & Deduction</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min (15)"
                  value={rulesLateThreshold}
                  onChange={(e) => setRulesLateThreshold(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                />
                <input
                  type="number"
                  placeholder="₹ Ded"
                  value={rulesLateValue}
                  onChange={(e) => setRulesLateValue(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                />
              </div>
            </div>
          </div>

          {/* Absence Deduction & Working Days */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Absence Rule</label>
              <select
                value={rulesAbsenceType}
                onChange={(e) => setRulesAbsenceType(e.target.value as 'fixed' | 'daily_rate')}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
              >
                <option value="daily_rate">Deduct 1 Day's Salary</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Month Working Days</label>
              <input
                type="number"
                value={rulesWorkingDays}
                onChange={(e) => setRulesWorkingDays(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
              />
            </div>
          </div>

          {/* Advance, Loan & Incentive */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Advance (₹)</label>
              <input
                type="number"
                value={rulesAdvance}
                onChange={(e) => setRulesAdvance(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Loan Ded (₹)</label>
              <input
                type="number"
                value={rulesLoan}
                onChange={(e) => setRulesLoan(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Incentive (₹)</label>
              <input
                type="number"
                value={rulesIncentive}
                onChange={(e) => setRulesIncentive(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
              />
            </div>
          </div>

          {/* Action Buttons: Save Rules & Reset */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={handleResetSalaryRules}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold transition-colors"
            >
              Reset to Defaults
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-950/40 transition-all active:scale-95"
            >
              Save Rules
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ===========================================================================
  // SCREEN 6: STAFF QR SCREEN
  // ===========================================================================
  if (selectedStaff && activeSubScreen === 'qr') {
    return (
      <div className="space-y-4">
        {/* Header with Back button to Staff Profile */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setActiveSubScreen('profile')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold border border-slate-700 transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Profile</span>
          </button>

          <div className="text-right">
            <h2 className="text-sm font-bold text-white leading-tight">
              Staff QR Code
            </h2>
            <p className="text-[11px] text-slate-400">
              {selectedStaff.name} ({selectedStaff.role})
            </p>
          </div>
        </div>

        {/* QR Card */}
        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-sm text-center space-y-4">
          <div className="space-y-1">
            <div
              className={`w-14 h-14 rounded-2xl ${selectedStaff.avatarBg} text-white font-black text-lg flex items-center justify-center mx-auto shadow-md`}
            >
              {selectedStaff.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()}
            </div>
            <h3 className="text-base font-bold text-white pt-1">{selectedStaff.name}</h3>
            <p className="text-xs text-slate-400">{selectedStaff.role} • {selectedStaff.phone}</p>
            <p className="text-[11px] text-slate-500">ID: {selectedStaff.id}</p>
          </div>

          {/* Visual QR Code */}
          <div className="py-2">
            {renderQrSvg(selectedStaff.qrCodeId)}
            <p className="text-[10px] text-slate-400 mt-2 font-mono">{selectedStaff.qrCodeId}</p>
          </div>

          {/* Action Buttons: Share QR & Print */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
            <button
              onClick={() => {
                const text = `Staff QR ID: ${selectedStaff.qrCodeId}\nName: ${selectedStaff.name}\nShop: ${settings.shopName}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
              }}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-emerald-400 border border-emerald-500/40 text-xs font-bold transition-all active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>Share QR</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-bold transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print QR</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // SCREEN 2: STAFF PROFILE SCREEN
  // ===========================================================================
  if (selectedStaff) {
    const todayStatus = getTodayStatus(selectedStaff.id);
    const { breakdown, totalPaid, remaining, status } = getStaffSalaryMetrics(selectedStaff, selectedMonth);

    return (
      <div className="space-y-4">
        {/* Top Header: Back to Staff List */}
        <div className="flex items-center justify-between gap-3">
          <button
            id="btn-back-to-staff-list"
            onClick={() => setSelectedStaffId(null)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold border border-slate-700 transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Staff List</span>
          </button>

          <h2 className="text-sm font-bold text-white">Staff Profile</h2>
        </div>

        {/* Profile Card: Avatar, Name, Phone, Role, Today Status */}
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-14 h-14 rounded-2xl ${selectedStaff.avatarBg} text-white font-black text-lg flex items-center justify-center shrink-0 shadow-inner`}
              >
                {selectedStaff.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()}
              </div>

              <div>
                <h2 className="text-base font-bold text-white leading-tight">
                  {selectedStaff.name}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">{selectedStaff.role}</p>
                <a
                  href={`tel:${selectedStaff.phone}`}
                  className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1.5 mt-1 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>{selectedStaff.phone}</span>
                </a>
              </div>
            </div>

            {/* Today's Status Badge */}
            <div>
              {todayStatus === 'present' ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Present Today
                </span>
              ) : todayStatus === 'absent' ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  Absent Today
                </span>
              ) : todayStatus === 'half_day' ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Half Day
                </span>
              ) : todayStatus === 'late' ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  Late Today
                </span>
              ) : todayStatus === 'leave' ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  On Leave
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
                  Not Marked
                </span>
              )}
            </div>
          </div>

          {/* Quick Today's Attendance Marking Buttons (1-tap) */}
          <div className="pt-1">
            <p className="text-[11px] font-semibold text-slate-400 mb-1.5">
              Mark Today's Status:
            </p>
            <div className="grid grid-cols-6 gap-1">
              <button
                onClick={() => onUpdateAttendance(selectedStaff.id, 'present')}
                className={`py-2 px-0.5 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center transition-all border ${
                  todayStatus === 'present'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm shadow-emerald-600/40 scale-[1.02]'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700/80'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 mb-0.5" />
                <span>Present</span>
              </button>

              <button
                onClick={() => onUpdateAttendance(selectedStaff.id, 'half_day')}
                className={`py-2 px-0.5 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center transition-all border ${
                  todayStatus === 'half_day'
                    ? 'bg-amber-600 text-white border-amber-500 shadow-sm shadow-amber-600/40 scale-[1.02]'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700/80'
                }`}
              >
                <Clock className="w-3.5 h-3.5 mb-0.5" />
                <span>Half Day</span>
              </button>

              <button
                onClick={() => onUpdateAttendance(selectedStaff.id, 'late', 0, 30)}
                className={`py-2 px-0.5 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center transition-all border ${
                  todayStatus === 'late'
                    ? 'bg-orange-600 text-white border-orange-500 shadow-sm shadow-orange-600/40 scale-[1.02]'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700/80'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5 mb-0.5" />
                <span>Late</span>
              </button>

              <button
                onClick={() => onUpdateAttendance(selectedStaff.id, 'overtime', 2, 0)}
                className={`py-2 px-0.5 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center transition-all border ${
                  todayStatus === 'overtime'
                    ? 'bg-purple-600 text-white border-purple-500 shadow-sm shadow-purple-600/40 scale-[1.02]'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700/80'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 mb-0.5" />
                <span>OT</span>
              </button>

              <button
                onClick={() => onUpdateAttendance(selectedStaff.id, 'absent')}
                className={`py-2 px-0.5 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center transition-all border ${
                  todayStatus === 'absent'
                    ? 'bg-rose-600 text-white border-rose-500 shadow-sm shadow-rose-600/40 scale-[1.02]'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700/80'
                }`}
              >
                <XCircle className="w-3.5 h-3.5 mb-0.5" />
                <span>Absent</span>
              </button>

              <button
                onClick={() => onUpdateAttendance(selectedStaff.id, 'leave')}
                className={`py-2 px-0.5 rounded-xl text-[11px] font-bold flex flex-col items-center justify-center transition-all border ${
                  todayStatus === 'leave'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm shadow-blue-600/40 scale-[1.02]'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700/80'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 mb-0.5" />
                <span>Leave</span>
              </button>
            </div>
          </div>

          {/* Current Month Salary Metrics */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-400">
                Monthly Summary ({monthlySummary?.monthLabel || 'October 2026'})
              </span>
              <span
                className={`font-bold ${
                  monthlySummary?.paymentStatus === 'Paid'
                    ? 'text-emerald-400'
                    : monthlySummary?.paymentStatus === 'Partially Paid'
                    ? 'text-amber-400'
                    : monthlySummary?.paymentStatus === 'Overpaid'
                    ? 'text-purple-400'
                    : 'text-slate-400'
                }`}
              >
                {monthlySummary?.paymentStatus || 'Unpaid'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="block text-[10px] text-slate-400 font-semibold mb-0.5">
                  Monthly Salary
                </span>
                <span className="text-sm font-black text-white">
                  {formatINR(monthlySummary?.monthlySalary ?? selectedStaff.basicSalary)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40">
                <span className="block text-[10px] text-emerald-400 font-semibold mb-0.5">
                  Paid This Month
                </span>
                <span className="text-sm font-black text-emerald-400">
                  {formatINR(monthlySummary?.monthlyPaid || 0)}
                </span>
              </div>

              <div
                className={`p-2.5 rounded-xl border ${
                  (monthlySummary?.monthlyRemaining ?? 0) > 0
                    ? 'bg-rose-950/40 border-rose-800/40 text-rose-400'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400'
                }`}
              >
                <span className="block text-[10px] text-rose-400 font-semibold mb-0.5">
                  Remaining This Month
                </span>
                <span className="text-sm font-black">
                  {formatINR(monthlySummary?.monthlyRemaining ?? selectedStaff.basicSalary)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="block text-[10px] text-slate-400 font-semibold mb-0.5">
                  Payment Status
                </span>
                <span
                  className={`text-sm font-black ${
                    monthlySummary?.paymentStatus === 'Paid'
                      ? 'text-emerald-400'
                      : monthlySummary?.paymentStatus === 'Partially Paid'
                      ? 'text-amber-400'
                      : monthlySummary?.paymentStatus === 'Overpaid'
                      ? 'text-purple-400'
                      : 'text-slate-300'
                  }`}
                >
                  {monthlySummary?.paymentStatus || 'Unpaid'}
                </span>
              </div>
            </div>

            {/* SECTION 3: Large Primary Pay Staff Button & Payment Details Missing Notice */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                id="btn-pay-staff-primary"
                onClick={() => setShowPayStaffModal(true)}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all active:scale-[0.99] cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>Pay Staff</span>
              </button>

              {/* If payment details missing */}
              {(!selectedStaff.upi_id && !selectedStaff.qr_image_url) && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Payment details not added</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingPaymentDetails(true);
                      const el = document.getElementById('section-payment-details');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] transition-colors"
                  >
                    Add Payment Details
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 2: STAFF PROFILE PAYMENT DETAILS */}
        <StaffPaymentDetailsSection
          staff={selectedStaff}
          onUpdateStaff={(updated) => {
            if (onUpdateStaff) {
              onUpdateStaff(updated);
            }
          }}
          isEditingInitially={isEditingPaymentDetails}
          onDoneEditing={() => setIsEditingPaymentDetails(false)}
        />

        {/* 5 CLEAR ACTION BUTTONS TO SUB-SCREENS */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Staff Actions & Detail Screens
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Attendance Calendar Button */}
            <button
              id="btn-nav-attendance-calendar"
              onClick={() => {
                setCalendarInitialStaffId(selectedStaff.id);
                setShowCalendarScreen(true);
              }}
              className="p-4 rounded-2xl bg-purple-950/20 hover:bg-purple-950/40 border border-purple-800/40 flex items-center justify-between gap-3 text-left transition-all active:scale-[0.99] shadow-sm group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                    Attendance Calendar
                  </h4>
                  <p className="text-xs text-slate-400">Monthly calendar with color status & overtime</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-purple-400 group-hover:text-white transition-colors" />
            </button>

            {/* 1. Attendance Screen */}
            <button
              id="btn-nav-attendance"
              onClick={() => setActiveSubScreen('attendance')}
              className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 flex items-center justify-between gap-3 text-left transition-all active:scale-[0.99] shadow-sm group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                    Attendance
                  </h4>
                  <p className="text-xs text-slate-400">View calendar, check-in records & mark</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
            </button>

            {/* 2. Salary & Payments Screen */}
            <button
              id="btn-nav-salary-payments"
              onClick={() => setActiveSubScreen('salary_payments')}
              className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 flex items-center justify-between gap-3 text-left transition-all active:scale-[0.99] shadow-sm group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                    Salary & Payments
                  </h4>
                  <p className="text-xs text-slate-400">Ledger, partial payments & records</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
            </button>

            {/* 3. Salary Rules Screen */}
            <button
              id="btn-nav-salary-rules"
              onClick={() => handleEnterSalaryRulesScreen(selectedStaff)}
              className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 flex items-center justify-between gap-3 text-left transition-all active:scale-[0.99] shadow-sm group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                    Salary Rules
                  </h4>
                  <p className="text-xs text-slate-400">Monthly/Daily rate, OT, Deductions</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
            </button>

            {/* 4. QR Code Screen */}
            <button
              id="btn-nav-qr-code"
              onClick={() => setActiveSubScreen('qr')}
              className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 flex items-center justify-between gap-3 text-left transition-all active:scale-[0.99] shadow-sm group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                    QR Code
                  </h4>
                  <p className="text-xs text-slate-400">ID badge, Attendance QR, Print</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
            </button>

            {/* 5. Edit Staff Modal trigger */}
            <button
              id="btn-nav-edit-staff"
              onClick={handleOpenEditStaffModal}
              className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 flex items-center justify-between gap-3 text-left transition-all active:scale-[0.99] shadow-sm group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors">
                    Edit Staff
                  </h4>
                  <p className="text-xs text-slate-400">Name, Phone number, Job role, Basic</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
            </button>

            {/* Share WhatsApp Salary Slip */}
            <button
              onClick={() => handleShareSalarySlipWhatsApp(selectedStaff)}
              className="p-4 rounded-2xl bg-emerald-950/30 hover:bg-emerald-950/50 border border-emerald-800/40 flex items-center justify-between gap-3 text-left transition-all active:scale-[0.99] shadow-sm group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-300">
                    WhatsApp Salary Slip
                  </h4>
                  <p className="text-xs text-slate-400">Send complete monthly statement</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-emerald-500" />
            </button>
          </div>
        </div>

        {/* Edit Staff Modal */}
        {showEditStaffModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Edit Staff Details</h3>
                <button
                  onClick={() => setShowEditStaffModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEditStaff} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Staff Name *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Job Role</label>
                  <input
                    type="text"
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Basic Monthly Salary (₹) *</label>
                  <input
                    type="number"
                    required
                    value={editBasicSalary}
                    onChange={(e) => setEditBasicSalary(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowEditStaffModal(false)}
                    className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Success Notification Banner after recording payment */}
        {paymentSuccessToast && (
          <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{paymentSuccessToast}</span>
            </div>
            <button
              onClick={() => setPaymentSuccessToast(null)}
              className="text-emerald-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* SECTION 1 & 4: STAFF MONTHLY PAYMENT SUMMARY & MONTH SELECTOR (Above Payment History) */}
        <StaffMonthlySummarySection
          summary={monthlySummary}
          isLoading={false}
          onPreviousMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onResetToCurrentMonth={handleResetToCurrentMonth}
        />

        {/* SECTION 6: STAFF PAYMENT HISTORY */}
        <StaffPaymentHistorySection
          staffId={selectedStaff.id}
          payments={salaryPayments}
          selectedYear={summaryYear}
          selectedMonth={summaryMonth}
          selectedMonthLabel={monthlySummary?.monthLabel}
        />

        {/* SECTION 4 & 5: PAY STAFF MODAL */}
        {showPayStaffModal && (
          <PayStaffModal
            staff={selectedStaff}
            currentSalary={monthlySummary?.monthlySalary || selectedStaff.basicSalary}
            totalPaid={monthlySummary?.monthlyPaid || 0}
            remainingAmount={monthlySummary?.monthlyRemaining ?? selectedStaff.basicSalary}
            onSavePayment={(payment) => {
              if (onAddSalaryPayment) {
                onAddSalaryPayment(payment);
              }
              const amt = Number(payment.amount ?? payment.paid_amount ?? 0);
              setPaymentSuccessToast(`Payment of ${formatINR(amt)} recorded as Completed!`);
              setTimeout(() => {
                setPaymentSuccessToast(null);
              }, 4000);
            }}
            onOpenEditPaymentDetails={() => {
              setShowPayStaffModal(false);
              setIsEditingPaymentDetails(true);
              const el = document.getElementById('section-payment-details');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            onClose={() => setShowPayStaffModal(false)}
          />
        )}
      </div>
    );
  }

  // ===========================================================================
  // SCREEN 1: STAFF LIST SCREEN (DEFAULT ROOT)
  // ===========================================================================
  return (
    <div className="space-y-4">
      {/* Top Header: Total Staff & Action Buttons */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-white">Staff Management</h2>
          <p className="text-xs text-slate-400">
            {staffList.length} {staffList.length === 1 ? 'member' : 'members'} • {presentTodayCount} present today
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Attendance Calendar Button */}
          <button
            id="btn-attendance-calendar-header"
            onClick={() => {
              setCalendarInitialStaffId(staffList[0]?.id);
              setShowCalendarScreen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition-all active:scale-95 shadow-sm"
            title="Open Attendance Calendar"
          >
            <Calendar className="w-4 h-4 text-purple-400" />
            <span>Attendance Calendar</span>
          </button>

          {/* QR Scanner */}
          <button
            id="btn-scan-qr-header"
            onClick={onOpenQrScanner}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-bold transition-all active:scale-95"
            title="Scan Staff QR Code"
          >
            <QrCode className="w-4 h-4 text-emerald-400" />
            <span>QR Scanner</span>
          </button>

          {/* + Add Staff */}
          <button
            id="btn-add-staff-header"
            onClick={() => setShowAddStaffModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 transition-all active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add Staff</span>
          </button>
        </div>
      </div>

      {/* Staff Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          id="input-staff-search"
          type="text"
          value={staffSearchQuery}
          onChange={(e) => setStaffSearchQuery(e.target.value)}
          placeholder={
            language === 'hi'
              ? 'स्टाफ खोजें (नाम, फ़ोन या पद)...'
              : 'Search staff (Name, Phone, Role)...'
          }
          className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
        />
        {staffSearchQuery && (
          <button
            type="button"
            onClick={() => setStaffSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded-full"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter Bar (Required: All, Present Today, Absent Today, Salary Pending) */}
      <div className="grid grid-cols-4 gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
        <button
          onClick={() => setListFilter('all')}
          className={`py-2 px-1 rounded-xl font-bold transition-all ${
            listFilter === 'all'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All ({staffList.length})
        </button>

        <button
          onClick={() => setListFilter('present')}
          className={`py-2 px-1 rounded-xl font-bold transition-all ${
            listFilter === 'present'
              ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-emerald-400'
          }`}
        >
          Present ({presentTodayCount})
        </button>

        <button
          onClick={() => setListFilter('absent')}
          className={`py-2 px-1 rounded-xl font-bold transition-all ${
            listFilter === 'absent'
              ? 'bg-rose-600/30 text-rose-400 border border-rose-500/40 shadow-sm'
              : 'text-slate-400 hover:text-rose-400'
          }`}
        >
          Absent ({absentTodayCount})
        </button>

        <button
          onClick={() => setListFilter('pending')}
          className={`py-2 px-1 rounded-xl font-bold transition-all ${
            listFilter === 'pending'
              ? 'bg-amber-600/30 text-amber-400 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-amber-400'
          }`}
        >
          Pending
        </button>
      </div>

      {/* Clean Staff Cards List (Card shows ONLY required info, tap opens Profile Screen) */}
      <div className="space-y-2.5">
        {filteredStaffList.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 space-y-2">
            <p className="font-semibold text-slate-300">
              {staffSearchQuery.trim()
                ? `No staff matching "${staffSearchQuery}"`
                : 'No staff found for this filter.'}
            </p>
            {staffSearchQuery.trim() && (
              <button
                type="button"
                onClick={() => setStaffSearchQuery('')}
                className="text-xs text-emerald-400 hover:underline font-bold"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          filteredStaffList.map((staff) => {
            const todayStatus = getTodayStatus(staff.id);
            const { remaining, status } = getStaffSalaryMetrics(staff, selectedMonth);

            return (
              <div
                key={staff.id}
                id={`staff-card-${staff.id}`}
                onClick={() => {
                  setSelectedStaffId(staff.id);
                  setActiveSubScreen('profile');
                }}
                className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 shadow-sm flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.99] group"
              >
                {/* Left: Avatar, Name, Phone */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-12 h-12 rounded-2xl ${staff.avatarBg} text-white font-black text-sm flex items-center justify-center shrink-0 shadow-inner`}
                  >
                    {staff.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white leading-tight truncate group-hover:text-emerald-400 transition-colors">
                      {staff.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">
                      {staff.phone} • {staff.role}
                    </p>

                    {/* Today's status badge */}
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {todayStatus === 'present' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Present Today
                        </span>
                      ) : todayStatus === 'absent' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          Absent Today
                        </span>
                      ) : todayStatus === 'half_day' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          Half Day
                        </span>
                      ) : todayStatus === 'late' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                          Late Today
                        </span>
                      ) : todayStatus === 'leave' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          On Leave
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                          Not Marked
                        </span>
                      )}

                      {/* Salary status badge */}
                      {status === 'paid' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Salary Paid
                        </span>
                      ) : status === 'partially_paid' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                          Partially Paid
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          Salary Pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Remaining Amount & Chevron */}
                <div className="flex items-center gap-2 shrink-0">
                  {remaining > 0 ? (
                    <div className="text-right">
                      <span className="block text-[10px] text-slate-400">Balance</span>
                      <span className="text-xs font-black text-rose-400">
                        {formatINR(remaining)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-emerald-400">All Clear</span>
                  )}
                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Staff Modal */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Add New Staff</h3>
              <button
                onClick={() => setShowAddStaffModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Staff Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Job Role</label>
                <input
                  type="text"
                  placeholder="e.g. Helper / Cashier"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Basic Monthly Salary (₹) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 12000"
                  value={newBasicSalary}
                  onChange={(e) => setNewBasicSalary(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md"
                >
                  Add Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
