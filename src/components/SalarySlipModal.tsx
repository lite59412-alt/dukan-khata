import React, { useState } from 'react';
import { Share2, Printer, CheckCircle, X, Sliders, Save, Info, AlertCircle, Clock } from 'lucide-react';
import { Staff, AttendanceRecord, SalaryAdjustment, ShopSettings, Language, StaffSalaryPayment } from '../types';
import { calculateStaffSalary } from '../utils/salaryCalculator';
import { formatINR, generateSalarySlipWhatsAppText, formatDate } from '../utils/formatters';
import { translations } from '../translations';

interface SalarySlipModalProps {
  staff: Staff;
  attendanceList: AttendanceRecord[];
  adjustment?: SalaryAdjustment;
  salaryPayments?: StaffSalaryPayment[];
  settings: ShopSettings;
  language: Language;
  onUpdateAdjustment?: (staffId: string, adjustment: SalaryAdjustment) => void;
  onClose: () => void;
}

export const SalarySlipModal: React.FC<SalarySlipModalProps> = ({
  staff,
  attendanceList,
  adjustment,
  salaryPayments = [],
  settings,
  language,
  onUpdateAdjustment,
  onClose,
}) => {
  const t = translations[language] || translations.en;
  const ts = t.salarySlip;

  const [showAdjustDrawer, setShowAdjustDrawer] = useState(false);
  const [advanceInput, setAdvanceInput] = useState<string>(String(adjustment?.advanceTaken || 0));
  const [loanInput, setLoanInput] = useState<string>(String(adjustment?.loanDeduction || 0));
  const [incentiveInput, setIncentiveInput] = useState<string>(String(adjustment?.incentive || 0));
  const [noteInput, setNoteInput] = useState<string>(adjustment?.note || '');

  const currentAdjustment: SalaryAdjustment = {
    advanceTaken: parseFloat(advanceInput) || 0,
    loanDeduction: parseFloat(loanInput) || 0,
    incentive: parseFloat(incentiveInput) || 0,
    note: noteInput,
  };

  const calc = calculateStaffSalary(
    staff,
    attendanceList,
    currentAdjustment,
    settings.workingDaysPerMonth || 26,
    'September 2026',
    salaryPayments
  );

  const handleSaveAdjustments = () => {
    if (onUpdateAdjustment) {
      onUpdateAdjustment(staff.id, currentAdjustment);
    }
    setShowAdjustDrawer(false);
  };

  const handleShareWhatsApp = () => {
    const text = generateSalarySlipWhatsAppText(calc, settings.shopName, language);
    const cleanPhone = staff.phone.replace(/[^0-9]/g, '');
    const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const url = `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 rounded-t-3xl sm:rounded-2xl border border-slate-800 shadow-2xl p-4 sm:p-5 space-y-4 my-auto max-h-[96vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
              {ts.title}
            </span>
            <h3 className="text-base font-bold text-white">
              {calc.staffName} <span className="text-xs font-normal text-slate-400">({calc.role})</span>
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdjustDrawer(!showAdjustDrawer)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-purple-300 border border-purple-500/30 transition-all"
              title={ts.manualAdjust}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{ts.manualAdjust}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Adjust Drawer if opened */}
        {showAdjustDrawer && (
          <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-200">
                {ts.manualAdjust} / Review Deductions
              </span>
              <button
                onClick={handleSaveAdjustments}
                className="flex items-center gap-1 px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold"
              >
                <Save className="w-3 h-3" />
                {t.common.save}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">
                  {ts.advances} (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={advanceInput}
                  onChange={(e) => setAdvanceInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">
                  {ts.loans} (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={loanInput}
                  onChange={(e) => setLoanInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">
                  {ts.incentive} (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={incentiveInput}
                  onChange={(e) => setIncentiveInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
            </div>
            {/* Transparent formula description */}
            <div className="flex items-start gap-1.5 text-[11px] text-purple-300/80 bg-purple-900/30 p-2 rounded-lg">
              <Info className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
              <span>
                <strong>Formula:</strong> Final Salary = Basic + Overtime + Incentive - Late - Absence - Advance - Loan
              </span>
            </div>
          </div>
        )}

        {/* Printable Slip Container */}
        <div
          id="salary-slip-printable"
          className="bg-white text-slate-900 rounded-2xl p-4 sm:p-6 shadow-inner space-y-4"
        >
          {/* Slip Header */}
          <div className="text-center border-b border-slate-200 pb-3">
            <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase">
              {settings.shopName}
            </h2>
            <p className="text-xs text-slate-600 font-medium">
              {settings.address} • Ph: {settings.phone}
            </p>
            <div className="inline-block mt-2 px-3 py-0.5 rounded-full bg-slate-100 border border-slate-300 text-xs font-bold text-slate-800">
              {ts.voucherTitle}: {calc.month}
            </div>
          </div>

          {/* Employee & Attendance Meta */}
          <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <p className="text-slate-500 font-semibold">{ts.employee}:</p>
              <p className="text-slate-900 font-bold text-sm">{calc.staffName}</p>
              <p className="text-slate-600">{calc.role}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-500 font-semibold">{ts.basicSalary}:</p>
              <p className="text-slate-900 font-bold text-sm">{formatINR(calc.basicSalary)}</p>
              <p className="text-slate-600">{ts.dailyRate}: {formatINR(calc.dailyRate)}</p>
            </div>
          </div>

          {/* Attendance Stats Grid */}
          <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100">
              <span className="block text-[10px] text-emerald-700 font-bold">{ts.present}</span>
              <span className="font-extrabold text-slate-900 text-sm">{calc.presentDays}</span>
            </div>
            <div className="p-2 rounded-lg bg-amber-50 border border-amber-100">
              <span className="block text-[10px] text-amber-700 font-bold">{ts.halfDay}</span>
              <span className="font-extrabold text-slate-900 text-sm">{calc.halfDays}</span>
            </div>
            <div className="p-2 rounded-lg bg-blue-50 border border-blue-100">
              <span className="block text-[10px] text-blue-700 font-bold">{ts.overtimeHours}</span>
              <span className="font-extrabold text-slate-900 text-sm">{calc.overtimeHours}h</span>
            </div>
            <div className="p-2 rounded-lg bg-rose-50 border border-rose-100">
              <span className="block text-[10px] text-rose-700 font-bold">{ts.absent}</span>
              <span className="font-extrabold text-slate-900 text-sm">{calc.absentDays}</span>
            </div>
          </div>

          {/* Earnings & Deductions Table */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            {/* Earnings Column */}
            <div className="border border-emerald-200 rounded-xl p-3 bg-emerald-50/40">
              <h4 className="font-bold text-emerald-800 mb-2 border-b border-emerald-200 pb-1 flex items-center justify-between">
                <span>{ts.grossSalary}</span>
                <span>(₹)</span>
              </h4>
              <div className="space-y-1.5 text-slate-700">
                <div className="flex justify-between">
                  <span>{ts.basicSalary}:</span>
                  <span className="font-bold text-slate-900">{formatINR(calc.baseEarned)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{ts.overtimePay}:</span>
                  <span className="font-bold text-slate-900">+{formatINR(calc.overtimePay)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{ts.incentive}:</span>
                  <span className="font-bold text-slate-900">+{formatINR(calc.incentive)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-emerald-200 text-emerald-900 font-black">
                  <span>{ts.grossSalary}:</span>
                  <span>{formatINR(calc.grossSalary)}</span>
                </div>
              </div>
            </div>

            {/* Deductions Column */}
            <div className="border border-rose-200 rounded-xl p-3 bg-rose-50/40">
              <h4 className="font-bold text-rose-800 mb-2 border-b border-rose-200 pb-1 flex items-center justify-between">
                <span>{ts.deductions}</span>
                <span>(₹)</span>
              </h4>
              <div className="space-y-1.5 text-slate-700">
                <div className="flex justify-between">
                  <span>{ts.lateDeductions}:</span>
                  <span className="font-bold text-slate-900">-{formatINR(calc.lateDeduction)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{ts.absenceDeductions}:</span>
                  <span className="font-bold text-slate-900">-{formatINR(calc.absenceDeduction)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{ts.advances}:</span>
                  <span className="font-bold text-slate-900">-{formatINR(calc.advanceDeduction)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{ts.loans}:</span>
                  <span className="font-bold text-slate-900">-{formatINR(calc.loanDeduction)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-rose-200 text-rose-900 font-black">
                  <span>{ts.totalDeductions}:</span>
                  <span>-{formatINR(calc.totalDeductions)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Payable & Payment Ledger Banner */}
          <div className="bg-slate-900 text-white rounded-xl p-3.5 space-y-2.5 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-emerald-400 block uppercase tracking-wider">
                  {ts.netPayable}
                </span>
                <span className="text-[10px] text-slate-300">
                  {ts.reviewedNotice}
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight">
                {formatINR(calc.netSalary)}
              </div>
            </div>

            {/* Paid vs Remaining breakdown */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
              <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/40 flex justify-between items-center">
                <span className="text-emerald-300 text-[11px]">{language === 'hi' ? 'कुल भुगतान:' : 'Total Paid:'}</span>
                <span className="font-bold text-emerald-400">{formatINR(calc.totalPaid)}</span>
              </div>
              <div className={`p-2 rounded-lg border flex justify-between items-center ${
                calc.remainingSalary > 0
                  ? 'bg-amber-950/60 border-amber-500/50 text-amber-300 font-bold'
                  : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}>
                <span className="text-[11px]">
                  {language === 'hi' ? 'बकाया वेतन:' : 'Remaining Salary:'}
                </span>
                <span className="font-bold">{formatINR(calc.remainingSalary)}</span>
              </div>
            </div>
          </div>

          {/* Payment History List inside Salary Slip (Requirement 4) */}
          {calc.payments && calc.payments.length > 0 && (
            <div className="pt-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                {language === 'hi' ? 'वेतन भुगतान इतिहास (Payment History)' : 'Payment History'}
              </span>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-600 text-[10px] uppercase font-bold">
                    <tr>
                      <th className="p-2">Date</th>
                      <th className="p-2">Amount</th>
                      <th className="p-2">Method</th>
                      <th className="p-2">Ref #</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    {calc.payments.map((p) => (
                      <tr key={p.id}>
                        <td className="p-2 text-slate-600">{p.payment_date}</td>
                        <td className="p-2 font-bold text-emerald-700">{formatINR(p.paid_amount)}</td>
                        <td className="p-2 text-slate-600">{p.payment_method}</td>
                        <td className="p-2 font-mono text-[11px] text-slate-500">{p.reference_number || '--'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Signatures */}
          <div className="pt-4 flex justify-between text-[11px] text-slate-500 font-semibold border-t border-slate-200">
            <div>{ts.employee} (Sign)</div>
            <div>{settings.ownerName} (Owner Sign)</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold border border-slate-700 transition-transform active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>{ts.print}</span>
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 transition-transform active:scale-95"
          >
            <Share2 className="w-4 h-4" />
            <span>{ts.shareWhatsApp}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
