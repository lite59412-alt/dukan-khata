import React, { useState, useMemo } from 'react';
import {
  X,
  Calendar,
  Clock,
  Filter,
  ChevronLeft,
  ChevronRight,
  Edit2,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileText,
  User,
  Plus,
} from 'lucide-react';
import { Staff, AttendanceRecord, AttendanceStatus, Language, SalaryRules } from '../types';
import { translations, statusColors } from '../translations';
import { formatINR, formatDate } from '../utils/formatters';
import { defaultSalaryRules } from '../utils/salaryCalculator';
import { EditAttendanceModal } from './EditAttendanceModal';

interface StaffAttendanceHistoryModalProps {
  staffList: Staff[];
  attendanceList: AttendanceRecord[];
  language: Language;
  initialStaffId?: string;
  onUpdateAttendanceRecord: (record: AttendanceRecord) => void;
  onClose: () => void;
}

export const StaffAttendanceHistoryModal: React.FC<StaffAttendanceHistoryModalProps> = ({
  staffList,
  attendanceList,
  language,
  initialStaffId,
  onUpdateAttendanceRecord,
  onClose,
}) => {
  const t = translations[language] || translations.en;

  const [selectedStaffId, setSelectedStaffId] = useState<string>(
    initialStaffId || staffList[0]?.id || ''
  );
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-09');
  const [statusFilter, setStatusFilter] = useState<'all' | AttendanceStatus>('all');
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);

  const currentStaff = useMemo(() => {
    return staffList.find((s) => s.id === selectedStaffId) || staffList[0];
  }, [staffList, selectedStaffId]);

  const rules: SalaryRules = currentStaff?.salaryRules || defaultSalaryRules(currentStaff?.basicSalary || 15000);
  const otRate = rules.overtimeRatePerHour || 100;
  const standardHours = rules.standardHoursPerDay || 9;

  // Filter attendance records for current staff and selected month
  const staffRecords = useMemo(() => {
    if (!currentStaff) return [];
    return attendanceList
      .filter((a) => (a.staffId === currentStaff.id || a.staff_id === currentStaff.id))
      .filter((a) => a.date.startsWith(selectedMonth))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [attendanceList, currentStaff, selectedMonth]);

  // Compute summary stats
  const stats = useMemo(() => {
    let presentCount = 0;
    let absentCount = 0;
    let halfDayCount = 0;
    let lateCount = 0;
    let overtimeCount = 0;
    let leaveCount = 0;
    let totalOtHours = 0;

    staffRecords.forEach((r) => {
      if (r.status === 'present') presentCount += 1;
      else if (r.status === 'absent') absentCount += 1;
      else if (r.status === 'half_day') halfDayCount += 1;
      else if (r.status === 'late') lateCount += 1;
      else if (r.status === 'overtime') overtimeCount += 1;
      else if (r.status === 'leave') leaveCount += 1;

      const ot = r.overtimeHours || r.overtime_hours || 0;
      if (ot > 0) {
        totalOtHours += ot;
        if (r.status !== 'overtime') {
          overtimeCount += 1;
        }
      }
    });

    return {
      presentDays: presentCount,
      absentDays: absentCount,
      halfDays: halfDayCount,
      lateDays: lateCount,
      overtimeDays: overtimeCount,
      leaveDays: leaveCount,
      totalOtHours,
    };
  }, [staffRecords]);

  // Filtered rows for list view
  const filteredRecords = useMemo(() => {
    if (statusFilter === 'all') return staffRecords;
    return staffRecords.filter((r) => r.status === statusFilter);
  }, [staffRecords, statusFilter]);

  // Status color helper matching requirements:
  // Green = Present, Red = Absent, Orange = Half Day or Late, Blue = Leave, Purple = Overtime
  const getStatusStyle = (status: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'absent':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'half_day':
      case 'late':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'leave':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'overtime':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getStatusLabel = (status: AttendanceStatus) => {
    if (status === 'half_day') return language === 'hi' ? 'आधा दिन (Half Day)' : 'Half Day';
    if (status === 'leave') return language === 'hi' ? 'छुट्टी (Leave)' : 'Leave';
    if (status === 'present') return language === 'hi' ? 'उपस्थित (Present)' : 'Present';
    if (status === 'absent') return language === 'hi' ? 'अनुपस्थित (Absent)' : 'Absent';
    if (status === 'late') return language === 'hi' ? 'देरी से (Late)' : 'Late';
    if (status === 'overtime') return language === 'hi' ? 'ओवरटाइम (Overtime)' : 'Overtime';
    return status;
  };

  const getDayName = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', { weekday: 'short' });
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 rounded-t-3xl sm:rounded-2xl border border-slate-800 shadow-2xl p-4 sm:p-6 space-y-4 my-auto max-h-[96vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                {language === 'hi' ? 'हाजिरी इतिहास' : 'Attendance History'}
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'hi' ? 'दैनिक उपस्थिति व ओवरटाइम का पूरा विवरण' : 'Detailed daily attendance & overtime records'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Staff & Month Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Staff Member Selector */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              {language === 'hi' ? 'स्टाफ सदस्य चुनें' : 'Select Staff Member'}
            </label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-purple-500"
            >
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.role})
                </option>
              ))}
            </select>
          </div>

          {/* Month Selector */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              {language === 'hi' ? 'माह चुनें' : 'Select Month'}
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Summary KPI Cards Grid (Requirement 5) */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-center">
            <span className="block text-[10px] font-bold text-emerald-400 uppercase">
              {language === 'hi' ? 'उपस्थित' : 'Present'}
            </span>
            <span className="text-base font-black text-white">{stats.presentDays}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-center">
            <span className="block text-[10px] font-bold text-rose-400 uppercase">
              {language === 'hi' ? 'अनुपस्थित' : 'Absent'}
            </span>
            <span className="text-base font-black text-white">{stats.absentDays}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-center">
            <span className="block text-[10px] font-bold text-amber-400 uppercase">
              {language === 'hi' ? 'आधा दिन' : 'Half Day'}
            </span>
            <span className="text-base font-black text-white">{stats.halfDays}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-orange-950/40 border border-orange-500/30 text-center">
            <span className="block text-[10px] font-bold text-orange-400 uppercase">
              {language === 'hi' ? 'देरी' : 'Late'}
            </span>
            <span className="text-base font-black text-white">{stats.lateDays}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-center">
            <span className="block text-[10px] font-bold text-purple-400 uppercase">
              {language === 'hi' ? 'ओवरटाइम' : 'Overtime'}
            </span>
            <span className="text-base font-black text-white">{stats.overtimeDays}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-500/30 text-center">
            <span className="block text-[10px] font-bold text-blue-400 uppercase">
              {language === 'hi' ? 'कुल OT घंटे' : 'OT Hours'}
            </span>
            <span className="text-base font-black text-blue-300">{stats.totalOtHours}h</span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-semibold scrollbar-none">
          {[
            { key: 'all', label: language === 'hi' ? 'सभी' : 'All' },
            { key: 'present', label: language === 'hi' ? 'उपस्थित' : 'Present' },
            { key: 'absent', label: language === 'hi' ? 'अनुपस्थित' : 'Absent' },
            { key: 'half_day', label: language === 'hi' ? 'आधा दिन' : 'Half Day' },
            { key: 'late', label: language === 'hi' ? 'देरी से' : 'Late' },
            { key: 'overtime', label: language === 'hi' ? 'ओवरटाइम' : 'Overtime' },
            { key: 'leave', label: language === 'hi' ? 'छुट्टी' : 'Leave' },
          ].map((pill) => (
            <button
              key={pill.key}
              onClick={() => setStatusFilter(pill.key as any)}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap border ${
                statusFilter === pill.key
                  ? 'bg-purple-600 text-white border-purple-500 font-bold shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Daily Attendance Records List View (Requirement 5) */}
        <div className="space-y-2">
          {filteredRecords.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500 bg-slate-950/40 rounded-2xl border border-slate-800">
              <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-1 opacity-40" />
              <p>{language === 'hi' ? 'कोई उपस्थिति रिकॉर्ड नहीं मिला।' : 'No attendance records found for this filter.'}</p>
            </div>
          ) : (
            filteredRecords.map((rec) => {
              const otHours = rec.overtimeHours || rec.overtime_hours || 0;
              const otAmount = otHours > 0 ? Math.round(otHours * otRate) : 0;
              const checkIn = rec.checkInTime || rec.check_in || '--:--';
              const checkOut = rec.checkOutTime || rec.check_out || '--:--';
              const workingHours = rec.totalWorkingHours || rec.working_hours || (rec.status === 'present' ? standardHours : 0);
              const lateMins = rec.lateMinutes || rec.late_minutes || 0;

              return (
                <div
                  key={rec.id}
                  className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                >
                  {/* Left: Date & Status */}
                  <div className="flex items-center gap-3">
                    <div className="text-center min-w-[50px] p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase">
                        {getDayName(rec.date)}
                      </span>
                      <span className="block text-sm font-black text-white">
                        {rec.date.split('-')[2]}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${getStatusStyle(rec.status)}`}>
                          {getStatusLabel(rec.status)}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {formatDate(rec.date, language)}
                        </span>
                      </div>

                      {/* Working Hours & Timings */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-300">
                        <span>
                          {language === 'hi' ? 'आगमन / प्रस्थान:' : 'In / Out:'} <strong className="text-white">{checkIn} - {checkOut}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          {language === 'hi' ? 'कुल घंटे:' : 'Total:'} <strong className="text-white">{workingHours}h</strong>
                        </span>
                        {lateMins > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-orange-400 font-semibold">
                              {language === 'hi' ? `देरी: ${lateMins} मि.` : `Late: ${lateMins}m`}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Overtime & Note */}
                      {(otHours > 0 || rec.note) && (
                        <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px]">
                          {otHours > 0 && (
                            <span className="text-blue-300 font-semibold bg-blue-950/60 px-2 py-0.5 rounded border border-blue-500/30">
                              OT: +{otHours}h (+{formatINR(otAmount)})
                            </span>
                          )}
                          {rec.note && (
                            <span className="text-slate-400 italic">
                              "{rec.note}"
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Edit Button (Requirement 6) */}
                  <div className="flex items-center justify-end">
                    <button
                      onClick={() => setEditingRecord(rec)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-all active:scale-95"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{language === 'hi' ? 'संपादित करें' : 'Edit'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Edit Attendance Modal Triggered from Row (Requirement 6) */}
        {editingRecord && currentStaff && (
          <EditAttendanceModal
            staff={currentStaff}
            record={editingRecord}
            language={language}
            onSave={(updated) => {
              onUpdateAttendanceRecord({
                ...updated,
                updated_at: new Date().toISOString(),
              });
              setEditingRecord(null);
            }}
            onClose={() => setEditingRecord(null)}
          />
        )}
      </div>
    </div>
  );
};
