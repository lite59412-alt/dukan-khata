import React, { useState } from 'react';
import {
  Staff,
  AttendanceRecord,
  SalaryAdjustment,
  StaffSalaryPayment,
  ShopSettings,
  Language,
  AttendanceStatus,
  SalaryRules,
} from '../types';
import { StaffListView } from './staff/StaffListView';
import { StaffDetailView, StaffDetailSubTab } from './staff/StaffDetailView';
import { AddStaffModal } from './staff/AddStaffModal';
import { getTodayDateString } from '../utils/formatters';

export interface StaffTabProps {
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
  // Navigation: null = Staff List View; string = Staff Detail View for that staff member
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [detailSubTab, setDetailSubTab] = useState<StaffDetailSubTab>('attendance');
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);

  const selectedStaff = staffList.find((s) => s.id === selectedStaffId) || null;

  // Handle Quick Attendance Marking from buttons
  const handleQuickMarkAttendance = (status: AttendanceStatus, overtimeHours?: number) => {
    if (!selectedStaff) return;
    const todayStr = getTodayDateString();
    const existing = attendanceList.find(
      (a) => (a.staffId === selectedStaff.id || (a as any).staff_id === selectedStaff.id) && a.date === todayStr
    );

    const record: AttendanceRecord = {
      id: existing?.id || `att-${selectedStaff.id}-${todayStr}`,
      staffId: selectedStaff.id,
      staff_id: selectedStaff.id,
      date: todayStr,
      status,
      overtimeHours: overtimeHours ?? (status === 'overtime' ? 2 : 0),
      overtime_hours: overtimeHours ?? (status === 'overtime' ? 2 : 0),
      updated_at: new Date().toISOString(),
    };

    onUpdateAttendanceRecord(record);
  };

  // Handle Save Attendance Record from modal
  const handleSaveAttendanceRecord = (record: AttendanceRecord) => {
    onUpdateAttendanceRecord(record);
  };

  // Handle Save Salary Rules & Adjustment
  const handleSaveSalaryRules = (rules: SalaryRules, adjustment: SalaryAdjustment) => {
    if (!selectedStaff) return;
    onUpdateSalaryRules(selectedStaff.id, rules);

    const today = new Date();
    const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const adjKey = `${selectedStaff.id}_${monthKey}`;
    onUpdateAdjustment(adjKey, adjustment);

    if (onUpdateStaff) {
      onUpdateStaff({
        ...selectedStaff,
        basicSalary: rules.basicSalary,
        salaryRules: rules,
      });
    }
  };

  return (
    <div className="min-h-full pb-20 max-w-4xl mx-auto text-[var(--color-text-primary)]">
      {/* View routing: List vs Detail */}
      {!selectedStaff ? (
        <StaffListView
          staffList={staffList}
          attendanceList={attendanceList}
          salaryPayments={salaryPayments}
          salaryAdjustments={salaryAdjustments}
          onSelectStaff={(staffId, targetTab) => {
            setSelectedStaffId(staffId);
            if (targetTab) setDetailSubTab(targetTab);
          }}
          onOpenAddStaff={() => setIsAddStaffOpen(true)}
          onUpdateAttendanceRecord={handleSaveAttendanceRecord}
          onUpdateAttendance={onUpdateAttendance}
        />
      ) : (
        <StaffDetailView
          staff={selectedStaff}
          attendanceList={attendanceList}
          salaryPayments={salaryPayments}
          salaryAdjustments={salaryAdjustments}
          settings={settings}
          initialTab={detailSubTab}
          onBack={() => setSelectedStaffId(null)}
          onUpdateStaff={(updated) => {
            if (onUpdateStaff) onUpdateStaff(updated);
          }}
          onSaveAttendanceRecord={handleSaveAttendanceRecord}
          onQuickMarkAttendance={handleQuickMarkAttendance}
          onRecordPayment={(payment) => {
            if (onAddSalaryPayment) onAddSalaryPayment(payment);
          }}
          onSaveSalaryRules={handleSaveSalaryRules}
          onViewQr={() => onViewStaffQr(selectedStaff)}
        />
      )}

      {/* Add Staff Modal */}
      {isAddStaffOpen && (
        <AddStaffModal
          isOpen={isAddStaffOpen}
          onClose={() => setIsAddStaffOpen(false)}
          onAddStaff={(newStaff) => {
            onAddNewStaff(newStaff);
            setIsAddStaffOpen(false);
          }}
        />
      )}
    </div>
  );
};
