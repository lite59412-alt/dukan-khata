import React, { useState } from 'react';
import { Sliders, X, Save, Calculator, Info } from 'lucide-react';
import { Staff, SalaryRules, SalaryType, Language } from '../types';
import { translations } from '../translations';
import { defaultSalaryRules } from '../utils/salaryCalculator';
import { formatINR } from '../utils/formatters';

interface StaffSalaryRulesModalProps {
  staff: Staff;
  language: Language;
  onSave: (staffId: string, rules: SalaryRules) => void;
  onClose: () => void;
}

export const StaffSalaryRulesModal: React.FC<StaffSalaryRulesModalProps> = ({
  staff,
  language,
  onSave,
  onClose,
}) => {
  const t = translations[language] || translations.en;
  const initialRules: SalaryRules = staff.salaryRules || defaultSalaryRules(staff.basicSalary);

  const [salaryType, setSalaryType] = useState<SalaryType>(initialRules.salaryType || 'monthly');
  const [basicSalary, setBasicSalary] = useState(String(initialRules.basicSalary || staff.basicSalary));
  const [standardHours, setStandardHours] = useState(String(initialRules.standardHoursPerDay || 9));
  const [overtimeRate, setOvertimeRate] = useState(String(initialRules.overtimeRatePerHour || 100));
  const [halfDayType, setHalfDayType] = useState<'fixed' | 'percentage'>(initialRules.halfDayDeductionType || 'percentage');
  const [halfDayValue, setHalfDayValue] = useState(String(initialRules.halfDayDeductionValue ?? 50));
  const [lateThreshold, setLateThreshold] = useState(String(initialRules.lateThresholdMinutes || 15));
  const [lateDedType, setLateDedType] = useState<'fixed' | 'percentage'>(initialRules.lateDeductionType || 'fixed');
  const [lateDedValue, setLateDedValue] = useState(String(initialRules.lateDeductionValue ?? 50));
  const [absenceDedType, setAbsenceDedType] = useState<'fixed' | 'daily_rate'>(initialRules.absenceDeductionType || 'daily_rate');
  const [absenceDedValue, setAbsenceDedValue] = useState(String(initialRules.absenceDeductionValue ?? 500));
  const [advanceAmount, setAdvanceAmount] = useState(String(initialRules.advanceAmount || 0));
  const [loanDeduction, setLoanDeduction] = useState(String(initialRules.loanDeduction || 0));
  const [incentive, setIncentive] = useState(String(initialRules.incentive || 0));
  const [workingDays, setWorkingDays] = useState(String(initialRules.workingDaysPerMonth || 26));

  // Live estimated formula preview
  const numBasic = parseFloat(basicSalary) || 0;
  const numDays = parseFloat(workingDays) || 26;
  const estDailyRate = salaryType === 'daily' ? numBasic : Math.round(numBasic / Math.max(1, numDays));
  const numOT = parseFloat(overtimeRate) || 0;
  const numAdv = parseFloat(advanceAmount) || 0;
  const numLoan = parseFloat(loanDeduction) || 0;
  const numInc = parseFloat(incentive) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedRules: SalaryRules = {
      salaryType,
      basicSalary: parseFloat(basicSalary) || staff.basicSalary,
      standardHoursPerDay: parseFloat(standardHours) || 9,
      overtimeRatePerHour: parseFloat(overtimeRate) || 100,
      halfDayDeductionType: halfDayType,
      halfDayDeductionValue: parseFloat(halfDayValue) || 50,
      lateThresholdMinutes: parseFloat(lateThreshold) || 15,
      lateDeductionType: lateDedType,
      lateDeductionValue: parseFloat(lateDedValue) || 50,
      absenceDeductionType: absenceDedType,
      absenceDeductionValue: parseFloat(absenceDedValue) || estDailyRate,
      advanceAmount: numAdv,
      loanDeduction: numLoan,
      incentive: numInc,
      workingDaysPerMonth: parseFloat(workingDays) || 26,
    };
    onSave(staff.id, updatedRules);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 rounded-t-3xl sm:rounded-2xl border border-slate-800 p-5 shadow-2xl space-y-4 my-auto max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="text-base font-bold text-white">
                {t.attendance.salaryRules}
              </h3>
              <p className="text-xs text-purple-300">
                {staff.name} • {staff.role}
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Salary Type Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Salary Type (वेतन प्रकार)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['monthly', 'daily', 'hourly'] as SalaryType[]).map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setSalaryType(type)}
                  className={`py-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                    salaryType === type
                      ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-950/50'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {type === 'monthly' ? 'Monthly (माह)' : type === 'daily' ? 'Daily (दिन)' : 'Hourly (घंटे)'}
                </button>
              ))}
            </div>
          </div>

          {/* Basic Salary & Standard Shift */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {salaryType === 'monthly' ? 'Basic Salary (₹/month) *' : salaryType === 'daily' ? 'Daily Rate (₹/day) *' : 'Hourly Rate (₹/hr) *'}
              </label>
              <input
                type="number"
                required
                min="0"
                value={basicSalary}
                onChange={(e) => setBasicSalary(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Standard Shift (Hours/Day)
              </label>
              <input
                type="number"
                min="1"
                max="24"
                value={standardHours}
                onChange={(e) => setStandardHours(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Overtime Rate & Working Days */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Overtime Rate (₹ / Hour) *
              </label>
              <input
                type="number"
                min="0"
                value={overtimeRate}
                onChange={(e) => setOvertimeRate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Working Days / Month
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={workingDays}
                onChange={(e) => setWorkingDays(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Half-Day & Absence Deductions */}
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2.5">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
              Deduction Rules (कटौती नियम)
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-slate-400 block mb-0.5">Half-Day Deduction</label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    value={halfDayValue}
                    onChange={(e) => setHalfDayValue(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-600 text-white font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setHalfDayType(halfDayType === 'percentage' ? 'fixed' : 'percentage')}
                    className="px-2 py-1.5 rounded-lg bg-slate-700 text-purple-300 text-xs font-bold"
                  >
                    {halfDayType === 'percentage' ? '%' : '₹'}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-slate-400 block mb-0.5">Late Threshold (Mins)</label>
                <input
                  type="number"
                  value={lateThreshold}
                  onChange={(e) => setLateThreshold(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-600 text-white font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-slate-400 block mb-0.5">Late Penalty</label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    value={lateDedValue}
                    onChange={(e) => setLateDedValue(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-600 text-white font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setLateDedType(lateDedType === 'fixed' ? 'percentage' : 'fixed')}
                    className="px-2 py-1.5 rounded-lg bg-slate-700 text-purple-300 text-xs font-bold"
                  >
                    {lateDedType === 'fixed' ? '₹' : '%'}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-slate-400 block mb-0.5">Absence Deduction</label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    value={absenceDedValue}
                    onChange={(e) => setAbsenceDedValue(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-600 text-white font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setAbsenceDedType(absenceDedType === 'daily_rate' ? 'fixed' : 'daily_rate')}
                    className="px-1.5 py-1.5 rounded-lg bg-slate-700 text-purple-300 text-[10px] font-bold"
                    title={absenceDedType === 'daily_rate' ? 'Full Day Rate' : 'Fixed ₹'}
                  >
                    {absenceDedType === 'daily_rate' ? 'Rate' : '₹'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Advance, Loan & Incentive initial parameters */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5 font-semibold">Advance (₹)</label>
              <input
                type="number"
                min="0"
                value={advanceAmount}
                onChange={(e) => setAdvanceAmount(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5 font-semibold">Loan (₹)</label>
              <input
                type="number"
                min="0"
                value={loanDeduction}
                onChange={(e) => setLoanDeduction(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5 font-semibold">Incentive (₹)</label>
              <input
                type="number"
                min="0"
                value={incentive}
                onChange={(e) => setIncentive(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs font-bold"
              />
            </div>
          </div>

          {/* Transparent Formula Display */}
          <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-purple-300 font-bold text-[11px]">
              <Calculator className="w-3.5 h-3.5" />
              <span>Transparent Salary Formula</span>
            </div>
            <p className="text-[10px] text-purple-200/90 leading-relaxed font-mono">
              Final Salary = Basic Salary + Overtime Amount + Incentive - Late Deduction - Absence Deduction - Advance - Loan Deduction
            </p>
            <div className="text-[11px] text-slate-300 pt-1 border-t border-purple-500/20 flex justify-between">
              <span>Standard Daily Rate: <strong>{formatINR(estDailyRate)}</strong></span>
              <span>OT Rate: <strong>{formatINR(numOT)}/hr</strong></span>
            </div>
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
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-950/50 transition-transform active:scale-95"
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
