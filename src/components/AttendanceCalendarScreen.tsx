import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  ArrowLeft,
  Edit2,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  Search,
  User,
  Filter,
  DollarSign,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { Staff, AttendanceRecord, AttendanceStatus, Language, SalaryRules } from '../types';
import { translations } from '../translations';
import { formatINR, formatDate, getTodayDateString } from '../utils/formatters';
import { defaultSalaryRules, calculateStaffSalary } from '../utils/salaryCalculator';
import { EditAttendanceModal } from './EditAttendanceModal';

interface AttendanceCalendarScreenProps {
  staffList: Staff[];
  attendanceList: AttendanceRecord[];
  language: Language;
  initialStaffId?: string;
  onUpdateAttendanceRecord: (record: AttendanceRecord) => void;
  onBack: () => void;
  onViewSalarySlip?: (staff: Staff) => void;
}

export const AttendanceCalendarScreen: React.FC<AttendanceCalendarScreenProps> = ({
  staffList,
  attendanceList,
  language,
  initialStaffId,
  onUpdateAttendanceRecord,
  onBack,
  onViewSalarySlip,
}) => {
  const t = translations[language] || translations.en;
  const todayStr = getTodayDateString();

  // Active staff selection
  const [selectedStaffId, setSelectedStaffId] = useState<string>(
    initialStaffId || staffList[0]?.id || ''
  );
  const [staffSearchQuery, setStaffSearchQuery] = useState('');

  // Month state (YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => todayStr.slice(0, 7));

  // Selected date for Date Details card (defaults to today or 1st of month)
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Status Filter option
  const [statusFilter, setStatusFilter] = useState<'all' | AttendanceStatus | 'no_record'>('all');

  // Full Month Details modal toggle
  const [showFullMonthModal, setShowFullMonthModal] = useState(false);

  // Modal for editing attendance
  const [editingRecord, setEditingRecord] = useState<{
    record?: AttendanceRecord;
    date: string;
  } | null>(null);

  // Selected staff object
  const currentStaff = useMemo(() => {
    return staffList.find((s) => s.id === selectedStaffId) || staffList[0] || null;
  }, [staffList, selectedStaffId]);

  // Staff search filtering
  const filteredStaffDropdown = useMemo(() => {
    if (!staffSearchQuery.trim()) return staffList;
    const q = staffSearchQuery.toLowerCase();
    return staffList.filter(
      (s) => s.name.toLowerCase().includes(q) || s.role.toLowerCase().includes(q)
    );
  }, [staffList, staffSearchQuery]);

  // Salary rules & rate helpers
  const rules: SalaryRules = useMemo(() => {
    if (!currentStaff) return defaultSalaryRules(15000);
    return currentStaff.salaryRules || defaultSalaryRules(currentStaff.basicSalary);
  }, [currentStaff]);

  const standardHours = rules.standardHoursPerDay || 9;
  const dailyRate = Math.round((rules.basicSalary || 15000) / (rules.workingDaysPerMonth || 26));
  const otRate = rules.overtimeRatePerHour || Math.round((dailyRate / standardHours) * 1.5) || 100;

  // Calendar dates computation for selectedMonth
  const { year, monthNum, daysInMonth, firstDayOfWeek, monthNameLong, calendarCells } =
    useMemo(() => {
      const [yStr, mStr] = selectedMonth.split('-');
      const y = parseInt(yStr, 10);
      const m = parseInt(mStr, 10); // 1-indexed

      const dateObj = new Date(y, m - 1, 1);
      const daysCount = new Date(y, m, 0).getDate();
      const firstDay = dateObj.getDay(); // 0 is Sunday, 1 is Monday...

      const monthName = dateObj.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', {
        month: 'long',
        year: 'numeric',
      });

      // Construct grid cells: empty padding + day numbers
      const cells: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

      // Leading padding cells from previous month
      const prevMonthDays = new Date(y, m - 1, 0).getDate();
      for (let i = firstDay - 1; i >= 0; i--) {
        const d = prevMonthDays - i;
        const prevMonthNum = m - 1 === 0 ? 12 : m - 1;
        const prevYear = m - 1 === 0 ? y - 1 : y;
        const dStr = `${prevYear}-${String(prevMonthNum).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        cells.push({ dateStr: dStr, dayNum: d, isCurrentMonth: false });
      }

      // Current month days
      for (let d = 1; d <= daysCount; d++) {
        const dStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        cells.push({ dateStr: dStr, dayNum: d, isCurrentMonth: true });
      }

      // Trailing padding cells to complete final row (multiples of 7)
      const remaining = (7 - (cells.length % 7)) % 7;
      for (let d = 1; d <= remaining; d++) {
        const nextMonthNum = m + 1 === 13 ? 1 : m + 1;
        const nextYear = m + 1 === 13 ? y + 1 : y;
        const dStr = `${nextYear}-${String(nextMonthNum).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        cells.push({ dateStr: dStr, dayNum: d, isCurrentMonth: false });
      }

      return {
        year: y,
        monthNum: m,
        daysInMonth: daysCount,
        firstDayOfWeek: firstDay,
        monthNameLong: monthName,
        calendarCells: cells,
      };
    }, [selectedMonth, language]);

  // Attendance records map for selected staff and month
  const attendanceByDate = useMemo(() => {
    if (!currentStaff) return new Map<string, AttendanceRecord>();
    const map = new Map<string, AttendanceRecord>();
    attendanceList.forEach((att) => {
      const matchStaff = att.staffId === currentStaff.id || att.staff_id === currentStaff.id;
      if (matchStaff) {
        map.set(att.date, att);
      }
    });
    return map;
  }, [attendanceList, currentStaff]);

  // Navigate months
  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    const newMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonthStr);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(y, m, 1);
    const newMonthStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonthStr);
  };

  // Jump to Today
  const handleJumpToToday = () => {
    const currMonth = todayStr.slice(0, 7);
    setSelectedMonth(currMonth);
    setSelectedDate(todayStr);
  };

  // Status Color specs required by user:
  // - Green = Present
  // - Red = Absent
  // - Orange = Half Day
  // - Yellow = Late
  // - Purple = Overtime
  // - Blue = Leave
  // - Grey = No Record
  const getStatusColorConfig = (status?: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return {
          label: 'Present',
          dotBg: 'bg-emerald-500',
          badgeClass: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
          calendarBg: 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300',
        };
      case 'absent':
        return {
          label: 'Absent',
          dotBg: 'bg-rose-500',
          badgeClass: 'bg-rose-500/20 text-rose-400 border border-rose-500/40',
          calendarBg: 'bg-rose-500/15 border-rose-500/50 text-rose-300',
        };
      case 'half_day':
        return {
          label: 'Half Day',
          dotBg: 'bg-orange-500',
          badgeClass: 'bg-orange-500/20 text-orange-400 border border-orange-500/40',
          calendarBg: 'bg-orange-500/15 border-orange-500/50 text-orange-300',
        };
      case 'late':
        return {
          label: 'Late',
          dotBg: 'bg-yellow-400',
          badgeClass: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40',
          calendarBg: 'bg-yellow-500/15 border-yellow-500/50 text-yellow-200',
        };
      case 'overtime':
        return {
          label: 'Overtime',
          dotBg: 'bg-purple-500',
          badgeClass: 'bg-purple-500/20 text-purple-300 border border-purple-500/40',
          calendarBg: 'bg-purple-500/15 border-purple-500/50 text-purple-300',
        };
      case 'leave':
        return {
          label: 'Leave',
          dotBg: 'bg-blue-500',
          badgeClass: 'bg-blue-500/20 text-blue-400 border border-blue-500/40',
          calendarBg: 'bg-blue-500/15 border-blue-500/50 text-blue-300',
        };
      default:
        return {
          label: 'No Record',
          dotBg: 'bg-slate-600',
          badgeClass: 'bg-slate-800 text-slate-400 border border-slate-700',
          calendarBg: 'bg-slate-900/60 border-slate-800/80 text-slate-400',
        };
    }
  };

  // Section 3: Month Summary for selected staff and month
  const monthSummary = useMemo(() => {
    let presentDays = 0;
    let absentDays = 0;
    let halfDays = 0;
    let lateDays = 0;
    let leaveDays = 0;
    let overtimeDays = 0;
    let totalOvertimeHours = 0;
    let totalOvertimeAmount = 0;

    // Iterate through all days of this month
    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const rec = attendanceByDate.get(dStr);
      if (!rec) continue;

      const st = rec.status;
      if (st === 'present') presentDays += 1;
      else if (st === 'absent') absentDays += 1;
      else if (st === 'half_day') halfDays += 1;
      else if (st === 'late') lateDays += 1;
      else if (st === 'leave') leaveDays += 1;
      else if (st === 'overtime') {
        presentDays += 1;
        overtimeDays += 1;
      }

      const ot = rec.overtimeHours || rec.overtime_hours || 0;
      if (ot > 0) {
        totalOvertimeHours += ot;
        const rate = rec.overtimeRate || rec.overtime_rate || otRate;
        totalOvertimeAmount += Math.round(ot * rate);
        if (st !== 'overtime') {
          overtimeDays += 1;
        }
      }
    }

    // Salary deductions calculation:
    // 1. Absence deduction
    let absenceDeduction = 0;
    if (rules.absenceDeductionType === 'daily_rate') {
      absenceDeduction = Math.round(absentDays * dailyRate);
    } else {
      absenceDeduction = Math.round(absentDays * (rules.absenceDeductionValue || dailyRate));
    }

    // 2. Half day deduction
    let halfDayDeduction = 0;
    if (halfDays > 0) {
      if (rules.halfDayDeductionType === 'percentage') {
        halfDayDeduction = Math.round(halfDays * (dailyRate * ((rules.halfDayDeductionValue || 50) / 100)));
      } else {
        halfDayDeduction = Math.round(halfDays * (rules.halfDayDeductionValue || Math.round(dailyRate / 2)));
      }
    }

    // 3. Late deduction
    let lateDeduction = 0;
    if (lateDays > 0) {
      if (rules.lateDeductionType === 'fixed') {
        lateDeduction = lateDays * (rules.lateDeductionValue || 50);
      } else {
        lateDeduction = Math.round((dailyRate * ((rules.lateDeductionValue || 10) / 100)) * lateDays);
      }
    }

    const totalSalaryDeduction = absenceDeduction + halfDayDeduction + lateDeduction;

    return {
      presentDays,
      absentDays,
      halfDays,
      lateDays,
      leaveDays,
      overtimeDays,
      totalOvertimeHours: parseFloat(totalOvertimeHours.toFixed(1)),
      totalOvertimeAmount,
      totalSalaryDeduction,
      absenceDeduction,
      halfDayDeduction,
      lateDeduction,
    };
  }, [daysInMonth, year, monthNum, attendanceByDate, rules, dailyRate, otRate]);

  // Section 2: Selected Date Details computed
  const selectedDateRecord = attendanceByDate.get(selectedDate);
  const selectedDateConfig = getStatusColorConfig(selectedDateRecord?.status);

  // Compute live amounts for selected date
  const selectedDateOtHours = selectedDateRecord?.overtimeHours || selectedDateRecord?.overtime_hours || 0;
  const selectedDateOtRate = selectedDateRecord?.overtimeRate || selectedDateRecord?.overtime_rate || otRate;
  const selectedDateOtAmount = Math.round(selectedDateOtHours * selectedDateOtRate);

  const selectedDateHalfDayAmount = selectedDateRecord?.status === 'half_day'
    ? Math.round(dailyRate / 2)
    : 0;

  const selectedDateWorkingHours = selectedDateRecord?.totalWorkingHours ??
    selectedDateRecord?.working_hours ??
    (selectedDateRecord?.status === 'present'
      ? standardHours + selectedDateOtHours
      : selectedDateRecord?.status === 'half_day'
      ? Math.round(standardHours / 2)
      : selectedDateRecord?.status === 'overtime'
      ? standardHours + selectedDateOtHours
      : 0);

  // Export Attendance CSV Functionality
  const handleExportAttendance = () => {
    if (!currentStaff) return;
    const headers = [
      'Date',
      'Day',
      'Staff Name',
      'Status',
      'Check In',
      'Check Out',
      'Working Hours',
      'Late Minutes',
      'Overtime Hours',
      'Overtime Amount (INR)',
      'Notes',
    ];

    const rows: string[][] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const rec = attendanceByDate.get(dStr);
      const dayName = new Date(year, monthNum - 1, d).toLocaleDateString('en-US', { weekday: 'short' });

      const st = rec?.status || 'No Record';
      const cIn = rec?.checkInTime || rec?.check_in || '-';
      const cOut = rec?.checkOutTime || rec?.check_out || '-';
      const wHours = rec?.totalWorkingHours ?? (rec?.status === 'present' ? standardHours : 0);
      const lMin = rec?.lateMinutes || rec?.late_minutes || 0;
      const otH = rec?.overtimeHours || rec?.overtime_hours || 0;
      const otAmt = Math.round(otH * (rec?.overtimeRate || otRate));
      const note = (rec?.note || '').replace(/,/g, ';');

      rows.push([
        dStr,
        dayName,
        `"${currentStaff.name}"`,
        st.toUpperCase(),
        cIn,
        cOut,
        String(wHours),
        String(lMin),
        String(otH),
        String(otAmt),
        `"${note}"`,
      ]);
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const cleanStaffName = currentStaff.name.replace(/\s+/g, '_');
    link.setAttribute('download', `Attendance_${cleanStaffName}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format date display (e.g. "28 Sep 2026, Monday")
  const formatDateHeading = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        weekday: 'long',
      });
    } catch {
      return dateStr;
    }
  };

  if (!currentStaff) {
    return (
      <div className="p-6 text-center text-slate-400 space-y-3">
        <p>No staff member found. Please add a staff member first.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold"
        >
          Back to Staff
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-150 pb-12">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between gap-3">
        <button
          id="btn-back-staff-tab"
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold border border-slate-700 transition-all active:scale-95 shrink-0 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Staff</span>
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <div className="text-right min-w-0">
            <h1 className="text-sm sm:text-base font-extrabold text-white tracking-tight truncate flex items-center justify-end gap-1.5">
              <CalendarIcon className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Attendance Calendar</span>
            </h1>
            <p className="text-[11px] text-slate-400 truncate">
              {currentStaff.name} ({currentStaff.role})
            </p>
          </div>
        </div>
      </div>

      {/* Staff Selector & Search Option */}
      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5 shadow-lg">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Staff Member Selector */}
          <div className="flex-1 flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-400 shrink-0" />
            <select
              id="select-calendar-staff"
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
            >
              {filteredStaffDropdown.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.role}) • ₹{s.basicSalary}/mo
                </option>
              ))}
            </select>
          </div>

          {/* Search/Filter by staff name */}
          <div className="relative sm:w-44">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={staffSearchQuery}
              onChange={(e) => setStaffSearchQuery(e.target.value)}
              placeholder="Search staff..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Month Selector & Controls + Today Button */}
      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-2 shadow-lg">
        {/* Month Stepper */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="font-bold text-xs sm:text-sm text-white px-2 tracking-wide">
            {monthNameLong}
          </span>

          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Action Controls: Today Button + Status Filter Option */}
        <div className="flex items-center gap-2">
          {/* Today Button */}
          <button
            id="btn-calendar-today"
            onClick={handleJumpToToday}
            className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-400 text-xs font-bold transition-all active:scale-95 shadow-sm"
          >
            Today
          </button>

          {/* Filter Option Dropdown */}
          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-300 text-xs font-semibold focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Days</option>
              <option value="present">Present (Green)</option>
              <option value="absent">Absent (Red)</option>
              <option value="half_day">Half Day (Orange)</option>
              <option value="late">Late (Yellow)</option>
              <option value="overtime">Overtime (Purple)</option>
              <option value="leave">Leave (Blue)</option>
              <option value="no_record">No Record (Grey)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Color Legend (as specified in User Request) */}
      <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex flex-wrap items-center justify-center gap-x-3.5 gap-y-1.5 text-[11px] font-semibold text-slate-300">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Present</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span>Absent</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
          <span>Half Day</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <span>Late</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
          <span>Overtime</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span>Leave</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
          <span className="text-slate-400">No Record</span>
        </span>
      </div>

      {/* ========================================================================= */}
      {/* 1. ATTENDANCE CALENDAR GRID VIEW */}
      {/* ========================================================================= */}
      <div className="p-3.5 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[11px] font-extrabold text-slate-400 uppercase tracking-wider pb-1">
          <span className="text-rose-400">Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span className="text-blue-400">Sat</span>
        </div>

        {/* Date Cells */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {calendarCells.map((cell, idx) => {
            const rec = attendanceByDate.get(cell.dateStr);
            const statusConfig = getStatusColorConfig(rec?.status);
            const isToday = cell.dateStr === todayStr;
            const isSelected = cell.dateStr === selectedDate;

            // Filter check
            let isDimmed = false;
            if (statusFilter !== 'all') {
              if (statusFilter === 'no_record') {
                isDimmed = !!rec;
              } else {
                isDimmed = rec?.status !== statusFilter;
              }
            }

            return (
              <button
                key={`${cell.dateStr}-${idx}`}
                onClick={() => setSelectedDate(cell.dateStr)}
                className={`min-h-[52px] sm:min-h-[64px] p-1 sm:p-1.5 rounded-2xl flex flex-col justify-between items-center transition-all relative border text-left ${
                  cell.isCurrentMonth ? statusConfig.calendarBg : 'bg-slate-950/40 border-slate-850 text-slate-600'
                } ${
                  isSelected
                    ? 'ring-2 ring-emerald-400 shadow-lg scale-[1.04] z-10'
                    : 'hover:border-slate-600'
                } ${isDimmed ? 'opacity-25' : 'opacity-100'} active:scale-95`}
              >
                {/* Day Number and Today Badge */}
                <div className="w-full flex items-center justify-between">
                  <span
                    className={`text-xs sm:text-sm font-black ${
                      isToday
                        ? 'w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-[11px]'
                        : isSelected
                        ? 'text-white font-extrabold'
                        : cell.isCurrentMonth
                        ? 'text-slate-200'
                        : 'text-slate-600'
                    }`}
                  >
                    {cell.dayNum}
                  </span>

                  {/* Overtime indicator pill if OT exists */}
                  {rec && (rec.overtimeHours || 0) > 0 && (
                    <span className="text-[9px] font-black text-purple-300 bg-purple-500/30 px-1 rounded">
                      +{rec.overtimeHours}h
                    </span>
                  )}
                </div>

                {/* Status Dot / Short Tag */}
                <div className="w-full flex items-center justify-center mt-1">
                  {rec?.status ? (
                    <span
                      className={`text-[9px] sm:text-[10px] font-bold truncate max-w-full px-1 rounded uppercase tracking-tighter ${
                        rec.status === 'present'
                          ? 'text-emerald-400'
                          : rec.status === 'absent'
                          ? 'text-rose-400'
                          : rec.status === 'half_day'
                          ? 'text-orange-400'
                          : rec.status === 'late'
                          ? 'text-yellow-300'
                          : rec.status === 'overtime'
                          ? 'text-purple-300'
                          : 'text-blue-400'
                      }`}
                    >
                      {rec.status === 'half_day'
                        ? 'Half'
                        : rec.status === 'overtime'
                        ? 'OT'
                        : rec.status}
                    </span>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DATE DETAILS SECTION (When owner taps a date) */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        {/* Header of Date Details */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Date Details
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${selectedDateConfig.badgeClass}`}>
                {selectedDateConfig.label}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
              {formatDateHeading(selectedDate)}
            </h3>
            <p className="text-xs text-slate-400">
              Staff: <strong className="text-white">{currentStaff.name}</strong> • Role: {currentStaff.role}
            </p>
          </div>

          {/* Edit Attendance Button */}
          <button
            id="btn-edit-attendance-date"
            onClick={() =>
              setEditingRecord({
                record: selectedDateRecord,
                date: selectedDate,
              })
            }
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 transition-all active:scale-95 shrink-0"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>{selectedDateRecord ? 'Edit Attendance' : 'Mark Attendance'}</span>
          </button>
        </div>

        {/* Detailed Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          {/* Check-In Time */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Check-In Time
            </span>
            <span className="font-mono text-sm font-bold text-white block">
              {selectedDateRecord?.checkInTime || selectedDateRecord?.check_in || '—'}
            </span>
          </div>

          {/* Check-Out Time */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Check-Out Time
            </span>
            <span className="font-mono text-sm font-bold text-white block">
              {selectedDateRecord?.checkOutTime || selectedDateRecord?.check_out || '—'}
            </span>
          </div>

          {/* Total Working Hours */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Working Hours
            </span>
            <span className="font-mono text-sm font-bold text-emerald-400 block">
              {selectedDateWorkingHours > 0 ? `${selectedDateWorkingHours} hrs` : '0 hrs'}
            </span>
          </div>

          {/* Late Minutes */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Late Minutes
            </span>
            <span
              className={`font-mono text-sm font-bold block ${
                (selectedDateRecord?.lateMinutes || 0) > 0 ? 'text-yellow-400' : 'text-slate-400'
              }`}
            >
              {selectedDateRecord?.lateMinutes || selectedDateRecord?.late_minutes || 0} mins
            </span>
          </div>

          {/* Overtime Hours */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">
              Overtime Hours
            </span>
            <span className="font-mono text-sm font-bold text-purple-300 block">
              {selectedDateOtHours > 0 ? `+${selectedDateOtHours} hrs` : '0 hrs'}
            </span>
          </div>

          {/* Overtime Amount */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">
              Overtime Amount
            </span>
            <span className="font-mono text-sm font-bold text-purple-300 block">
              {selectedDateOtAmount > 0 ? formatINR(selectedDateOtAmount) : '₹0'}
            </span>
          </div>

          {/* Half-Day Amount */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider block">
              Half-Day Amount
            </span>
            <span className="font-mono text-sm font-bold text-orange-300 block">
              {selectedDateHalfDayAmount > 0 ? formatINR(selectedDateHalfDayAmount) : '₹0'}
            </span>
          </div>

          {/* Standard Shift */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Standard Shift
            </span>
            <span className="font-mono text-sm font-bold text-white block">
              {standardHours} hrs / day
            </span>
          </div>
        </div>

        {/* Notes Preview */}
        <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
            Notes / Remarks:
          </span>
          <p className="text-slate-300 italic">
            {selectedDateRecord?.note ? `"${selectedDateRecord.note}"` : 'No notes recorded for this date.'}
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MONTH SUMMARY SECTION */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
          <div>
            <h3 className="text-base font-black text-white leading-tight">
              Month Summary ({monthNameLong})
            </h3>
            <p className="text-xs text-slate-400">
              Complete attendance & salary deduction metrics for {currentStaff.name}
            </p>
          </div>

          {/* Action Buttons: View Full Month Details & Export Attendance */}
          <div className="flex items-center gap-2">
            <button
              id="btn-export-attendance-csv"
              onClick={handleExportAttendance}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold border border-slate-700 transition-all active:scale-95 shadow-sm"
              title="Download CSV attendance sheet"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>Export Attendance</span>
            </button>

            <button
              id="btn-view-full-month"
              onClick={() => setShowFullMonthModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-950/40 transition-all active:scale-95"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>View Full Month Details</span>
            </button>
          </div>
        </div>

        {/* 9 Required Month Summary Metrics Cards */}
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 gap-2.5 text-center text-xs">
          {/* 1. Present days */}
          <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-800/40">
            <span className="block text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-0.5">
              Present Days
            </span>
            <span className="text-lg font-black text-emerald-300">
              {monthSummary.presentDays}
            </span>
          </div>

          {/* 2. Absent days */}
          <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-800/40">
            <span className="block text-[10px] text-rose-400 font-bold uppercase tracking-wider mb-0.5">
              Absent Days
            </span>
            <span className="text-lg font-black text-rose-300">
              {monthSummary.absentDays}
            </span>
          </div>

          {/* 3. Half days */}
          <div className="p-3 rounded-2xl bg-orange-950/40 border border-orange-800/40">
            <span className="block text-[10px] text-orange-400 font-bold uppercase tracking-wider mb-0.5">
              Half Days
            </span>
            <span className="text-lg font-black text-orange-300">
              {monthSummary.halfDays}
            </span>
          </div>

          {/* 4. Late days */}
          <div className="p-3 rounded-2xl bg-yellow-950/40 border border-yellow-800/40">
            <span className="block text-[10px] text-yellow-400 font-bold uppercase tracking-wider mb-0.5">
              Late Days
            </span>
            <span className="text-lg font-black text-yellow-300">
              {monthSummary.lateDays}
            </span>
          </div>

          {/* 5. Leave days */}
          <div className="p-3 rounded-2xl bg-blue-950/40 border border-blue-800/40">
            <span className="block text-[10px] text-blue-400 font-bold uppercase tracking-wider mb-0.5">
              Leave Days
            </span>
            <span className="text-lg font-black text-blue-300">
              {monthSummary.leaveDays}
            </span>
          </div>

          {/* 6. Overtime days */}
          <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-800/40">
            <span className="block text-[10px] text-purple-400 font-bold uppercase tracking-wider mb-0.5">
              Overtime Days
            </span>
            <span className="text-lg font-black text-purple-300">
              {monthSummary.overtimeDays}
            </span>
          </div>

          {/* 7. Total overtime hours */}
          <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-800/40">
            <span className="block text-[10px] text-purple-400 font-bold uppercase tracking-wider mb-0.5">
              Total OT Hours
            </span>
            <span className="text-lg font-black text-purple-300">
              {monthSummary.totalOvertimeHours}h
            </span>
          </div>

          {/* 8. Total overtime amount */}
          <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-800/40">
            <span className="block text-[10px] text-purple-400 font-bold uppercase tracking-wider mb-0.5">
              Total OT Amount
            </span>
            <span className="text-lg font-black text-purple-300">
              {formatINR(monthSummary.totalOvertimeAmount)}
            </span>
          </div>

          {/* 9. Total salary deduction */}
          <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-800/40 col-span-3 sm:col-span-1 md:col-span-2">
            <span className="block text-[10px] text-rose-400 font-bold uppercase tracking-wider mb-0.5">
              Total Salary Deduction
            </span>
            <span className="text-lg font-black text-rose-300">
              -{formatINR(monthSummary.totalSalaryDeduction)}
            </span>
            <span className="block text-[10px] text-slate-400 mt-0.5">
              Absence: {formatINR(monthSummary.absenceDeduction)} • Half: {formatINR(monthSummary.halfDayDeduction)} • Late: {formatINR(monthSummary.lateDeduction)}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FULL MONTH DETAILS MODAL */}
      {/* ========================================================================= */}
      {showFullMonthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-2xl w-full max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  Full Month Statement - {monthNameLong}
                </h3>
                <p className="text-xs text-slate-400">
                  {currentStaff.name} ({currentStaff.role}) • Base Salary: {formatINR(currentStaff.basicSalary)}
                </p>
              </div>
              <button
                onClick={() => setShowFullMonthModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Month Table */}
            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden divide-y divide-slate-850 text-xs">
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                  const dStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                  const rec = attendanceByDate.get(dStr);
                  const cfg = getStatusColorConfig(rec?.status);
                  const dayName = new Date(year, monthNum - 1, d).toLocaleDateString('en-US', {
                    weekday: 'short',
                  });

                  return (
                    <div
                      key={dStr}
                      className="p-2.5 px-3.5 flex items-center justify-between hover:bg-slate-900/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-white w-6">{d}</span>
                        <span className="text-[11px] text-slate-400 w-8">{dayName}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.badgeClass}`}>
                          {cfg.label}
                        </span>
                        {rec?.checkInTime && (
                          <span className="text-[11px] text-slate-300 hidden sm:inline">
                            {rec.checkInTime} - {rec.checkOutTime || '19:00'}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        {(rec?.overtimeHours || 0) > 0 && (
                          <span className="text-[11px] text-purple-400 font-bold">
                            +{rec?.overtimeHours}h OT
                          </span>
                        )}
                        {(rec?.lateMinutes || 0) > 0 && (
                          <span className="text-[11px] text-yellow-400">
                            {rec?.lateMinutes}m Late
                          </span>
                        )}
                        <button
                          onClick={() => {
                            setShowFullMonthModal(false);
                            setSelectedDate(dStr);
                            setEditingRecord({ record: rec, date: dStr });
                          }}
                          className="p-1 rounded text-slate-400 hover:text-white"
                          title="Edit Date"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
              <button
                onClick={handleExportAttendance}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={() => setShowFullMonthModal(false)}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. EDIT ATTENDANCE MODAL (Allows owner to edit and save) */}
      {/* ========================================================================= */}
      {editingRecord && (
        <EditAttendanceModal
          staff={currentStaff}
          record={
            editingRecord.record || {
              id: `att-${currentStaff.id}-${editingRecord.date}`,
              staffId: currentStaff.id,
              date: editingRecord.date,
              status: 'present',
              checkInTime: '09:00',
              checkOutTime: '19:00',
              totalWorkingHours: standardHours,
              overtimeHours: 0,
              overtimeRate: otRate,
              lateMinutes: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          }
          language={language}
          onSave={(updatedRec) => {
            // Recalculate and preserve updated_at
            const enrichedRec: AttendanceRecord = {
              ...updatedRec,
              staffId: currentStaff.id,
              staff_id: currentStaff.id,
              date: editingRecord.date,
              updated_at: new Date().toISOString(),
            };
            onUpdateAttendanceRecord(enrichedRec);
            setEditingRecord(null);
          }}
          onClose={() => setEditingRecord(null)}
        />
      )}
    </div>
  );
};
