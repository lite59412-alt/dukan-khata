/**
 * COMPREHENSIVE PROJECT CHECKPOINT & SYSTEM INVENTORY
 * Created before Safe 3-Phase Upgrade:
 * - Phase 1: Remember Login (Persistent Firebase Auth with indexedDB + browserLocalPersistence fallback, onAuthStateChanged, loading screen, permanent UID scoping)
 * - Phase 2: App Lock (Settings section: PIN + Biometric, secure SHA-256 hash, configurable background lock timer, clean unlock screen)
 * - Phase 3: Clean UI Redesign (Modern light-mode friendly UI, 5 primary navigation tabs: Home, Udhari, Suppliers, Staff, More, 100% feature preservation)
 */

export const INVENTORY_ROUTES_AND_SCREENS = {
  unauthenticated: [
    "LoginScreen (Email/Password, Google OAuth, ID normalization, Reset Password, Language selector)"
  ],
  authenticatedPrimaryTabs: [
    "HomeTab (Today's summary, Galla status, Udhari due, Supplier due, Staff due, Reminders, Quick Action buttons)",
    "UdhariTab (Customer credit accounts, Pending/Overdue/Paid/All filters, Search, WhatsApp reminder, Add Udhari, Voice Udhari, Customer payment)",
    "SupplierTab (Supplier ledger, Purchases, Payments, WhatsApp message, Add purchase, Record payment, Search)",
    "StaffTab (Staff list, Add staff, Staff profile, Monthly salary summary with month selector, Pay Staff UPI/Cash/Bank, QR modal, Attendance calendar, Salary rules, WhatsApp salary slip)",
    "More (Menu containing Reports, Expenses, Galla, Attendance, Salary, Backup/Restore, Settings, Language, Help)"
  ],
  secondaryModalsAndScreens: [
    "DailyGallaModal (Opening cash, Cash In, UPI In, Card In, Expense Out, Expected vs Actual Closing, Cash difference)",
    "ExpensesModal (Category-wise expense tracker: Rent, Electricity, Tea/Snacks, Transport, Maintenance, Other)",
    "AttendanceCalendarScreen (Full monthly color calendar: Present, Half Day, Late, Absent, Leave, Overtime)",
    "StaffAttendanceHistoryModal (Attendance log per staff)",
    "StaffSalaryRulesModal (Custom salary rates, overtime rate, late deductions, half-day deductions)",
    "SalarySlipModal (Detailed breakdown for print & WhatsApp sharing)",
    "CustomerFullDetailsModal (Item-by-item breakdown, transaction history)",
    "CustomerPaymentModal (Multiple bill payment distribution)",
    "SupplierPurchaseModal (Bill entry with invoice, items, quantity)",
    "VoiceUdhariModal (Speech-to-text NLP item parsing)",
    "QRScannerModal (Camera scan for staff badge & customer QR)",
    "BackupRestoreModal (Local JSON export/import, Google Drive / Firestore sync)",
    "SettingsModal (Account info, Shop details, Security with App Lock, Language preview, Notifications, Data management)",
    "PaywallScreen (1-Year DukaanPro license status and activation)"
  ]
};

export const INVENTORY_DATA_MODELS = [
  "ShopSettings (shopName, ownerName, phone, upiId, address, language, currency, autoBackupDaily, lastBackupDate, workingDaysPerMonth)",
  "UdhariItem (id, customerName, customerPhone, items, totalAmount, paidAmount, remainingAmount, isPaid, dueDate, createdDate)",
  "CustomerPaymentRecord (id, customerName, customerPhone, amount, paymentDate, paymentMethod, allocatedItems, notes)",
  "SupplierDueEntry (id, supplierName, supplierPhone, itemPurchased, quantity, amount, paidAmount, remainingDue, status, invoiceNumber, purchaseDate)",
  "SupplierPaymentRecord (id, supplierName, supplierPhone, amount, paymentDate, paymentMethod, notes)",
  "Staff (id, name, phone, role, basicSalary, joinDate, avatarBg, qrCodeId, upi_id, qr_image_url, payment_name)",
  "AttendanceRecord (id, staffId, date, status, checkInTime, checkOutTime, overtimeHours, lateMinutes)",
  "StaffSalaryPayment (id, payment_id, staff_id, amount, paid_amount, payment_date, payment_method, upi_id, transaction_reference, note, status, remaining_balance_after)",
  "DailyGallaRecord (id, date, openingCash, cashIn, upiIn, cardIn, expenseOut, actualClosingCash, expectedClosingCash, cashDifference, isClosed)",
  "ShopExpense (id, date, category, amount, description, paymentMethod)"
];

export const CHECKPOINT_METADATA = {
  version: "2.0.0-phase-upgrade",
  timestamp: new Date().toISOString(),
  status: "BACKUP_VERIFIED_BEFORE_MODIFICATIONS"
};
