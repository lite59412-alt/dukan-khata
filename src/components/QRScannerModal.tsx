import React, { useState } from 'react';
import { QrCode, Camera, CheckCircle2, UserCheck, X, Sparkles, Printer } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Staff, Language, AttendanceStatus } from '../types';
import { generateQrMatrix } from '../utils/qrHelper';
import { formatINR } from '../utils/formatters';

interface QRScannerModalProps {
  mode: 'scan' | 'view_badge';
  staffList: Staff[];
  selectedStaff?: Staff | null;
  shopName: string;
  language: Language;
  onScanSuccess: (staff: Staff, status: AttendanceStatus) => void;
  onClose: () => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  mode,
  staffList,
  selectedStaff,
  shopName,
  language,
  onScanSuccess,
  onClose,
}) => {
  const [activeStaffForBadge, setActiveStaffForBadge] = useState<Staff>(
    selectedStaff || staffList[0]
  );
  const [scannedMessage, setScannedMessage] = useState<string | null>(null);

  const triggerScan = (staff: Staff, status: AttendanceStatus = 'present') => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // fallback
    }

    const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    setScannedMessage(
      language === 'hi'
        ? `सफलतापूर्वक हाजिरी दर्ज: ${staff.name} (${status.toUpperCase()}) समय: ${time}`
        : `Attendance Recorded: ${staff.name} (${status.toUpperCase()}) at ${time}`
    );

    setTimeout(() => {
      onScanSuccess(staff, status);
      onClose();
    }, 1200);
  };

  const renderQrSvg = (code: string) => {
    const matrix = generateQrMatrix(code, 21);
    const size = matrix.length;
    const cellSize = 10;
    const totalPx = size * cellSize;

    return (
      <svg
        viewBox={`0 0 ${totalPx} ${totalPx}`}
        className="w-48 h-48 sm:w-56 sm:h-56 mx-auto bg-white p-2 rounded-xl border border-slate-200 shadow-sm"
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

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900 rounded-t-3xl sm:rounded-2xl border border-slate-800 p-5 shadow-2xl space-y-4 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">
              {mode === 'scan'
                ? language === 'hi' ? 'स्टाफ QR कोड स्कैनर' : 'Scan Staff Attendance QR'
                : language === 'hi' ? 'स्टाफ QR पहचान पत्र (ID Badge)' : 'Staff QR ID Badge'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODE 1: SCAN ATTENDANCE */}
        {mode === 'scan' ? (
          <div className="space-y-4">
            {/* Camera Viewfinder simulator */}
            <div className="relative aspect-square max-w-[280px] mx-auto rounded-2xl bg-slate-950 border-2 border-emerald-500/60 overflow-hidden flex flex-col items-center justify-center p-4">
              {/* Corner reticles */}
              <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-emerald-400" />
              <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-emerald-400" />
              <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-emerald-400" />
              <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-emerald-400" />

              {/* Laser scanning line */}
              <div className="absolute inset-x-4 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-bounce shadow-lg shadow-emerald-400/80" />

              <Camera className="w-12 h-12 text-slate-600 mb-2" />
              <p className="text-xs text-center text-slate-400 font-medium px-4">
                {language === 'hi'
                  ? 'स्टाफ अपना QR कोड कैमरे के सामने लाएं'
                  : 'Point camera at staff ID card QR code'}
              </p>

              {scannedMessage && (
                <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-2 animate-bounce" />
                  <p className="text-sm font-bold text-white leading-tight">{scannedMessage}</p>
                </div>
              )}
            </div>

            {/* Quick Staff Fast-Scan triggers (Owner tap to scan) */}
            <div>
              <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                {language === 'hi' ? 'त्वरित 1-क्लिक स्कैन (टेस्ट/फास्ट मार्क):' : 'Tap to simulate QR scan:'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {staffList.map((staff) => (
                  <button
                    key={staff.id}
                    onClick={() => triggerScan(staff, 'present')}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700/80 text-left transition-all active:scale-95 group"
                  >
                    <div
                      className={`w-7 h-7 rounded-lg ${staff.avatarBg} text-white text-xs font-bold flex items-center justify-center shrink-0`}
                    >
                      {staff.name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{staff.name}</p>
                      <p className="text-[10px] text-emerald-400 truncate">{staff.role}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* MODE 2: VIEW / PRINT STAFF QR ID BADGE */
          <div className="space-y-4">
            {/* Staff Selector tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {staffList.map((st) => (
                <button
                  key={st.id}
                  onClick={() => setActiveStaffForBadge(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    activeStaffForBadge.id === st.id
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {st.name}
                </button>
              ))}
            </div>

            {/* Printable ID Card */}
            <div
              id="staff-qr-badge-printable"
              className="bg-white text-slate-900 rounded-2xl p-5 border border-slate-300 shadow-lg text-center space-y-3"
            >
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700">
                  {shopName}
                </p>
                <h4 className="text-base font-black text-slate-900 mt-0.5">
                  STAFF ID & ATTENDANCE CARD
                </h4>
              </div>

              {/* QR Code SVG */}
              {renderQrSvg(activeStaffForBadge.qrCodeId)}

              <div>
                <h5 className="text-sm font-extrabold text-slate-900">
                  {activeStaffForBadge.name}
                </h5>
                <p className="text-xs text-slate-600 font-medium">
                  {activeStaffForBadge.role} • {activeStaffForBadge.phone}
                </p>
                <div className="inline-block mt-2 px-2.5 py-0.5 rounded-md bg-slate-100 font-mono text-[10px] text-slate-700 font-bold border border-slate-300">
                  ID: {activeStaffForBadge.qrCodeId}
                </div>
              </div>

              <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-200">
                {language === 'hi'
                  ? 'दुकान में आते व जाते समय इस QR कोड को स्कैन करें।'
                  : 'Scan this QR code upon arrival and departure.'}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold border border-slate-700 transition-transform active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>{language === 'hi' ? 'आईडी कार्ड प्रिंट करें' : 'Print ID Badge'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
