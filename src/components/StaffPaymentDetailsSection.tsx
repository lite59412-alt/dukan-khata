import React, { useState, useRef } from 'react';
import {
  CreditCard,
  QrCode,
  Edit2,
  Trash2,
  Save,
  X,
  Upload,
  AlertCircle,
  CheckCircle2,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { Staff } from '../types';
import { compressQrImage, isValidUpiId } from '../utils/imageCompressor';

interface StaffPaymentDetailsSectionProps {
  staff: Staff;
  onUpdateStaff: (updated: Staff) => void;
  isEditingInitially?: boolean;
  onDoneEditing?: () => void;
}

export const StaffPaymentDetailsSection: React.FC<StaffPaymentDetailsSectionProps> = ({
  staff,
  onUpdateStaff,
  isEditingInitially = false,
  onDoneEditing,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(isEditingInitially);

  // Form Fields
  const [paymentName, setPaymentName] = useState<string>(staff.payment_name || staff.name || '');
  const [upiId, setUpiId] = useState<string>(staff.upi_id || '');
  const [qrImageUrl, setQrImageUrl] = useState<string>(staff.qr_image_url || '');
  const [isUploadingQr, setIsUploadingQr] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Active inputs visibility toggles when adding one by one
  const [showUpiInput, setShowUpiInput] = useState<boolean>(Boolean(staff.upi_id));
  const [showQrInput, setShowQrInput] = useState<boolean>(Boolean(staff.qr_image_url));

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const hasAnyDetails = Boolean(staff.upi_id || staff.qr_image_url);

  // Handle file select & compression
  const handleQrFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    setIsUploadingQr(true);
    setErrorMessage(null);

    try {
      const compressedDataUrl = await compressQrImage(file, 600, 0.85);
      setQrImageUrl(compressedDataUrl);
      setShowQrInput(true);
    } catch (err) {
      console.error('Error compressing QR image:', err);
      setErrorMessage('Failed to process QR code image. Please try another image.');
    } finally {
      setIsUploadingQr(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Remove QR Image
  const handleRemoveQr = () => {
    setQrImageUrl('');
    setShowQrInput(false);
  };

  // Start Editing
  const handleStartEdit = () => {
    setPaymentName(staff.payment_name || staff.name || '');
    setUpiId(staff.upi_id || '');
    setQrImageUrl(staff.qr_image_url || '');
    setShowUpiInput(Boolean(staff.upi_id));
    setShowQrInput(Boolean(staff.qr_image_url));
    setErrorMessage(null);
    setIsEditing(true);
  };

  // Cancel Editing
  const handleCancelEdit = () => {
    setPaymentName(staff.payment_name || staff.name || '');
    setUpiId(staff.upi_id || '');
    setQrImageUrl(staff.qr_image_url || '');
    setShowUpiInput(Boolean(staff.upi_id));
    setShowQrInput(Boolean(staff.qr_image_url));
    setErrorMessage(null);
    setIsEditing(false);
    if (onDoneEditing) onDoneEditing();
  };

  // Save Payment Details
  const handleSaveDetails = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    const cleanUpi = upiId.trim();

    // Validate UPI ID if provided
    if (cleanUpi) {
      if (!isValidUpiId(cleanUpi)) {
        setErrorMessage('Invalid UPI ID format. Example: name@bank (e.g. rahul@oksbi or 9876543210@paytm)');
        return;
      }
    }

    // Allow combinations: UPI ID only, QR Code only, or Both (neither strictly required)
    const updatedStaff: Staff = {
      ...staff,
      payment_name: paymentName.trim() || undefined,
      upi_id: cleanUpi || undefined,
      qr_image_url: qrImageUrl.trim() || undefined,
      qr_image_local_path: qrImageUrl.trim() || undefined,
      updated_at: new Date().toISOString(),
    };

    onUpdateStaff(updatedStaff);
    setIsEditing(false);
    setSuccessToast('Payment details saved successfully.');
    setTimeout(() => setSuccessToast(null), 3500);

    if (onDoneEditing) onDoneEditing();
  };

  return (
    <div id="section-payment-details" className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Payment Details</h3>
            <p className="text-[11px] text-slate-400">UPI ID, QR code, and recipient name</p>
          </div>
        </div>

        {!isEditing && hasAnyDetails && (
          <button
            type="button"
            id="btn-edit-payment-details"
            onClick={handleStartEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-bold transition-all active:scale-95"
          >
            <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Edit Payment Details</span>
          </button>
        )}
      </div>

      {/* Success Toast */}
      {successToast && (
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* VIEW MODE */}
      {!isEditing ? (
        hasAnyDetails ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Payment Name */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Payment Name</span>
                <p className="font-semibold text-white">{staff.payment_name || staff.name || 'Not configured'}</p>
              </div>

              {/* UPI ID */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">UPI ID</span>
                {staff.upi_id ? (
                  <p className="font-mono font-bold text-emerald-400 text-xs">{staff.upi_id}</p>
                ) : (
                  <p className="text-slate-500 italic">Not added</p>
                )}
              </div>
            </div>

            {/* QR Code Preview */}
            {staff.qr_image_url ? (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                <div className="w-28 h-28 bg-white p-2 rounded-xl shrink-0 shadow-md">
                  <img
                    src={staff.qr_image_url}
                    alt={`${staff.name} Payment QR`}
                    className="w-full h-full object-contain mx-auto"
                  />
                </div>
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                    <QrCode className="w-3 h-3" />
                    <span>QR Code Attached</span>
                  </span>
                  <p className="text-xs font-bold text-white">Scan & Pay with any UPI app</p>
                  {staff.upi_id && (
                    <p className="text-[11px] text-slate-400 font-mono">UPI: {staff.upi_id}</p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          /* Empty State */
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Payment details not added</p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto mt-0.5">
                Add staff UPI ID or upload their payment QR code to enable 1-tap UPI payments.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                type="button"
                id="btn-add-upi-id"
                onClick={() => {
                  setShowUpiInput(true);
                  setIsEditing(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add UPI ID</span>
              </button>

              <button
                type="button"
                id="btn-add-qr-code"
                onClick={() => {
                  setShowQrInput(true);
                  setIsEditing(true);
                  setTimeout(() => fileInputRef.current?.click(), 100);
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5 text-amber-400" />
                <span>Add QR Code</span>
              </button>
            </div>
          </div>
        )
      ) : (
        /* EDIT / ADD MODE */
        <form onSubmit={handleSaveDetails} className="space-y-4 animate-in fade-in duration-150">
          {/* Payment Name */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Payment Name <span className="text-[11px] text-slate-500">(Name as registered in bank)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Ramesh Kumar"
              value={paymentName}
              onChange={(e) => setPaymentName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* UPI ID Field & Add button */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                UPI ID <span className="text-[11px] text-slate-500">(Optional)</span>
              </label>
              {!showUpiInput && (
                <button
                  type="button"
                  onClick={() => setShowUpiInput(true)}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add UPI ID</span>
                </button>
              )}
            </div>

            {showUpiInput && (
              <input
                type="text"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                placeholder="name@bank (e.g. rahul@oksbi, 9876543210@paytm)"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            )}
          </div>

          {/* QR Code Upload / Preview & Remove */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                QR Code <span className="text-[11px] text-slate-500">(Optional)</span>
              </label>
              {!showQrInput && (
                <button
                  type="button"
                  onClick={() => {
                    setShowQrInput(true);
                    fileInputRef.current?.click();
                  }}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add QR Code</span>
                </button>
              )}
            </div>

            {/* Hidden native file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleQrFileChange}
              className="hidden"
            />

            {showQrInput && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                {qrImageUrl ? (
                  <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                    <div className="w-24 h-24 bg-white p-1.5 rounded-xl shrink-0 shadow-md">
                      <img
                        src={qrImageUrl}
                        alt="QR Preview"
                        className="w-full h-full object-contain mx-auto"
                      />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <p className="text-xs font-bold text-white">Scan & Pay with any UPI app</p>
                      {upiId && (
                        <p className="text-[11px] text-emerald-400 font-mono font-medium truncate">
                          UPI: {upiId}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 pt-1 justify-center sm:justify-start">
                        {/* Replace QR button */}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingQr}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5 text-amber-400" />
                          <span>Replace QR</span>
                        </button>

                        {/* Remove QR button */}
                        <button
                          type="button"
                          onClick={handleRemoveQr}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove QR</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Upload Zone */
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-xl p-4 text-center cursor-pointer transition-colors space-y-1 bg-slate-900/50"
                  >
                    {isUploadingQr ? (
                      <div className="flex items-center justify-center gap-2 text-xs text-amber-400">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Compressing image...</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                        <p className="text-xs font-bold text-slate-200">Tap to upload QR image</p>
                        <p className="text-[10px] text-slate-500">Supports JPG, PNG, WEBP (auto-compressed)</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              id="btn-save-payment-details"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Payment Details</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
