import React, { useState } from 'react';
import { Clock, Calendar, FileText, CheckCircle, XCircle, AlertCircle, Save, X, Plus, Minus } from 'lucide-react';
import { Staff, AttendanceRecord, AttendanceStatus, Language, SalaryRules } from '../types';
import { translations } from '../translations';
import { formatINR, getTodayDateString } from '../utils/formatters';
import { defaultSalaryRules } from '../utils/salaryCalculator';

interface EditAttendanceModalProps {
  staff: Staff;
  record?: AttendanceRecord;
  language: Language;
  onSave: (record: AttendanceRecord) => void;
  onClose: () => void;
}

export const EditAttendanceModal: React.FC<EditAttendanceModalProps> = ({
  staff,
  record,
  language,
  onSave,
  onClose,
}) => {
  const t = translations[language] || translations.en;
  const todayStr = getTodayDateString();

  const rules: SalaryRules = staff.salaryRules || defaultSalaryRules(staff.basicSalary);
  const standardHours = rules.standardHoursPerDay || 9;
  const initialOtRate = record?.overtimeRate ?? record?.overtime_rate ?? rules.overtimeRatePerHour ?? 100;

  const [date, setDate] = useState(record?.date || todayStr);
  const [status, setStatus] = useState<AttendanceStatus>(record?.status || 'present');
  const [checkInTime, setCheckInTime] = useState(record?.checkInTime || record?.check_in || '09:00');
  const [checkOutTime, setCheckOutTime] = useState(record?.checkOutTime || record?.check_out || '19:00');
  const [totalWorkingHours, setTotalWorkingHours] = useState<number>(
    record?.totalWorkingHours ?? record?.working_hours ?? (record?.overtimeHours ? standardHours + record.overtimeHours : standardHours)
  );
  const [overtimeHours, setOvertimeHours] = useState<number>(record?.overtimeHours ?? record?.overtime_hours ?? 0);
  const [customOtRate, setCustomOtRate] = useState<number>(initialOtRate);
  const [lateMinutes, setLateMinutes] = useState<number>(record?.lateMinutes ?? record?.late_minutes ?? 0);
  const [note, setNote] = useState(record?.note || '');

  // Calculate live overtime amount
  const totalOvertimeAmount = Math.round(overtimeHours * customOtRate);

  const handleWorkingHoursChange = (hours: number) => {
    const validHours = Math.max(0, parseFloat(hours.toFixed(1)));
    setTotalWorkingHours(validHours);
    if (validHours > standardHours) {
      setOvertimeHours(parseFloat((validHours - standardHours).toFixed(1)));
    } else {
      setOvertimeHours(0);
    }
  };

  const handleAdjustOvertime = (delta: number) => {
    const newOT = Math.max(0, parseFloat((overtimeHours + delta).toFixed(1)));
    setOvertimeHours(newOT);
    setTotalWorkingHours(parseFloat((standardHours + newOT).toFixed(1)));
    if (newOT > 0 && status === 'absent') {
      setStatus('present');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedRecord: AttendanceRecord = {
      id: record?.id || `att-${staff.id}-${date}-${Date.now()}`,
      staffId: staff.id,
      staff_id: staff.id,
      date,
      status,
      checkInTime,
      check_in: checkInTime,
      checkOutTime,
      check_out: checkOutTime,
      totalWorkingHours,
      working_hours: totalWorkingHours,
      overtimeHours,
      overtime_hours: overtimeHours,
      overtimeRate: customOtRate,
      overtime_rate: customOtRate,
      overtimeAmount: totalOvertimeAmount,
      overtime_amount: totalOvertimeAmount,
      lateMinutes,
      late_minutes: lateMinutes,
      note: note.trim(),
      created_at: record?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    onSave(updatedRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900 rounded-t-3xl sm:rounded-2xl border border-slate-800 p-5 shadow-2xl space-y-4 my-auto max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              {t.attendance.editAttendance}
            </span>
            <h3 className="text-base font-bold text-white leading-tight">
              {staff.name} <span className="text-xs text-slate-400 font-normal">({staff.role})</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-3.5">
          {/* Date Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              {t.common.date}
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Attendance Status Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              {t.common.status}
            </label>
            <div className="grid grid-cols-6 gap-1 text-[10px] font-bold">
              {(['present', 'half_day', 'late', 'overtime', 'absent', 'leave'] as AttendanceStatus[]).map((st) => (
                <button
                  type="button"
                  key={st}
                  onClick={() => {
                    setStatus(st);
                    if (st === 'overtime' && overtimeHours === 0) {
                      setOvertimeHours(2);
                      setTotalWorkingHours(standardHours + 2);
                    } else if (st === 'half_day') {
                      setTotalWorkingHours(Math.round(standardHours / 2));
                      setOvertimeHours(0);
                    } else if (st === 'absent' || st === 'leave') {
                      setTotalWorkingHours(0);
                      setOvertimeHours(0);
                    }
                  }}
                  className={`py-2 px-0.5 rounded-xl capitalize transition-all border text-center ${
                    status === st
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/40'
                      : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {t.attendance[st as keyof typeof t.attendance] || (st === 'leave' ? (language === 'hi' ? 'छुट्टी' : 'Leave') : st)}
                </button>
              ))}
            </div>
          </div>

          {/* Check-In and Check-Out Time */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {t.attendance.checkIn} (Time)
              </label>
              <input
                type="time"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {t.attendance.checkOut} (Time)
              </label>
              <input
                type="time"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Late Minutes & Overtime Rate Editing */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {language === 'hi' ? 'देरी के मिनट (Late Mins)' : 'Late Minutes'}
              </label>
              <input
                type="number"
                min="0"
                step="5"
                value={lateMinutes}
                onChange={(e) => setLateMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {language === 'hi' ? 'ओवरटाइम दर (₹/घंटा)' : 'Overtime Rate (₹/hr)'}
              </label>
              <input
                type="number"
                min="0"
                step="10"
                value={customOtRate}
                onChange={(e) => setCustomOtRate(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Working Hours & Overtime Controls */}
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">
                  Total Working Hours
                </span>
                <span className="text-[10px] text-slate-400">
                  Standard shift: {standardHours}h / day
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleWorkingHoursChange(totalWorkingHours - 0.5)}
                  className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center font-bold text-xs"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={totalWorkingHours}
                  onChange={(e) => handleWorkingHoursChange(parseFloat(e.target.value) || 0)}
                  className="w-14 text-center bg-slate-900 border border-slate-600 rounded-lg py-1 text-xs font-bold text-white"
                />
                <button
                  type="button"
                  onClick={() => handleWorkingHoursChange(totalWorkingHours + 0.5)}
                  className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center font-bold text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Overtime Hours editing */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-700/60">
              <div>
                <span className="text-xs font-bold text-blue-300 block">
                  Overtime (OT Hours)
                </span>
                <span className="text-[10px] text-slate-400">
                  Rate: {formatINR(customOtRate)}/hr
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAdjustOvertime(-0.5)}
                  className="w-7 h-7 rounded-lg bg-blue-950/70 border border-blue-600/40 text-blue-300 hover:bg-blue-900/70 flex items-center justify-center font-bold text-xs"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="12"
                  value={overtimeHours}
                  onChange={(e) => {
                    const ot = Math.max(0, parseFloat(e.target.value) || 0);
                    setOvertimeHours(ot);
                    setTotalWorkingHours(standardHours + ot);
                  }}
                  className="w-14 text-center bg-slate-900 border border-blue-500/50 rounded-lg py-1 text-xs font-bold text-blue-300"
                />
                <button
                  type="button"
                  onClick={() => handleAdjustOvertime(0.5)}
                  className="w-7 h-7 rounded-lg bg-blue-950/70 border border-blue-600/40 text-blue-300 hover:bg-blue-900/70 flex items-center justify-center font-bold text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Overtime Calculation Preview Card */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-blue-950/40 to-indigo-950/40 border border-blue-500/30 text-xs space-y-1">
            <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider block">
              Overtime Calculation Breakdown
            </span>
            <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-300">
              <div>Regular Hours: <span className="font-bold text-white">{standardHours} hrs</span></div>
              <div>Overtime Hours: <span className="font-bold text-blue-400">{overtimeHours} hrs</span></div>
              <div>Overtime Rate: <span className="font-bold text-white">{formatINR(customOtRate)}/hr</span></div>
              <div>OT Amount: <span className="font-bold text-emerald-400">+{formatINR(totalOvertimeAmount)}</span></div>
            </div>
          </div>

          {/* Owner Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              {t.common.note} (Reason / Remarks)
            </label>
            <input
              type="text"
              placeholder="e.g. Unloaded mandi tempo, stayed late for stock count"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 transition-transform active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{t.common.save}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
