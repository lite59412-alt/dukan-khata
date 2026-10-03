import { Language, AttendanceStatus, ExpenseCategory } from './types';

export interface TranslationDictionary {
  appName: string;
  tagline: string;
  tabs: {
    home: string;
    staff: string;
    udhari: string;
    supplier: string;
    reports: string;
  };
  metrics: {
    todaySales: string;
    pendingUdhari: string;
    supplierDue: string;
    staffPresent: string;
    salaryPending: string;
    todayExpenses: string;
  };
  quickActions: {
    addUdhari: string;
    markAttendance: string;
    addExpense: string;
    generateSalary: string;
    openGalla: string;
  };
  attendance: {
    title: string;
    qrScanner: string;
    manualAttendance: string;
    scanStaffQr: string;
    present: string;
    absent: string;
    half_day: string;
    late: string;
    overtime: string;
    checkIn: string;
    checkOut: string;
    generateSlip: string;
    addStaff: string;
    viewQr: string;
    editAttendance: string;
    salaryRules: string;
  };
  salarySlip: {
    title: string;
    voucherTitle: string;
    employee: string;
    basicSalary: string;
    dailyRate: string;
    present: string;
    halfDay: string;
    absent: string;
    late: string;
    overtimeHours: string;
    overtimeRate: string;
    overtimePay: string;
    incentive: string;
    grossSalary: string;
    deductions: string;
    lateDeductions: string;
    absenceDeductions: string;
    advances: string;
    loans: string;
    totalDeductions: string;
    netPayable: string;
    shareWhatsApp: string;
    print: string;
    editRules: string;
    manualAdjust: string;
    reviewedNotice: string;
    close: string;
  };
  staffPayment: {
    paymentDetails: string;
    upiId: string;
    qrCode: string;
    addUpiId: string;
    addQrCode: string;
    savePaymentDetails: string;
    editPaymentDetails: string;
    removeQr: string;
    payStaff: string;
    payViaUpi: string;
    showQr: string;
    paymentHistory: string;
    paymentCompleted: string;
    paymentFailed: string;
    paymentCancelled: string;
    scanAndPay: string;
    paymentDetailsNotAdded: string;
    addPaymentDetails: string;
  };
  udhari: {
    title: string;
    all: string;
    pending: string;
    paid: string;
    overdue: string;
    addNew: string;
    customerName: string;
    itemName: string;
    quantity: string;
    amount: string;
    dueDate: string;
    sendReminder: string;
    collectPayment: string;
    whatsappMessage: string;
  };
  supplier: {
    title: string;
    supplierName: string;
    itemPurchased: string;
    dueAmount: string;
    payDue: string;
    addNewSupplier: string;
    partialPay: string;
    showItems: string;
    hideItems: string;
    sendListWhatsApp: string;
    addPurchaseBill: string;
    pending: string;
    totalBillAmount: string;
    paidAmount: string;
    remainingDue: string;
    sendWhatsApp: string;
    addPayment: string;
    purchaseItems: string;
    newPurchaseBill: string;
    paymentHistory: string;
    popularItems: string;
    addPopularItem: string;
    defaultPrice: string;
    addItem: string;
    savePurchaseBill: string;
    addDue: string;
  };
  galla: {
    title: string;
    cashIn: string;
    upiIn: string;
    cardIn: string;
    expenseOut: string;
    closingBalance: string;
    todaySummary: string;
    counterHelper: string;
    closeGalla: string;
  };
  expenses: {
    title: string;
    addExpense: string;
    category: string;
    paymentMode: string;
    monthlyTotal: string;
  };
  reports: {
    title: string;
    daily: string;
    staff: string;
    udhari: string;
    supplier: string;
    salary: string;
    expense: string;
    exportPdf: string;
    shareWhatsapp: string;
  };
  backup: {
    title: string;
    backupNow: string;
    restoreData: string;
    autoBackup: string;
    lastBackup: string;
    cloudStatus: string;
    downloadBackup: string;
  };
  common: {
    save: string;
    cancel: string;
    delete: string;
    search: string;
    phone: string;
    note: string;
    date: string;
    rupee: string;
    status: string;
    action: string;
    settings: string;
    shopInfo: string;
    switchLang: string;
    back: string;
    paid: string;
    all: string;
    edit: string;
    quantity: string;
    unit: string;
    price: string;
    totalAmount: string;
    dueDate: string;
    paymentMode: string;
    itemName: string;
    architectureBlueprint: string;
  };
  login: {
    title: string;
    subtitle: string;
    loginIdOrEmail: string;
    loginIdPlaceholder: string;
    password: string;
    passwordPlaceholder: string;
    showPassword: string;
    hidePassword: string;
    loginBtn: string;
    loggingIn: string;
    forgotPassword: string;
    createAccount: string;
    haveAccount: string;
    orDivider: string;
    googleLogin: string;
    forgotPasswordTitle: string;
    forgotPasswordDesc: string;
    sendResetLink: string;
    resetLinkSent: string;
    backToLogin: string;
    createAccountTitle: string;
    createAccountBtn: string;
    creatingAccount: string;
  };
  account: {
    title: string;
    subtitle: string;
    loginIdEmail: string;
    ownerName: string;
    shopName: string;
    phoneNumber: string;
    accountStatus: string;
    statusActive: string;
    statusPro: string;
    lastLogin: string;
    logoutBtn: string;
    changePassword: string;
    deleteAccountRequest: string;
    deleteAccountConfirmTitle: string;
    deleteAccountConfirmDesc: string;
    confirmDeleteBtn: string;
    resetEmailSent: string;
  };
  languageSettings: {
    title: string;
    subtitle: string;
    selectLanguage: string;
    previewTitle: string;
    previewNotice: string;
    applyLanguage: string;
    currentActive: string;
  };
  validationErrors: {
    emptyLoginId: string;
    emptyPassword: string;
    wrongCredentials: string;
    userNotFound: string;
    tooManyAttempts: string;
    noInternet: string;
    accountDisabled: string;
    unknownError: string;
  };
  emptyStates: {
    noUdhari: string;
    noStaff: string;
    noSuppliers: string;
    noExpenses: string;
  };
  paymentStatus: {
    pending: string;
    paid: string;
    overdue: string;
    partial: string;
  };
  attendanceStatusLabels: {
    present: string;
    absent: string;
    half_day: string;
    late: string;
    overtime: string;
    leave: string;
  };
  reminderStatus: {
    reminderSent: string;
    reminderPending: string;
    reminderOverdue: string;
  };
}

export const translations: Record<Language, TranslationDictionary> = {
  en: {
    appName: 'DukanKhata',
    tagline: 'Simple & Fast Shop Management',
    tabs: {
      home: 'Home',
      staff: 'Staff',
      udhari: 'Udhari',
      supplier: 'Supplier',
      reports: 'Reports',
    },
    metrics: {
      todaySales: "Today's Sales",
      pendingUdhari: 'Pending Udhari',
      supplierDue: 'Supplier Due',
      staffPresent: 'Staff Present',
      salaryPending: 'Salary Pending',
      todayExpenses: "Today's Expenses",
    },
    quickActions: {
      addUdhari: '+ New Udhari',
      markAttendance: 'Attendance',
      addExpense: '+ Daily Kharcha',
      generateSalary: 'Salary Slip',
      openGalla: 'Galla Hisab',
    },
    attendance: {
      title: 'Staff & Attendance',
      qrScanner: 'Scan QR Attendance',
      manualAttendance: 'Manual Mark',
      scanStaffQr: 'Point camera at employee QR badge',
      present: 'Present',
      absent: 'Absent',
      half_day: 'Half Day',
      late: 'Late',
      overtime: 'Overtime',
      checkIn: 'In',
      checkOut: 'Out',
      generateSlip: 'Salary Slip',
      addStaff: '+ Add New Staff',
      viewQr: 'View QR Badge',
      editAttendance: 'Edit Attendance',
      salaryRules: 'Salary Rules',
    },
    salarySlip: {
      title: 'Monthly Salary Slip',
      voucherTitle: 'SALARY VOUCHER',
      employee: 'Employee',
      basicSalary: 'Basic Salary',
      dailyRate: 'Daily Rate',
      present: 'Present (P)',
      halfDay: 'Half Day (HD)',
      absent: 'Absent (A)',
      late: 'Late Days (L)',
      overtimeHours: 'Overtime Hours',
      overtimeRate: 'OT Rate',
      overtimePay: 'Overtime Pay',
      incentive: 'Incentive / Bonus',
      grossSalary: 'Gross Earnings',
      deductions: 'Deductions',
      lateDeductions: 'Late Penalties',
      absenceDeductions: 'Absence Deductions',
      advances: 'Advance Deductions',
      loans: 'Loan Repayments',
      totalDeductions: 'Total Deductions',
      netPayable: 'Net Payable Salary',
      shareWhatsApp: 'Share on WhatsApp',
      print: 'Print Voucher',
      editRules: 'Edit Salary Rules',
      manualAdjust: 'Adjust Amounts',
      reviewedNotice: 'Owner reviewed & confirmed',
      close: 'Close',
    },
    staffPayment: {
      paymentDetails: 'Payment Details',
      upiId: 'UPI ID',
      qrCode: 'QR Code',
      addUpiId: 'Add UPI ID',
      addQrCode: 'Add QR Code',
      savePaymentDetails: 'Save Payment Details',
      editPaymentDetails: 'Edit Payment Details',
      removeQr: 'Remove QR',
      payStaff: 'Pay Staff',
      payViaUpi: 'Pay via UPI',
      showQr: 'Show QR',
      paymentHistory: 'Payment History',
      paymentCompleted: 'Payment Completed',
      paymentFailed: 'Payment Failed',
      paymentCancelled: 'Payment Cancelled',
      scanAndPay: 'Scan & Pay with any UPI app',
      paymentDetailsNotAdded: 'Payment details not added',
      addPaymentDetails: 'Add Payment Details',
    },
    udhari: {
      title: 'Customer Udhari Khata',
      all: 'All',
      pending: 'Pending',
      paid: 'Paid',
      overdue: 'Overdue',
      addNew: '+ New Udhari',
      customerName: 'Customer Name',
      itemName: 'Items Purchased',
      quantity: 'Quantity / Weight',
      amount: 'Amount (₹)',
      dueDate: 'Due Date',
      sendReminder: 'WhatsApp Reminder',
      collectPayment: 'Record Payment',
      whatsappMessage: 'Send payment reminder via WhatsApp',
    },
    supplier: {
      title: 'Supplier Dues (Wholesale & Mandi)',
      supplierName: 'Supplier Name',
      itemPurchased: 'Goods Purchased',
      dueAmount: 'Due Amount',
      payDue: 'Record Payment',
      addNewSupplier: '+ Purchase Bill',
      partialPay: 'Partial Pay',
      showItems: 'Show Items',
      hideItems: 'Hide Items',
      sendListWhatsApp: 'Send Full List on WhatsApp',
      addPurchaseBill: '+ Add Purchase Bill',
      pending: 'Pending',
      totalBillAmount: 'Total Bill Amount',
      paidAmount: 'Paid Amount',
      remainingDue: 'Remaining Due',
      sendWhatsApp: 'Send on WhatsApp',
      addPayment: 'Add Payment',
      purchaseItems: 'Purchase Items',
      newPurchaseBill: '+ New Purchase Bill',
      paymentHistory: 'Payment History',
      popularItems: 'Popular Items',
      addPopularItem: '+ Add Popular Item',
      defaultPrice: 'Default Price',
      addItem: 'Add Item',
      savePurchaseBill: 'Save Purchase Bill',
      addDue: 'Add Supplier Due / Purchase Bill',
    },
    galla: {
      title: 'Daily Galla Cash Register',
      cashIn: 'Cash Collected',
      upiIn: 'UPI Received',
      cardIn: 'Card / Bank',
      expenseOut: 'Cash Expenses Out',
      closingBalance: 'Expected Closing Cash',
      todaySummary: "Today's Galla Summary",
      counterHelper: 'Denominations Counter',
      closeGalla: 'Close Day & Lock Cash',
    },
    expenses: {
      title: 'Daily Shop Expenses (Kharcha)',
      addExpense: '+ Record Expense',
      category: 'Category',
      paymentMode: 'Payment Mode',
      monthlyTotal: 'Month Total Expenses',
    },
    reports: {
      title: 'Reports & Shop Insights',
      daily: 'Daily Summary',
      staff: 'Staff Attendance',
      udhari: 'Udhari Register',
      supplier: 'Supplier Ledger',
      salary: 'Salary Register',
      expense: 'Expense Breakdown',
      exportPdf: 'Download PDF',
      shareWhatsapp: 'Share via WhatsApp',
    },
    backup: {
      title: 'Cloud Backup & Recovery',
      backupNow: 'Sync Now',
      restoreData: 'Restore Data',
      autoBackup: 'Automatic Cloud Sync',
      lastBackup: 'Last Synced',
      cloudStatus: 'Sync Status',
      downloadBackup: 'Download Backup JSON',
    },
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      search: 'Search...',
      phone: 'Phone',
      note: 'Note / Details',
      date: 'Date',
      rupee: '₹',
      status: 'Status',
      action: 'Action',
      settings: 'Settings',
      shopInfo: 'Shop Info',
      switchLang: 'Language',
      back: 'Back',
      paid: 'Paid',
      all: 'All',
      edit: 'Edit',
      quantity: 'Quantity',
      unit: 'Unit',
      price: 'Price',
      totalAmount: 'Total Amount',
      dueDate: 'Due Date',
      paymentMode: 'Payment Mode',
      itemName: 'Item Name',
      architectureBlueprint: 'Architecture Blueprint',
    },
    login: {
      title: 'Sign In to Your Shop',
      subtitle: 'Manage Udhari, Staff Attendance, and Galla securely.',
      loginIdOrEmail: 'Login ID or Email',
      loginIdPlaceholder: 'e.g. shree_ram_store or dukandar@gmail.com',
      password: 'Password',
      passwordPlaceholder: 'Enter your password',
      showPassword: 'Show',
      hidePassword: 'Hide',
      loginBtn: 'Log In',
      loggingIn: 'Logging In...',
      forgotPassword: 'Forgot Password?',
      createAccount: 'Create New Account',
      haveAccount: 'Already have an account? Sign In',
      orDivider: 'OR',
      googleLogin: 'Sign in with Google',
      forgotPasswordTitle: 'Reset Password',
      forgotPasswordDesc: 'Enter your registered email or login ID. We will send a secure password reset link.',
      sendResetLink: 'Send Reset Link',
      resetLinkSent: 'Password reset link sent! Please check your email inbox.',
      backToLogin: 'Back to Login',
      createAccountTitle: 'Register Your Shop Account',
      createAccountBtn: 'Create Account',
      creatingAccount: 'Creating Account...',
    },
    account: {
      title: 'Account Settings',
      subtitle: 'Manage your Dukandar profile, credentials, and security.',
      loginIdEmail: 'Login ID / Email',
      ownerName: 'Owner Name',
      shopName: 'Shop Name',
      phoneNumber: 'Phone Number',
      accountStatus: 'Account Status',
      statusActive: 'Active & Verified',
      statusPro: '1-Year Pro License',
      lastLogin: 'Last Login',
      logoutBtn: 'Sign Out',
      changePassword: 'Change Password (via Email)',
      deleteAccountRequest: 'Request Account Deletion',
      deleteAccountConfirmTitle: 'Confirm Account Deletion Request',
      deleteAccountConfirmDesc: 'Are you sure you want to request deletion of this account? All associated shop records and cloud backups will be permanently removed after verification.',
      confirmDeleteBtn: 'Submit Deletion Request',
      resetEmailSent: 'Password reset link sent to your email.',
    },
    languageSettings: {
      title: 'Language',
      subtitle: 'Select your preferred language. Changes apply immediately.',
      selectLanguage: 'Choose Language',
      previewTitle: 'Language Preview',
      previewNotice: 'Sample shop interface preview in selected language',
      applyLanguage: 'Apply Language',
      currentActive: 'Active',
    },
    validationErrors: {
      emptyLoginId: 'Please enter your Login ID or Email',
      emptyPassword: 'Please enter your password',
      wrongCredentials: 'Wrong Login ID or password',
      userNotFound: 'User not found',
      tooManyAttempts: 'Too many attempts, please try again later',
      noInternet: 'No internet connection',
      accountDisabled: 'This account has been disabled',
      unknownError: 'Something went wrong, please try again',
    },
    emptyStates: {
      noUdhari: 'No udhari records found.',
      noStaff: 'No staff members added yet.',
      noSuppliers: 'No supplier dues recorded.',
      noExpenses: 'No expenses recorded for this month.',
    },
    paymentStatus: {
      pending: 'Pending',
      paid: 'Paid',
      overdue: 'Overdue',
      partial: 'Partial Paid',
    },
    attendanceStatusLabels: {
      present: 'Present',
      absent: 'Absent',
      half_day: 'Half Day',
      late: 'Late',
      overtime: 'Overtime',
      leave: 'Leave',
    },
    reminderStatus: {
      reminderSent: 'Reminder Sent',
      reminderPending: 'Reminder Pending',
      reminderOverdue: 'Overdue Reminder',
    },
  },
  hi: {
    appName: 'दुकानखाता',
    tagline: 'दुकानदारों का सरल और भरोसेमंद डिजिटल बही-खाता',
    tabs: {
      home: 'होम',
      staff: 'स्टाफ',
      udhari: 'उधारी',
      supplier: 'सप्लायर',
      reports: 'रिपोर्ट्स',
    },
    metrics: {
      todaySales: 'आज की कुल बिक्री',
      pendingUdhari: 'बाकी उधारी',
      supplierDue: 'सप्लायर बाकी',
      staffPresent: 'उपस्थित स्टाफ',
      salaryPending: 'बाकी वेतन',
      todayExpenses: 'आज का खर्चा',
    },
    quickActions: {
      addUdhari: '+ नई उधारी',
      markAttendance: 'हाजिरी भरें',
      addExpense: '+ दुकान खर्चा',
      generateSalary: 'वेतन पर्ची',
      openGalla: 'गल्ला हिसाब',
    },
    attendance: {
      title: 'स्टाफ एवं हाजिरी रजिस्टर',
      qrScanner: 'QR कोड से हाजिरी',
      manualAttendance: 'हाथ से हाजिरी',
      scanStaffQr: 'कर्मचारी का QR बैज कैमरे के सामने लाएं',
      present: 'उपस्थित',
      absent: 'अनुपस्थित',
      half_day: 'आधा दिन',
      late: 'देरी',
      overtime: 'ओवरटाइम',
      checkIn: 'आए',
      checkOut: 'गए',
      generateSlip: 'वेतन पर्ची',
      addStaff: '+ नया स्टाफ जोड़ें',
      viewQr: 'QR बैज देखें',
      editAttendance: 'हाजिरी सुधारें',
      salaryRules: 'वेतन नियम',
    },
    salarySlip: {
      title: 'मासिक वेतन पर्ची',
      voucherTitle: 'वेतन पर्ची / वाउचर',
      employee: 'कर्मचारी',
      basicSalary: 'मूल वेतन (Basic)',
      dailyRate: 'दैनिक दर',
      present: 'उपस्थित (P)',
      halfDay: 'आधा दिन (HD)',
      absent: 'अनुपस्थित (A)',
      late: 'देरी दिन (L)',
      overtimeHours: 'ओवरटाइम घंटे',
      overtimeRate: 'OT दर',
      overtimePay: 'ओवरटाइम राशि',
      incentive: 'प्रोत्साहन (Incentive)',
      grossSalary: 'कुल अर्जित राशि',
      deductions: 'कटौतियाँ',
      lateDeductions: 'देरी कटौती',
      absenceDeductions: 'अनुपस्थिति कटौती',
      advances: 'अग्रिम (Advance)',
      loans: 'ऋण कटौती (Loan)',
      totalDeductions: 'कुल कटौती',
      netPayable: 'शुद्ध देय वेतन (Net Salary)',
      shareWhatsApp: 'व्हाट्सएप पर भेजें',
      print: 'पर्ची प्रिंट करें',
      editRules: 'वेतन नियम बदलें',
      manualAdjust: 'रकम एडजस्ट करें',
      reviewedNotice: 'मालिक द्वारा सत्यापित',
      close: 'बंद करें',
    },
    staffPayment: {
      paymentDetails: 'Payment Details',
      upiId: 'UPI ID',
      qrCode: 'QR Code',
      addUpiId: 'Add UPI ID',
      addQrCode: 'Add QR Code',
      savePaymentDetails: 'Save Payment Details',
      editPaymentDetails: 'Edit Payment Details',
      removeQr: 'Remove QR',
      payStaff: 'Pay Staff',
      payViaUpi: 'Pay via UPI',
      showQr: 'Show QR',
      paymentHistory: 'Payment History',
      paymentCompleted: 'Payment Completed',
      paymentFailed: 'Payment Failed',
      paymentCancelled: 'Payment Cancelled',
      scanAndPay: 'Scan & Pay with any UPI app',
      paymentDetailsNotAdded: 'Payment details not added',
      addPaymentDetails: 'Add Payment Details',
    },
    udhari: {
      title: 'ग्राहक उधारी खाता',
      all: 'सभी',
      pending: 'बाकी',
      paid: 'चुकता',
      overdue: 'तारीख बीती',
      addNew: '+ नई उधारी जोड़ें',
      customerName: 'ग्राहक का नाम',
      itemName: 'सामान का विवरण',
      quantity: 'मात्रा / वजन',
      amount: 'रुपये (₹)',
      dueDate: 'भुगतान की तारीख',
      sendReminder: 'व्हाट्सएप तगादा',
      collectPayment: 'रुपये जमा करें',
      whatsappMessage: 'व्हाट्सएप पर भुगतान का विनम्र संदेश भेजें',
    },
    supplier: {
      title: 'थोक व्यापारी / सप्लायर बाकी (मंडी बिल)',
      supplierName: 'सप्लायर का नाम',
      itemPurchased: 'खरीदा गया सामान',
      dueAmount: 'बाकी रकम',
      payDue: 'भुगतान दर्ज करें',
      addNewSupplier: '+ नया खरीद बिल',
      partialPay: 'आंशिक भुगतान',
      showItems: 'सामान सूची देखें',
      hideItems: 'सामान सूची छुपाएं',
      sendListWhatsApp: 'व्हाट्सएप पर पूरी लिस्ट भेजें',
      addPurchaseBill: '+ नया खरीद बिल जोड़ें',
      pending: 'बाकी',
      totalBillAmount: 'कुल बिल राशि',
      paidAmount: 'जमा राशि',
      remainingDue: 'शेष बाकी',
      sendWhatsApp: 'व्हाट्सएप पर भेजें',
      addPayment: 'भुगतान जोड़ें',
      purchaseItems: 'खरीद सामान',
      newPurchaseBill: '+ नया खरीद बिल',
      paymentHistory: 'भुगतान इतिहास',
      popularItems: 'लोकप्रिय सामान',
      addPopularItem: '+ सामान जोड़ें',
      defaultPrice: 'डिफ़ॉल्ट मूल्य',
      addItem: '+ सामान जोड़ें',
      savePurchaseBill: 'खरीद बिल सुरक्षित करें',
      addDue: 'नया खरीद बिल / सप्लायर बाकी जोड़ें',
    },
    galla: {
      title: 'दैनिक गल्ला रोकड़ बही',
      cashIn: 'नकद बिक्री (Cash)',
      upiIn: 'ऑनलाइन (UPI)',
      cardIn: 'कार्ड / बैंक',
      expenseOut: 'गल्ले से निकला खर्चा',
      closingBalance: 'गल्ले में नकद होना चाहिए',
      todaySummary: 'आज के गल्ले का सारांश',
      counterHelper: 'नोट व सिक्के गिनें',
      closeGalla: 'दुकान बंद करें व गल्ला लॉक करें',
    },
    expenses: {
      title: 'दुकान के रोजमर्रा खर्चे (खर्चा बही)',
      addExpense: '+ खर्चा दर्ज करें',
      category: 'खर्चे की श्रेणी',
      paymentMode: 'भुगतान माध्यम',
      monthlyTotal: 'महीने का कुल खर्चा',
    },
    reports: {
      title: 'दुकान व्यापार रिपोर्ट्स व विश्लेषण',
      daily: 'दैनिक सारांश',
      staff: 'स्टाफ हाजिरी',
      udhari: 'उधारी बही',
      supplier: 'सप्लायर खाता',
      salary: 'वेतन रजिस्टर',
      expense: 'खर्चा विवरण',
      exportPdf: 'PDF डाउनलोड',
      shareWhatsapp: 'व्हाट्सएप साझा करें',
    },
    backup: {
      title: 'क्लाउड बैकअप एवं डेटा रिकवरी',
      backupNow: 'अभी सिंक करें',
      restoreData: 'डेटा रिकवर करें',
      autoBackup: 'स्वचालित क्लाउड बैकअप',
      lastBackup: 'पिछला सिंक',
      cloudStatus: 'सिंक स्थिति',
      downloadBackup: 'बैकअप फाइल डाउनलोड करें',
    },
    common: {
      save: 'सुरक्षित करें',
      cancel: 'रद्द करें',
      delete: 'हटाएं',
      search: 'खोजें...',
      phone: 'फोन नंबर',
      note: 'टिप्पणी / विवरण',
      date: 'तारीख',
      rupee: '₹',
      status: 'स्थिति',
      action: 'कार्रवाई',
      settings: 'सेटिंग्स',
      shopInfo: 'दुकान जानकारी',
      switchLang: 'भाषा',
      back: 'वापस',
      paid: 'चुकता',
      all: 'सभी',
      edit: 'बदलें',
      quantity: 'मात्रा',
      unit: 'इकाई',
      price: 'मूल्य',
      totalAmount: 'कुल रकम',
      dueDate: 'अंतिम तारीख',
      paymentMode: 'भुगतान माध्यम',
      itemName: 'सामान का नाम',
      architectureBlueprint: 'आर्किटेक्चर विवरण',
    },
    login: {
      title: 'दुकान खाते में लॉगिन करें',
      subtitle: 'उधारी, स्टाफ हाजिरी और गल्ला का हिसाब सुरक्षित रखें।',
      loginIdOrEmail: 'लॉगिन आईडी या ईमेल',
      loginIdPlaceholder: 'उदा. shree_ram_store या dukandar@gmail.com',
      password: 'पासवर्ड',
      passwordPlaceholder: 'अपना पासवर्ड दर्ज करें',
      showPassword: 'दिखाएं',
      hidePassword: 'छिपाएं',
      loginBtn: 'लॉगिन करें',
      loggingIn: 'लॉगिन हो रहा है...',
      forgotPassword: 'पासवर्ड भूल गए?',
      createAccount: 'नया खाता बनाएं',
      haveAccount: 'पहले से खाता है? लॉगिन करें',
      orDivider: 'या',
      googleLogin: 'Google से लॉगिन करें',
      forgotPasswordTitle: 'पासवर्ड रीसेट करें',
      forgotPasswordDesc: 'अपना पंजीकृत ईमेल या लॉगिन आईडी दर्ज करें। हम सुरक्षित रीसेट लिंक भेजेंगे।',
      sendResetLink: 'रीसेट लिंक भेजें',
      resetLinkSent: 'पासवर्ड रीसेट लिंक आपके ईमेल पर भेज दिया गया है!',
      backToLogin: 'लॉगिन पर वापस जाएं',
      createAccountTitle: 'दुकानदार खाता पंजीकृत करें',
      createAccountBtn: 'खाता बनाएं',
      creatingAccount: 'खाता बन रहा है...',
    },
    account: {
      title: 'खाता विवरण (Account)',
      subtitle: 'अपनी दुकानदार प्रोफाइल, सुरक्षा और सेटिंग्स प्रबंधित करें।',
      loginIdEmail: 'लॉगिन आईडी / ईमेल',
      ownerName: 'दुकानदार का नाम',
      shopName: 'दुकान का नाम',
      phoneNumber: 'मोबाइल नंबर',
      accountStatus: 'खाता स्थिति',
      statusActive: 'सक्रिय एवं सुरक्षित',
      statusPro: '1-साल प्रो लाइसेंस',
      lastLogin: 'अंतिम लॉगिन',
      logoutBtn: 'लॉगआउट करें',
      changePassword: 'पासवर्ड बदलें (ईमेल द्वारा)',
      deleteAccountRequest: 'खाता हटाने का अनुरोध',
      deleteAccountConfirmTitle: 'क्या आप खाता हटाना चाहते हैं?',
      deleteAccountConfirmDesc: 'पुष्टि के बाद आपके सभी दुकान रिकॉर्ड और क्लाउड बैकअप स्थायी रूप से हटा दिए जाएंगे।',
      confirmDeleteBtn: 'हटाने का अनुरोध भेजें',
      resetEmailSent: 'पासवर्ड रीसेट लिंक आपके ईमेल पर भेजा गया है।',
    },
    languageSettings: {
      title: 'Language',
      subtitle: 'अपनी पसंदीदा भाषा चुनें। सभी स्क्रीन तुरंत बदल जाएंगी।',
      selectLanguage: 'भाषा चुनें',
      previewTitle: 'भाषा का नमूना (Preview)',
      previewNotice: 'चयनित भाषा में दुकान इंटरफेस का पूर्वावलोकन',
      applyLanguage: 'भाषा लागू करें',
      currentActive: 'सक्रिय',
    },
    validationErrors: {
      emptyLoginId: 'कृपया लॉगिन आईडी या ईमेल दर्ज करें',
      emptyPassword: 'कृपया पासवर्ड दर्ज करें',
      wrongCredentials: 'गलत लॉगिन आईडी या पासवर्ड',
      userNotFound: 'खाता नहीं मिला',
      tooManyAttempts: 'बहुत अधिक प्रयास, कृपया कुछ देर बाद प्रयास करें',
      noInternet: 'इंटरनेट कनेक्शन नहीं है',
      accountDisabled: 'यह खाता बंद कर दिया गया है',
      unknownError: 'कुछ गलत हुआ, कृपया पुनः प्रयास करें',
    },
    emptyStates: {
      noUdhari: 'कोई उधारी रिकॉर्ड नहीं मिला।',
      noStaff: 'अभी कोई स्टाफ सदस्य नहीं जोड़ा गया है।',
      noSuppliers: 'कोई सप्लायर बाकी नहीं है।',
      noExpenses: 'इस महीने का कोई खर्चा दर्ज नहीं है।',
    },
    paymentStatus: {
      pending: 'बाकी',
      paid: 'चुकता',
      overdue: 'समय समाप्त',
      partial: 'आंशिक भुगतान',
    },
    attendanceStatusLabels: {
      present: 'उपस्थित',
      absent: 'अनुपस्थित',
      half_day: 'आधा दिन',
      late: 'देरी',
      overtime: 'ओवरटाइम',
      leave: 'छुट्टी',
    },
    reminderStatus: {
      reminderSent: 'ताग़ादा भेजा गया',
      reminderPending: 'ताग़ादा बाकी',
      reminderOverdue: 'समय बीत चुका ताग़ादा',
    },
  },
  or: {
    appName: 'ଦୋକାନଖାତା',
    tagline: 'ଦୋକାନୀମାନଙ୍କ ସରଳ ଓ ବିଶ୍ୱସ୍ତ ଡିଜିଟାଲ୍ ଖାତା',
    tabs: {
      home: 'ମୂଳପୃଷ୍ଠା',
      staff: 'କର୍ମଚାରୀ',
      udhari: 'ଉଧାରି',
      supplier: 'ସପ୍ଲାୟାର',
      reports: 'ରିପୋର୍ଟ୍',
    },
    metrics: {
      todaySales: 'ଆଜିର ମୋଟ ବିକ୍ରି',
      pendingUdhari: 'ବାକି ଉଧାରି',
      supplierDue: 'ସପ୍ଲାୟାର ବାକି',
      staffPresent: 'ଉପସ୍ଥିତ କର୍ମଚାରୀ',
      salaryPending: 'ବାକି ଦରମା',
      todayExpenses: 'ଆଜିର ଖର୍ଚ୍ଚ',
    },
    quickActions: {
      addUdhari: '+ ନୂଆ ଉଧାରି',
      markAttendance: 'ଉପସ୍ଥିତି ଦିଅନ୍ତୁ',
      addExpense: '+ ଦୋକାନ ଖର୍ଚ୍ଚ',
      generateSalary: 'ଦରମା ସ୍ଲିପ୍',
      openGalla: 'ଗଲ୍ଲା ହିସାବ',
    },
    attendance: {
      title: 'କର୍ମଚାରୀ ଓ ଉପସ୍ଥିତି ରେଜିଷ୍ଟର',
      qrScanner: 'QR କୋଡ୍ ଉପସ୍ଥିତି',
      manualAttendance: 'ମାନୁଆଲ୍ ଉପସ୍ଥିତି',
      scanStaffQr: 'କର୍ମଚାରୀଙ୍କ QR ବ୍ୟାଜ୍ ସାମ୍ନାରେ ରଖନ୍ତୁ',
      present: 'ଉପସ୍ଥିତ',
      absent: 'ଅନୁପସ୍ଥିତ',
      half_day: 'ଅଧା ଦିନ',
      late: 'ବିଳମ୍ବ',
      overtime: 'ଓଭରଟାଇମ୍',
      checkIn: 'ପ୍ରବେଶ',
      checkOut: 'ପ୍ରସ୍ଥାନ',
      generateSlip: 'ଦରମା ସ୍ଲିପ୍',
      addStaff: '+ ନୂଆ କର୍ମଚାରୀ ଯୋଡନ୍ତୁ',
      viewQr: 'QR ବ୍ୟାଜ୍ ଦେଖନ୍ତୁ',
      editAttendance: 'ଉପସ୍ଥିତି ସଂଶୋଧନ',
      salaryRules: 'ଦରମା ନିୟମ',
    },
    salarySlip: {
      title: 'ମାସିକ ଦରମା ସ୍ଲିପ୍',
      voucherTitle: 'ଦରମା ଭାଉଚର / ସ୍ଲିପ୍',
      employee: 'କର୍ମଚାରୀ',
      basicSalary: 'ମୂଳ ଦରମା (Basic)',
      dailyRate: 'ଦୈନିକ ହାର',
      present: 'ଉପସ୍ଥିତ (P)',
      halfDay: 'ଅଧା ଦିନ (HD)',
      absent: 'ଅନୁପସ୍ଥିତ (A)',
      late: 'ବିଳମ୍ବ ଦିନ (L)',
      overtimeHours: 'ଓଭରଟାଇମ୍ ଘଣ୍ଟା',
      overtimeRate: 'OT ହାର',
      overtimePay: 'ଓଭରଟାଇମ୍ ପ୍ରାପ୍ୟ',
      incentive: 'ପ୍ରୋତ୍ସାହନ (Incentive)',
      grossSalary: 'ମୋଟ ଆୟ (Gross)',
      deductions: 'କଟାତି',
      lateDeductions: 'ବିଳମ୍ବ କଟାତି',
      absenceDeductions: 'ଅନୁପସ୍ଥିତି କଟାତି',
      advances: 'ଅଗ୍ରିମ କଟାତି (Advance)',
      loans: 'ଋଣ କଟାତି (Loan)',
      totalDeductions: 'ମୋଟ କଟାତି',
      netPayable: 'ପ୍ରଦେୟ ନିଟ୍ ଦରମା (Net Salary)',
      shareWhatsApp: 'ହ୍ୱାଟ୍ସଆପ୍‌ରେ ପଠାନ୍ତୁ',
      print: 'ପ୍ରିଣ୍ଟ୍ କରନ୍ତୁ',
      editRules: 'ଦରମା ନିୟମ ସମ୍ପାଦନ',
      manualAdjust: 'ରାଶି ଆଡଜଷ୍ଟ୍',
      reviewedNotice: 'ମାଲିକଙ୍କ ଦ୍ୱାରା ଯାଞ୍ଚିତ',
      close: 'ବନ୍ଦ କରନ୍ତୁ',
    },
    staffPayment: {
      paymentDetails: 'Payment Details',
      upiId: 'UPI ID',
      qrCode: 'QR Code',
      addUpiId: 'Add UPI ID',
      addQrCode: 'Add QR Code',
      savePaymentDetails: 'Save Payment Details',
      editPaymentDetails: 'Edit Payment Details',
      removeQr: 'Remove QR',
      payStaff: 'Pay Staff',
      payViaUpi: 'Pay via UPI',
      showQr: 'Show QR',
      paymentHistory: 'Payment History',
      paymentCompleted: 'Payment Completed',
      paymentFailed: 'Payment Failed',
      paymentCancelled: 'Payment Cancelled',
      scanAndPay: 'Scan & Pay with any UPI app',
      paymentDetailsNotAdded: 'Payment details not added',
      addPaymentDetails: 'Add Payment Details',
    },
    udhari: {
      title: 'ଗ୍ରାହକ ଉଧାରି ଖାତା',
      all: 'ସମସ୍ତ',
      pending: 'ବାକି',
      paid: 'ପରିଶୋଧିତ',
      overdue: 'ସମୟ ଅତିକ୍ରାନ୍ତ',
      addNew: '+ ନୂଆ ଉଧାରି',
      customerName: 'ଗ୍ରାହକଙ୍କ ନାମ',
      itemName: 'ସାମଗ୍ରୀ ବିବରଣୀ',
      quantity: 'ପରିମାଣ / ଓଜନ',
      amount: 'ଟଙ୍କା (₹)',
      dueDate: 'ଦେୟ ତାରିଖ',
      sendReminder: 'ହ୍ୱାଟ୍ସଆପ୍ ସ୍ମାରକ',
      collectPayment: 'ଟଙ୍କା ଗ୍ରହଣ କରନ୍ତୁ',
      whatsappMessage: 'ହ୍ୱାଟ୍ସଆପ୍‌ରେ ବିନମ୍ର ସ୍ମାରକ ପଠାନ୍ତୁ',
    },
    supplier: {
      title: 'ସପ୍ଲାୟାର ବାକି ହିସାବ',
      supplierName: 'ସପ୍ଲାୟାରଙ୍କ ନାମ',
      itemPurchased: 'କିଣାଯାଇଥିବା ସାମଗ୍ରୀ',
      dueAmount: 'ବାକି ଟଙ୍କା',
      payDue: 'ଟଙ୍କା ପୈଠ ଦରଜ କରନ୍ତୁ',
      addNewSupplier: '+ ନୂଆ କ୍ରୟ ବିଲ୍',
      partialPay: 'ଆଂଶିକ ପୈଠ',
      showItems: 'ସାମଗ୍ରୀ ତାଲିକା ଦେଖନ୍ତୁ',
      hideItems: 'ତାଲିକା ଲୁଚାନ୍ତୁ',
      sendListWhatsApp: 'ହ୍ୱାଟ୍ସଆପ୍‌ରେ ସମ୍ପୂର୍ଣ୍ଣ ତାଲିକା ପଠାନ୍ତୁ',
      addPurchaseBill: '+ କ୍ରୟ ବିଲ୍ ଯୋଡନ୍ତୁ',
      pending: 'ବାକି',
      totalBillAmount: 'ମୋଟ ବିଲ୍ ଟଙ୍କା',
      paidAmount: 'ପୈଠ ଟଙ୍କା',
      remainingDue: 'ଅବଶିଷ୍ଟ ବାକି',
      sendWhatsApp: 'ହ୍ୱାଟ୍ସଆପ୍‌ରେ ପଠାନ୍ତୁ',
      addPayment: 'ପୈଠ ଯୋଡନ୍ତୁ',
      purchaseItems: 'କ୍ରୟ ସାମଗ୍ରୀ',
      newPurchaseBill: '+ ନୂଆ କ୍ରୟ ବିଲ୍',
      paymentHistory: 'ପୈଠ ଇତିହାସ',
      popularItems: 'ଲୋକପ୍ରିୟ ସାମଗ୍ରୀ',
      addPopularItem: '+ ସାମଗ୍ରୀ ଯୋଡନ୍ତୁ',
      defaultPrice: 'ମୂଲ୍ୟ',
      addItem: '+ ସାମଗ୍ରୀ ଯୋଡନ୍ତୁ',
      savePurchaseBill: 'କ୍ରୟ ବିଲ୍ ସେଭ୍ କରନ୍ତୁ',
      addDue: 'ନୂଆ କ୍ରୟ ବିଲ୍ ଯୋଡନ୍ତୁ',
    },
    galla: {
      title: 'ଦୈନିକ ଗଲ୍ଲା ହିସାବ',
      cashIn: 'ନଗଦ ପ୍ରାପ୍ତି',
      upiIn: 'ୟୁପିଆଇ ପ୍ରାପ୍ତି',
      cardIn: 'କାର୍ଡ / ବ୍ୟାଙ୍କ',
      expenseOut: 'ଗଲ୍ଲାରୁ ଖର୍ଚ୍ଚ',
      closingBalance: 'ଗଲ୍ଲାରେ ରହିବା କଥା',
      todaySummary: 'ଆଜିର ଗଲ୍ଲା ସାରାଂଶ',
      counterHelper: 'ନୋଟ୍ ଗଣନା ସହାୟକ',
      closeGalla: 'ଦିନ ବନ୍ଦ କରନ୍ତୁ',
    },
    expenses: {
      title: 'ଦୋକାନ ଦୈନନ୍ଦିନ ଖର୍ଚ୍ଚ',
      addExpense: '+ ଖର୍ଚ୍ଚ ଦରଜ କରନ୍ତୁ',
      category: 'ଖର୍ଚ୍ଚ ଶ୍ରେଣୀ',
      paymentMode: 'ପୈଠ ମାଧ୍ୟମ',
      monthlyTotal: 'ମାସର ମୋଟ ଖର୍ଚ୍ଚ',
    },
    reports: {
      title: 'ରିପୋର୍ଟ୍ ଓ ବିବରଣୀ',
      daily: 'ଦୈନିକ ସାରାଂଶ',
      staff: 'କର୍ମଚାରୀ ଉପସ୍ଥିତି',
      udhari: 'ଉଧାରି ଖାତା',
      supplier: 'ସପ୍ଲାୟାର ଖାତା',
      salary: 'ଦରମା ଖାତା',
      expense: 'ଖର୍ଚ୍ଚ ବିବରଣୀ',
      exportPdf: 'PDF ଡାଉନଲୋଡ୍',
      shareWhatsapp: 'ହ୍ୱାଟ୍ସଆପ୍‌ରେ ପଠାନ୍ତୁ',
    },
    backup: {
      title: 'କ୍ଲାଉଡ୍ ବ୍ୟାକଅପ୍ ଓ ରିକଭରୀ',
      backupNow: 'ଏବେ ସିଙ୍କ୍ କରନ୍ତୁ',
      restoreData: 'ଡାଟା ରିକଭର କରନ୍ତୁ',
      autoBackup: 'ସ୍ୱୟଂଚାଳିତ କ୍ଲାଉଡ୍ ସିଙ୍କ୍',
      lastBackup: 'ଶେଷ ସିଙ୍କ୍',
      cloudStatus: 'ସିଙ୍କ୍ ସ୍ଥିତି',
      downloadBackup: 'ବ୍ୟାକଅପ୍ ଫାଇଲ୍ ଡାଉନଲୋଡ୍',
    },
    common: {
      save: 'ସେଭ୍ କରନ୍ତୁ',
      cancel: 'ବାତିଲ୍',
      delete: 'ହଟାନ୍ତୁ',
      search: 'ଖୋଜନ୍ତୁ...',
      phone: 'ଫୋନ୍ ନମ୍ବର',
      note: 'ଟିପ୍ପଣୀ',
      date: 'ତାରିଖ',
      rupee: '₹',
      status: 'ସ୍ଥିତି',
      action: 'କାର୍ଯ୍ୟ',
      settings: 'ସେଟିଂସ୍',
      shopInfo: 'ଦୋକାନ ସୂଚନା',
      switchLang: 'ଭାଷା',
      back: 'ଫେରନ୍ତୁ',
      paid: 'ପରିଶୋଧିତ',
      all: 'ସମସ୍ତ',
      edit: 'ସମ୍ପାଦନ',
      quantity: 'ପରିମାଣ',
      unit: 'ଏକକ',
      price: 'ଦର',
      totalAmount: 'ମୋଟ ଟଙ୍କା',
      dueDate: 'ଦେୟ ତାରିଖ',
      paymentMode: 'ପୈଠ ମାଧ୍ୟମ',
      itemName: 'ସାମଗ୍ରୀ ନାମ',
      architectureBlueprint: 'ଆର୍କିଟେକ୍ଚର ବିବରଣୀ',
    },
    login: {
      title: 'ଦୋକାନ ଖାତାରେ ଲଗଇନ୍ କରନ୍ତୁ',
      subtitle: 'ଉଧାରି, କର୍ମଚାରୀ ହାଜିରା ଓ ଗଲ୍ଲା ହିସାବ ସୁରକ୍ଷିତ ରଖନ୍ତୁ।',
      loginIdOrEmail: 'ଲଗଇନ୍ ID କିମ୍ବା ଇମେଲ୍',
      loginIdPlaceholder: 'ଯଥା shree_ram_store କିମ୍ବା dukandar@gmail.com',
      password: 'ପାସୱାର୍ଡ',
      passwordPlaceholder: 'ଆପଣଙ୍କ ପାସୱାର୍ଡ ପ୍ରବେଶ କରନ୍ତୁ',
      showPassword: 'ଦେଖାନ୍ତୁ',
      hidePassword: 'ଲୁଚାନ୍ତୁ',
      loginBtn: 'ଲଗଇନ୍ କରନ୍ତୁ',
      loggingIn: 'ଲଗଇନ୍ ହେଉଛି...',
      forgotPassword: 'ପାସୱାର୍ଡ ଭୁଲିଗଲେ କି?',
      createAccount: 'ନୂଆ ଖାତା ଖୋଲନ୍ତୁ',
      haveAccount: 'ପୂର୍ବରୁ ଖାତା ଅଛି? ଲଗଇନ୍ କରନ୍ତୁ',
      orDivider: 'କିମ୍ବା',
      googleLogin: 'Google ସହିତ ଲଗଇନ୍ କରନ୍ତୁ',
      forgotPasswordTitle: 'ପାସୱାର୍ଡ ରିସେଟ୍ କରନ୍ତୁ',
      forgotPasswordDesc: 'ପଞ୍ଜୀକୃତ ଇମେଲ୍ କିମ୍ବା ଲଗଇନ୍ ID ଦିଅନ୍ତୁ। ଆମେ ସୁରକ୍ଷିତ ଲିଙ୍କ୍ ପଠାଇବୁ।',
      sendResetLink: 'ରିସେଟ୍ ଲିଙ୍କ୍ ପଠାନ୍ତୁ',
      resetLinkSent: 'ପାସୱାର୍ଡ ରିସେଟ୍ ଲିଙ୍କ୍ ଆପଣଙ୍କ ଇମେଲ୍ କୁ ପଠାଗଲା!',
      backToLogin: 'ଲଗଇନ୍ ପୃଷ୍ଠାକୁ ଫେରନ୍ତୁ',
      createAccountTitle: 'ଦୋକାନୀ ଖାତା ପଞ୍ଜୀକରଣ କରନ୍ତୁ',
      createAccountBtn: 'ଖାତା ତିଆରି କରନ୍ତୁ',
      creatingAccount: 'ଖାତା ତିଆରି ହେଉଛି...',
    },
    account: {
      title: 'ଖାତା ବିବରଣୀ (Account)',
      subtitle: 'ଆପଣଙ୍କର ଦୋକାନୀ ପ୍ରୋଫାଇଲ୍, ସୁରକ୍ଷା ଓ ସେଟିଂସ୍ ପରିଚାଳନା କରନ୍ତୁ।',
      loginIdEmail: 'ଲଗଇନ୍ ID / ଇମେଲ୍',
      ownerName: 'ମାଲିକଙ୍କ ନାମ',
      shopName: 'ଦୋକାନ ନାମ',
      phoneNumber: 'ମୋବାଇଲ୍ ନମ୍ବର',
      accountStatus: 'ଖାତା ସ୍ଥିତି',
      statusActive: 'ସକ୍ରିୟ ଓ ସୁରକ୍ଷିତ',
      statusPro: '୧-ବର୍ଷ ପ୍ରୋ ଲାଇସେନ୍ସ',
      lastLogin: 'ଶେଷ ଲଗଇନ୍',
      logoutBtn: 'ଲଗଆଉଟ୍ କରନ୍ତୁ',
      changePassword: 'ପାସୱାର୍ଡ ବଦଳାନ୍ତୁ (ଇମେଲ୍ ଦ୍ୱାରା)',
      deleteAccountRequest: 'ଖାତା ବିଲୋପ ଅନୁରୋଧ',
      deleteAccountConfirmTitle: 'ଆପଣ ଖାତା ବିଲୋପ କରିବାକୁ ଚାହାଁନ୍ତି କି?',
      deleteAccountConfirmDesc: 'ଯାଞ୍ଚ ପରେ ଆପଣଙ୍କର ସମସ୍ତ ତଥ୍ୟ ଓ କ୍ଲାଉଡ୍ ବ୍ୟାକଅପ୍ ସ୍ଥାୟୀ ଭାବେ ହଟାଇ ଦିଆଯିବ।',
      confirmDeleteBtn: 'ବିଲୋପ ଅନୁରୋଧ ପଠାନ୍ତୁ',
      resetEmailSent: 'ପାସୱାର୍ଡ ରିସେଟ୍ ଲିଙ୍କ୍ ଆପଣଙ୍କ ଇମେଲ୍ କୁ ପଠାଗଲା।',
    },
    languageSettings: {
      title: 'Language',
      subtitle: 'ଆପଣଙ୍କ ପସନ୍ଦର ଭାଷା ବାଛନ୍ତୁ। ସମସ୍ତ ପରଦା ତୁରନ୍ତ ବଦଳିଯିବ।',
      selectLanguage: 'ଭାଷା ବାଛନ୍ତୁ',
      previewTitle: 'ଭାଷା ପୂର୍ବାବଲୋକନ (Preview)',
      previewNotice: 'ମନୋନୀତ ଭାଷାରେ ଦୋକାନ ଇଣ୍ଟରଫେସର ନମୁନା',
      applyLanguage: 'ଭାଷା ଲାଗୁ କରନ୍ତୁ',
      currentActive: 'ସକ୍ରିୟ',
    },
    validationErrors: {
      emptyLoginId: 'ଦୟାକରି ଆପଣଙ୍କର ଲଗଇନ୍ ID କିମ୍ବା ଇମେଲ୍ ପ୍ରବେଶ କରନ୍ତୁ',
      emptyPassword: 'ଦୟାକରି ଆପଣଙ୍କର ପାସୱାର୍ଡ ପ୍ରବେଶ କରନ୍ତୁ',
      wrongCredentials: 'ଭୁଲ୍ ଲଗଇନ୍ ID କିମ୍ବା ପାସୱାର୍ଡ',
      userNotFound: 'ଖାତା ମିଳିଲା ନାହିଁ',
      tooManyAttempts: 'ଅତ୍ୟଧିକ ଚେଷ୍ଟା କରାଯାଇଛି, ଦୟାକରି କିଛି ସମୟ ପରେ ଚେଷ୍ଟା କରନ୍ତୁ',
      noInternet: 'ଇଣ୍ଟରନେଟ୍ ସଂଯୋଗ ନାହିଁ',
      accountDisabled: 'ଏହି ଖାତା ବନ୍ଦ କରାଯାଇଛି',
      unknownError: 'କିଛି ଭୁଲ୍ ହୋଇଛି, ଦୟାକରି ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ',
    },
    emptyStates: {
      noUdhari: 'କୌଣସି ଉଧାରି ରେକର୍ଡ ମିଳିଲା ନାହିଁ।',
      noStaff: 'କୌଣସି କର୍ମଚାରୀ ଯୋଡା ଯାଇନାହିଁ।',
      noSuppliers: 'କୌଣସି ସପ୍ଲାୟାର ବାକି ନାହିଁ।',
      noExpenses: 'ଏହି ମାସର କୌଣସି ଖର୍ଚ୍ଚ ରେକର୍ଡ ନାହିଁ।',
    },
    paymentStatus: {
      pending: 'ବାକି',
      paid: 'ପରିଶୋଧିତ',
      overdue: 'ଅବଧି ସରିଛି',
      partial: 'ଆଂଶିକ ପୈଠ',
    },
    attendanceStatusLabels: {
      present: 'ଉପସ୍ଥିତ',
      absent: 'ଅନୁପସ୍ଥିତ',
      half_day: 'ଅଧା ଦିନ',
      late: 'ବିଳମ୍ବ',
      overtime: 'ଓଭରଟାଇମ୍',
      leave: 'ଛୁଟି',
    },
    reminderStatus: {
      reminderSent: 'ତାଗିଦା ପଠାଗଲା',
      reminderPending: 'ତାଗିଦା ବାକି',
      reminderOverdue: 'ଅବଧି ସରିଥିବା ତାଗିଦା',
    },
  },
  bn: {
    appName: 'দোকানখাতা',
    tagline: 'দোকানদারদের জন্য সহজ ও বিশ্বস্ত ডিজিটাল খাতা',
    tabs: {
      home: 'হোম',
      staff: 'কর্মী',
      udhari: 'বাকি',
      supplier: 'সাপ্লায়ার',
      reports: 'রিপোর্ট',
    },
    metrics: {
      todaySales: 'আজকের মোট বিক্রি',
      pendingUdhari: 'বকেয়া বাকি',
      supplierDue: 'সাপ্লায়ার বাকি',
      staffPresent: 'উপস্থিত কর্মী',
      salaryPending: 'বাকি বেতন',
      todayExpenses: 'আজকের খরচ',
    },
    quickActions: {
      addUdhari: '+ নতুন বাকি',
      markAttendance: 'হাজিরা দিন',
      addExpense: '+ দোকান খরচ',
      generateSalary: 'বেতন স্লিপ',
      openGalla: 'গল্লা হিসাব',
    },
    attendance: {
      title: 'কর্মী ও হাজিরা রেজিস্টার',
      qrScanner: 'QR কোড হাজিরা',
      manualAttendance: 'ম্যানুয়াল হাজিরা',
      scanStaffQr: 'কর্মীর QR ব্যাজ ক্যামেরার সামনে রাখুন',
      present: 'উপস্থিত',
      absent: 'অনুপস্থিত',
      half_day: 'অর্ধেক দিন',
      late: 'দেরি',
      overtime: 'ওভারটাইম',
      checkIn: 'প্রবেশ',
      checkOut: 'প্রস্থান',
      generateSlip: 'বেতন স্লিপ',
      addStaff: '+ নতুন কর্মী যোগ করুন',
      viewQr: 'QR ব্যাজ দেখুন',
      editAttendance: 'হাজিরা সংশোধন',
      salaryRules: 'বেতন নিয়মাবলী',
    },
    salarySlip: {
      title: 'মাসিক বেতন স্লিপ',
      voucherTitle: 'বেতন ভাউচার / স্লিপ',
      employee: 'কর্মী',
      basicSalary: 'মূল বেতন (Basic)',
      dailyRate: 'দৈনিক হার',
      present: 'উপস্থিত (P)',
      halfDay: 'অর্ধেক দিন (HD)',
      absent: 'অনুপস্থিত (A)',
      late: 'দেরি দিন (L)',
      overtimeHours: 'ওভারটাইম ঘণ্টা',
      overtimeRate: 'OT হার',
      overtimePay: 'ওভারটাইম টাকা',
      incentive: 'ইনসেন্টিভ (Incentive)',
      grossSalary: 'মোট আয় (Gross)',
      deductions: 'কর্তন',
      lateDeductions: 'দেরি কর্তন',
      absenceDeductions: 'অনুপস্থিতি কর্তন',
      advances: 'অগ্রিম কর্তন (Advance)',
      loans: 'ঋণ কর্তন (Loan)',
      totalDeductions: 'মোট কর্তন',
      netPayable: 'মোট প্রদেয় বেতন (Net Salary)',
      shareWhatsApp: 'হোয়াটসঅ্যাপে পাঠান',
      print: 'প্রিন্ট করুন',
      editRules: 'বেতন নিয়ম সম্পাদনা',
      manualAdjust: 'টাকা সমন্বয়',
      reviewedNotice: 'মালিক দ্বারা যাচাইকৃত',
      close: 'বন্ধ করুন',
    },
    staffPayment: {
      paymentDetails: 'Payment Details',
      upiId: 'UPI ID',
      qrCode: 'QR Code',
      addUpiId: 'Add UPI ID',
      addQrCode: 'Add QR Code',
      savePaymentDetails: 'Save Payment Details',
      editPaymentDetails: 'Edit Payment Details',
      removeQr: 'Remove QR',
      payStaff: 'Pay Staff',
      payViaUpi: 'Pay via UPI',
      showQr: 'Show QR',
      paymentHistory: 'Payment History',
      paymentCompleted: 'Payment Completed',
      paymentFailed: 'Payment Failed',
      paymentCancelled: 'Payment Cancelled',
      scanAndPay: 'Scan & Pay with any UPI app',
      paymentDetailsNotAdded: 'Payment details not added',
      addPaymentDetails: 'Add Payment Details',
    },
    udhari: {
      title: 'গ্রাহক বাকি খাতা',
      all: 'সব',
      pending: 'বাকি',
      paid: 'পরিশোধিত',
      overdue: 'সময় উত্তীর্ণ',
      addNew: '+ নতুন বাকি',
      customerName: 'গ্রাহকের নাম',
      itemName: 'পণ্যের বিবরণ',
      quantity: 'পরিমাণ / ওজন',
      amount: 'টাকা (₹)',
      dueDate: 'পরিশোধের তারিখ',
      sendReminder: 'হোয়াটসঅ্যাপ তাগাদা',
      collectPayment: 'টাকা গ্রহণ করুন',
      whatsappMessage: 'হোয়াটসঅ্যাপে বকেয়া পরিশোধের বার্তা পাঠান',
    },
    supplier: {
      title: 'সাপ্লায়ার বাকি খাতা',
      supplierName: 'সাপ্লায়ারের নাম',
      itemPurchased: 'ক্রয়কৃত পণ্য',
      dueAmount: 'বাকি টাকা',
      payDue: 'টাকা পরিশোধ নথিভুক্ত করুন',
      addNewSupplier: '+ নতুন ক্রয় বিল',
      partialPay: 'আংশিক পরিশোধ',
      showItems: 'পণ্য তালিকা দেখুন',
      hideItems: 'পণ্য তালিকা লুকান',
      sendListWhatsApp: 'হোয়াটসঅ্যাপে সম্পূর্ণ তালিকা পাঠান',
      addPurchaseBill: '+ ক্রয় বিল যোগ করুন',
      pending: 'বাকি',
      totalBillAmount: 'মোট বিলের টাকা',
      paidAmount: 'পরিশোধিত টাকা',
      remainingDue: 'অবশিষ্ট বাকি',
      sendWhatsApp: 'হোয়াটসঅ্যাপে পাঠান',
      addPayment: 'পরিশোধ যোগ করুন',
      purchaseItems: 'ক্রয়কৃত পণ্য',
      newPurchaseBill: '+ নতুন ক্রয় বিল',
      paymentHistory: 'পরিশোধের ইতিহাস',
      popularItems: 'জনপ্রিয় পণ্য',
      addPopularItem: '+ পণ্য যোগ করুন',
      defaultPrice: 'মূল্য',
      addItem: '+ পণ্য যোগ করুন',
      savePurchaseBill: 'ক্রয় বিল সংরক্ষণ করুন',
      addDue: 'নতুন ক্রয় বিল যোগ করুন',
    },
    galla: {
      title: 'দৈনিক ক্যাশ ড্রয়ার (গল্লা)',
      cashIn: 'নগদ সংগ্রহ',
      upiIn: 'অনলাইন (UPI)',
      cardIn: 'কার্ড / ব্যাংক',
      expenseOut: 'গল্লা থেকে খরচ',
      closingBalance: 'গল্লায় নগদ থাকার কথা',
      todaySummary: 'আজকের গল্লার সারাংশ',
      counterHelper: 'নোট ও কয়েন গণক',
      closeGalla: 'দিন শেষ ও লক করুন',
    },
    expenses: {
      title: 'দৈনিক দোকান খরচ (খরচা খাতা)',
      addExpense: '+ খরচ লিখুন',
      category: 'খরচের ধরন',
      paymentMode: 'পরিশোধের মাধ্যম',
      monthlyTotal: 'মাসের মোট খরচ',
    },
    reports: {
      title: 'রিপোর্ট ও বিশ্লেষণ',
      daily: 'দৈনিক সারাংশ',
      staff: 'কর্মী হাজিরা',
      udhari: 'বাকি খাতা',
      supplier: 'সাপ্লায়ার খাতা',
      salary: 'বেতন রেজিস্টার',
      expense: 'খরচ বিবরণী',
      exportPdf: 'PDF ডাউনলোড',
      shareWhatsapp: 'হোয়াটসঅ্যাপে শেয়ার',
    },
    backup: {
      title: 'ক্লাউড ব্যাকআপ ও রিকভারি',
      backupNow: 'এখনই সিঙ্ক করুন',
      restoreData: 'ডেটা রিকভার করুন',
      autoBackup: 'স্বয়ংক্রিয় ক্লাউড সিঙ্ক',
      lastBackup: 'সর্বশেষ সিঙ্ক',
      cloudStatus: 'সিঙ্ক অবস্থা',
      downloadBackup: 'ব্যাকআপ ফাইল ডাউনলোড',
    },
    common: {
      save: 'সংরক্ষণ করুন',
      cancel: 'বাতিল',
      delete: 'মুছুন',
      search: 'অনুসন্ধান...',
      phone: 'ফোন নম্বর',
      note: 'মন্তব্য',
      date: 'তারিখ',
      rupee: '₹',
      status: 'অবস্থা',
      action: 'পদক্ষেপ',
      settings: 'সেটিংস',
      shopInfo: 'দোকান তথ্য',
      switchLang: 'ভাষা',
      back: 'ফিরে যান',
      paid: 'পরিশোধিত',
      all: 'সকল',
      edit: 'সম্পাদনা',
      quantity: 'পরিমাণ',
      unit: 'একক',
      price: 'মূল্য',
      totalAmount: 'মোট টাকা',
      dueDate: 'পরিশোধের তারিখ',
      paymentMode: 'পরিশোধের মাধ্যম',
      itemName: 'পণ্যের নাম',
      architectureBlueprint: 'আর্কিটেকচার বিবরণ',
    },
    login: {
      title: 'দোকান খাতায় লগইন করুন',
      subtitle: 'বাকি খাতা, কর্মী হাজিরা ও গল্লা হিসাব নিরাপদে পরিচালনা করুন।',
      loginIdOrEmail: 'লগইন আইডি বা ইমেল',
      loginIdPlaceholder: 'যেমন shree_ram_store বা dukandar@gmail.com',
      password: 'পাসওয়ার্ড',
      passwordPlaceholder: 'আপনার পাসওয়ার্ড লিখুন',
      showPassword: 'দেখান',
      hidePassword: 'লুকান',
      loginBtn: 'লগইন করুন',
      loggingIn: 'লগইন হচ্ছে...',
      forgotPassword: 'পাসওয়ার্ড ভুলে গেছেন?',
      createAccount: 'নতুন অ্যাকাউন্ট তৈরি করুন',
      haveAccount: 'ইতিমধ্যে অ্যাকাউন্ট আছে? লগইন করুন',
      orDivider: 'অথবা',
      googleLogin: 'Google দিয়ে লগইন করুন',
      forgotPasswordTitle: 'পাসওয়ার্ড পুনরায় সেট করুন',
      forgotPasswordDesc: 'আপনার নিবন্ধিত ইমেল বা লগইন আইডি লিখুন। আমরা নিরাপদ লিঙ্ক পাঠাব।',
      sendResetLink: 'রিসেট লিঙ্ক পাঠান',
      resetLinkSent: 'পাসওয়ার্ড রিসেট লিঙ্ক আপনার ইমেলে পাঠানো হয়েছে!',
      backToLogin: 'লগইন স্ক্রিনে ফিরে যান',
      createAccountTitle: 'দোকানদার অ্যাকাউন্ট নিবন্ধন করুন',
      createAccountBtn: 'অ্যাকাউন্ট তৈরি করুন',
      creatingAccount: 'অ্যাকাউন্ট তৈরি হচ্ছে...',
    },
    account: {
      title: 'অ্যাকাউন্ট বিবরণ (Account)',
      subtitle: 'আপনার দোকানদার প্রোফাইল, নিরাপত্তা ও সেটিংস পরিচালনা করুন।',
      loginIdEmail: 'লগইন আইডি / ইমেল',
      ownerName: 'মালিকের নাম',
      shopName: 'দোকানের নাম',
      phoneNumber: 'মোবাইল নম্বর',
      accountStatus: 'অ্যাকাউন্টের অবস্থা',
      statusActive: 'সক্রিয় ও সুরক্ষিত',
      statusPro: '১-বছর প্রো লাইসেন্স',
      lastLogin: 'সর্বশেষ লগইন',
      logoutBtn: 'লগআউট করুন',
      changePassword: 'পাসওয়ার্ড পরিবর্তন (ইমেলের মাধ্যমে)',
      deleteAccountRequest: 'অ্যাকাউন্ট মুছে ফেলার অনুরোধ',
      deleteAccountConfirmTitle: 'আপনি কি অ্যাকাউন্ট মুছে ফেলতে চান?',
      deleteAccountConfirmDesc: 'যাচাইয়ের পর আপনার সমস্ত দোকানের ডেটা ও ক্লাউড ব্যাকআপ স্থায়ীভাবে মুছে যাবে।',
      confirmDeleteBtn: 'মুছে ফেলার অনুরোধ জমা দিন',
      resetEmailSent: 'পাসওয়ার্ড রিসেট লিঙ্ক আপনার ইমেলে পাঠানো হয়েছে।',
    },
    languageSettings: {
      title: 'Language',
      subtitle: 'আপনার পছন্দের ভাষা নির্বাচন করুন। সমস্ত স্ক্রিন অবিলম্বে পরিবর্তিত হবে।',
      selectLanguage: 'ভাষা নির্বাচন করুন',
      previewTitle: 'ভাষার পূর্বরূপ (Preview)',
      previewNotice: 'নির্বাচিত ভাষায় দোকান ইন্টারফেসের নমুনা',
      applyLanguage: 'ভাষা প্রয়োগ করুন',
      currentActive: 'সক্রিয়',
    },
    validationErrors: {
      emptyLoginId: 'অনুগ্রহ করে আপনার লগইন আইডি বা ইমেল লিখুন',
      emptyPassword: 'অনুগ্রহ করে আপনার পাসওয়ার্ড লিখুন',
      wrongCredentials: 'ভুল লগইন আইডি বা পাসওয়ার্ড',
      userNotFound: 'ব্যবহারকারী খুঁজে পাওয়া যায়নি',
      tooManyAttempts: 'অনেক বার ভুল চেষ্টা করা হয়েছে, অনুগ্রহ করে কয়েক মিনিট পর আবার চেষ্টা করুন',
      noInternet: 'ইন্টারনেট সংযোগ নেই',
      accountDisabled: 'এই অ্যাকাউন্টটি নিষ্ক্রিয় করা হয়েছে',
      unknownError: 'কিছু ভুল হয়েছে, অনুগ্রহ করে আবার চেষ্টা করুন',
    },
    emptyStates: {
      noUdhari: 'কোনো বাকি খাতার রেকর্ড পাওয়া যায়নি।',
      noStaff: 'এখনও কোনো কর্মী যোগ করা হয়নি।',
      noSuppliers: 'কোনো সাপ্লায়ার বাকি নেই।',
      noExpenses: 'এই মাসের কোনো খরচ নথিভুক্ত নেই।',
    },
    paymentStatus: {
      pending: 'বাকি',
      paid: 'পরিশোধিত',
      overdue: 'সময় উত্তীর্ণ',
      partial: 'আংশিক পরিশোধ',
    },
    attendanceStatusLabels: {
      present: 'উপস্থিত',
      absent: 'অনুপস্থিত',
      half_day: 'অর্ধ দিবস',
      late: 'দেরি',
      overtime: 'ওভারটাইম',
      leave: 'ছুটি',
    },
    reminderStatus: {
      reminderSent: 'তাগাদা পাঠানো হয়েছে',
      reminderPending: 'তাগাদা বাকি',
      reminderOverdue: 'সময় উত্তীর্ণ তাগাদা',
    },
  },
};

export const statusColors: Record<AttendanceStatus, { bg: string; text: string; border: string }> = {
  present: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  absent: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
  half_day: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  late: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
  overtime: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  leave: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
};

export interface ExpenseCategoryDetail {
  icon: string;
  en: string;
  hi: string;
  or: string;
  bn: string;
}

export const expenseCategoryLabels: Record<ExpenseCategory, ExpenseCategoryDetail> = {
  'Tea & Snacks': {
    icon: '☕',
    en: 'Tea & Snacks',
    hi: 'चाय व नाश्ता',
    or: 'ଚାହା ଓ ଜଳଖିଆ',
    bn: 'চা ও নাশতা',
  },
  'Transport / Tempo': {
    icon: '🚚',
    en: 'Transport / Tempo',
    hi: 'भाड़ा / ट्रांसपोर्ट',
    or: 'ପରିବହନ / ଭଡ଼ା',
    bn: 'পরিবহন / ভাড়া',
  },
  'Electricity & Utilities': {
    icon: '💡',
    en: 'Electricity & Utilities',
    hi: 'बिजली / पानी बिल',
    or: 'ବିଜୁଳି ବିଲ୍',
    bn: 'বিদ্যুৎ বিল',
  },
  'Shop Rent': {
    icon: '🏪',
    en: 'Shop Rent',
    hi: 'दुकान किराया',
    or: 'ଦୋକାନ ଭଡ଼ା',
    bn: 'দোকান ভাড়া',
  },
  'Packaging & Bags': {
    icon: '🛍️',
    en: 'Packaging & Bags',
    hi: 'थैली व पैकेजिंग',
    or: 'ପ୍ୟାକେଜିଂ ଓ ଥଳି',
    bn: 'প্যাকেজিং ও ব্যাগ',
  },
  'Staff Food': {
    icon: '🍲',
    en: 'Staff Food',
    hi: 'स्टाफ खाना / नाश्ता',
    or: 'କର୍ମଚାରୀ ଖାଦ୍ୟ',
    bn: 'কর্মীদের খাবার',
  },
  'Repairs & Maintenance': {
    icon: '🔧',
    en: 'Repairs & Maintenance',
    hi: 'मरम्मत व रखरखाव',
    or: 'ମରାମତି',
    bn: 'মেরামত ও রক্ষণাবেক্ষণ',
  },
  'Police & Muni': {
    icon: '👮',
    en: 'Police & Muni',
    hi: 'नगरपालिका / अन्य',
    or: 'ପୌରପାଳିକା / ଅନ୍ୟାନ୍ୟ',
    bn: 'পৌরসভা / অন্যান্য',
  },
  'Other': {
    icon: '📋',
    en: 'Other Expense',
    hi: 'अन्य खर्च',
    or: 'ଅନ୍ୟାନ୍ୟ ଖର୍ଚ୍ଚ',
    bn: 'অন্যান্য খরচ',
  },
};

