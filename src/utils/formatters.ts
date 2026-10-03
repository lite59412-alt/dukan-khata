import { Language, SalaryCalculationResult, UdhariEntry, SupplierDueEntry } from '../types';

export function formatINR(amount: number): string {
  if (isNaN(amount)) return '₹0';
  const isNegative = amount < 0;
  const abs = Math.abs(Math.round(amount));
  
  // Format with Indian Rupee numbering (2,2,3 grouping)
  const str = abs.toString();
  let lastThree = str.substring(str.length - 3);
  const otherNumbers = str.substring(0, str.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  return `${isNegative ? '-' : ''}₹${formatted}`;
}

export function formatDate(dateString: string, lang: Language = 'en'): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  };

  let locale = 'en-IN';
  if (lang === 'hi') locale = 'hi-IN';
  else if (lang === 'or') locale = 'or-IN';
  else if (lang === 'bn') locale = 'bn-IN';

  try {
    return date.toLocaleDateString(locale, options);
  } catch (e) {
    return date.toLocaleDateString('en-IN', options);
  }
}

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function generateWhatsAppUdhariMessage(
  entry: UdhariEntry,
  shopName: string,
  upiId: string,
  lang: Language
): string {
  const cleanPhone = entry.customerPhone.replace(/[^0-9]/g, '');
  const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  let text = '';
  if (lang === 'hi') {
    text = `नमस्ते ${entry.customerName} जी,\n\nयह ${shopName} की तरफ से उधारी भुगतान का विनम्र अनुस्मारक है:\n\n सामान: ${entry.itemName} (${entry.quantity})\n बाकी रकम: ₹${entry.amount}\n अंतिम देय तिथि: ${formatDate(entry.dueDate, 'hi')}\n\nकृपया नीचे दिए गए UPI पर भुगतान करें:\nUPI ID: ${upiId}\n\nधन्यवाद!\n${shopName}`;
  } else if (lang === 'or') {
    text = `ନମସ୍କାର ${entry.customerName} ଆଜ୍ଞା,\n\nଏହା ${shopName} ତରଫରୁ ବାକି ଉଧାରି ଟଙ୍କା ପୈଠ ପାଇଁ ଏକ ବିନମ୍ର ସ୍ମାରକ:\n\n ସାମଗ୍ରୀ: ${entry.itemName} (${entry.quantity})\n ବାକି ଟଙ୍କା: ₹${entry.amount}\n ଶେଷ ତାରିଖ: ${formatDate(entry.dueDate, 'or')}\n\nଦୟାକରି ଏହି UPI ରେ ଟଙ୍କା ପୈଠ କରନ୍ତୁ:\nUPI ID: ${upiId}\n\nଧନ୍ୟବାଦ!\n${shopName}`;
  } else if (lang === 'bn') {
    text = `নমস্কার ${entry.customerName} বাবু,\n\nএটি ${shopName}-এর পক্ষ থেকে বাকি টাকা পরিশোধের একটি বিনীত অনুস্মারক:\n\n পণ্য: ${entry.itemName} (${entry.quantity})\n বকেয়া টাকা: ₹${entry.amount}\n পরিশোধের শেষ তারিখ: ${formatDate(entry.dueDate, 'bn')}\n\nদয়া করে নিচে দেওয়া UPI-এ টাকা পাঠান:\nUPI ID: ${upiId}\n\nধন্যবাদ!\n${shopName}`;
  } else {
    text = `Hello ${entry.customerName},\n\nThis is a polite reminder from ${shopName} regarding your pending bill:\n\n Item: ${entry.itemName} (${entry.quantity})\n Amount Due: ₹${entry.amount}\n Due Date: ${formatDate(entry.dueDate, 'en')}\n\nPlease pay via UPI to:\nUPI ID: ${upiId}\n\nThank you!\n${shopName}`;
  }

  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`;
}

export function generateSalarySlipWhatsAppText(
  calc: SalaryCalculationResult,
  shopName: string,
  lang: Language
): string {
  const statusLabel = {
    hi: calc.paymentStatus === 'paid' ? 'पूर्ण भुगतान (Paid)' : calc.paymentStatus === 'partially_paid' ? 'आंशिक भुगतान (Partially Paid)' : 'बकाया (Pending)',
    or: calc.paymentStatus === 'paid' ? 'ପୂର୍ଣ୍ଣ ପୈଠ (Paid)' : calc.paymentStatus === 'partially_paid' ? 'ଆଂଶିକ ପୈଠ (Partially Paid)' : 'ବାକି (Pending)',
    bn: calc.paymentStatus === 'paid' ? 'সম্পূর্ণ পরিশোধিত (Paid)' : calc.paymentStatus === 'partially_paid' ? 'আংশিক পরিশোধিত (Partially Paid)' : 'বকেয়া (Pending)',
    en: calc.paymentStatus === 'paid' ? 'Paid' : calc.paymentStatus === 'partially_paid' ? 'Partially Paid' : 'Pending',
  };

  if (lang === 'hi') {
    return `*वेतन पर्ची (Salary Slip) - ${calc.month}*\n` +
      `दुकान: ${shopName}\n` +
      `स्टाफ: ${calc.staffName} (${calc.role})\n` +
      `--------------------------------\n` +
      `मूल वेतन (Basic): ₹${calc.basicSalary.toLocaleString('en-IN')}\n` +
      `उपस्थित दिन: ${calc.presentDays} दिन\n` +
      `आधा दिन: ${calc.halfDays} दिन\n` +
      `अनुपस्थित दिन: ${calc.absentDays} दिन\n` +
      `ओवरटाइम: ${calc.overtimeHours} घंटे (+₹${calc.overtimePay.toLocaleString('en-IN')})\n` +
      `प्रोत्साहन (Incentive): +₹${calc.incentive.toLocaleString('en-IN')}\n` +
      `--------------------------------\n` +
      `कटौतियाँ:\n` +
      `- देरी कटौती: -₹${calc.lateDeduction.toLocaleString('en-IN')}\n` +
      `- अनुपस्थिति कटौती: -₹${calc.absenceDeduction.toLocaleString('en-IN')}\n` +
      `- अग्रिम (Advance): -₹${calc.advanceDeduction.toLocaleString('en-IN')}\n` +
      `- ऋण किस्त (Loan): -₹${calc.loanDeduction.toLocaleString('en-IN')}\n` +
      `कुल कटौती: -₹${calc.totalDeductions.toLocaleString('en-IN')}\n` +
      `================================\n` +
      `*कुल देय वेतन: ₹${calc.netSalary.toLocaleString('en-IN')}*\n` +
      `*कुल भुगतान किया: ₹${calc.totalPaid.toLocaleString('en-IN')}*\n` +
      `*बकाया वेतन (Remaining): ₹${calc.remainingSalary.toLocaleString('en-IN')}*\n` +
      `*भुगतान स्थिति: ${statusLabel.hi}*\n` +
      `================================\n` +
      `धन्यवाद! आपका सहयोग सराहनीय है।`;
  }

  if (lang === 'or') {
    return `*ଦରମା ସ୍ଲିପ୍ (Salary Slip) - ${calc.month}*\n` +
      `ଦୋକାନ: ${shopName}\n` +
      `କର୍ମଚାରୀ: ${calc.staffName} (${calc.role})\n` +
      `--------------------------------\n` +
      `ମୂଳ ଦରମା (Basic): ₹${calc.basicSalary.toLocaleString('en-IN')}\n` +
      `ଉପସ୍ଥିତ ଦିନ: ${calc.presentDays} ଦିନ\n` +
      `ଅଧା ଦିନ: ${calc.halfDays} ଦିନ\n` +
      `ଅନୁପସ୍ଥିତ: ${calc.absentDays} ଦିନ\n` +
      `ଓଭରଟାଇମ୍: ${calc.overtimeHours} ଘଣ୍ଟା (+₹${calc.overtimePay.toLocaleString('en-IN')})\n` +
      `ପ୍ରୋତ୍ସାହନ (Incentive): +₹${calc.incentive.toLocaleString('en-IN')}\n` +
      `--------------------------------\n` +
      `କଟାତି:\n` +
      `- ବିଳମ୍ବ କଟାତି: -₹${calc.lateDeduction.toLocaleString('en-IN')}\n` +
      `- ଅନୁପସ୍ଥିତି କଟାତି: -₹${calc.absenceDeduction.toLocaleString('en-IN')}\n` +
      `- ଅଗ୍ରିମ କଟାତି (Advance): -₹${calc.advanceDeduction.toLocaleString('en-IN')}\n` +
      `- ଋଣ କିସ୍ତି (Loan): -₹${calc.loanDeduction.toLocaleString('en-IN')}\n` +
      `ମୋଟ କଟାତି: -₹${calc.totalDeductions.toLocaleString('en-IN')}\n` +
      `================================\n` +
      `*ମୋଟ ପ୍ରଦେୟ ଦରମା: ₹${calc.netSalary.toLocaleString('en-IN')}*\n` +
      `*ମୋଟ ପୈଠ ହୋଇଛି: ₹${calc.totalPaid.toLocaleString('en-IN')}*\n` +
      `*ବକେୟା ଦରମା (Remaining): ₹${calc.remainingSalary.toLocaleString('en-IN')}*\n` +
      `*ପୈଠ ସ୍ଥିତି: ${statusLabel.or}*\n` +
      `================================\n` +
      `ଧନ୍ୟବାଦ! ଆପଣଙ୍କ ପରିଶ୍ରମ ପ୍ରଶଂସନୀୟ।`;
  }

  if (lang === 'bn') {
    return `*বেতন স্লিপ (Salary Slip) - ${calc.month}*\n` +
      `দোকান: ${shopName}\n` +
      `কর্মী: ${calc.staffName} (${calc.role})\n` +
      `--------------------------------\n` +
      `মূল বেতন (Basic): ₹${calc.basicSalary.toLocaleString('en-IN')}\n` +
      `উপস্থিত দিন: ${calc.presentDays} দিন\n` +
      `অর্ধেক দিন: ${calc.halfDays} দিন\n` +
      `অনুপস্থিত: ${calc.absentDays} দিন\n` +
      `ওভারটাইম: ${calc.overtimeHours} ঘণ্টা (+₹${calc.overtimePay.toLocaleString('en-IN')})\n` +
      `ইনসেন্টিভ (Incentive): +₹${calc.incentive.toLocaleString('en-IN')}\n` +
      `--------------------------------\n` +
      `কর্তনসমূহ:\n` +
      `- দেরি কর্তন: -₹${calc.lateDeduction.toLocaleString('en-IN')}\n` +
      `- অনুপস্থিতি কর্তন: -₹${calc.absenceDeduction.toLocaleString('en-IN')}\n` +
      `- অগ্রিম কর্তন (Advance): -₹${calc.advanceDeduction.toLocaleString('en-IN')}\n` +
      `- ঋণ কিস্তি (Loan): -₹${calc.loanDeduction.toLocaleString('en-IN')}\n` +
      `মোট কর্তন: -₹${calc.totalDeductions.toLocaleString('en-IN')}\n` +
      `================================\n` +
      `*মোট প্রদেয় বেতন: ₹${calc.netSalary.toLocaleString('en-IN')}*\n` +
      `*পরিশোধিত অর্থ: ₹${calc.totalPaid.toLocaleString('en-IN')}*\n` +
      `*বকেয়া বেতন (Remaining): ₹${calc.remainingSalary.toLocaleString('en-IN')}*\n` +
      `*পেমেন্ট স্ট্যাটাস: ${statusLabel.bn}*\n` +
      `================================\n` +
      `ধন্যবাদ! আপনার পরিশ্রমের জন্য আমরা কৃতজ্ঞ।`;
  }

  return `*SALARY SLIP - ${calc.month}*\n` +
    `Shop: ${shopName}\n` +
    `Staff: ${calc.staffName} (${calc.role})\n` +
    `--------------------------------\n` +
    `Basic Salary: ₹${calc.basicSalary.toLocaleString('en-IN')}\n` +
    `Days Present: ${calc.presentDays} days\n` +
    `Half Days: ${calc.halfDays} days\n` +
    `Absent Days: ${calc.absentDays} days\n` +
    `Overtime: ${calc.overtimeHours} hrs (+₹${calc.overtimePay.toLocaleString('en-IN')})\n` +
    `Incentive/Bonus: +₹${calc.incentive.toLocaleString('en-IN')}\n` +
    `--------------------------------\n` +
    `Deductions:\n` +
    `- Late Penalty: -₹${calc.lateDeduction.toLocaleString('en-IN')}\n` +
    `- Absence Deduction: -₹${calc.absenceDeduction.toLocaleString('en-IN')}\n` +
    `- Advance Taken: -₹${calc.advanceDeduction.toLocaleString('en-IN')}\n` +
    `- Loan Repayment: -₹${calc.loanDeduction.toLocaleString('en-IN')}\n` +
    `Total Deductions: -₹${calc.totalDeductions.toLocaleString('en-IN')}\n` +
    `================================\n` +
    `*NET PAYABLE: ₹${calc.netSalary.toLocaleString('en-IN')}*\n` +
    `*TOTAL PAID: ₹${calc.totalPaid.toLocaleString('en-IN')}*\n` +
    `*REMAINING SALARY: ₹${calc.remainingSalary.toLocaleString('en-IN')}*\n` +
    `*STATUS: ${statusLabel.en}*\n` +
    `================================\n` +
    `Thank you for your dedicated service!`;
}

export function generateSupplierPurchaseListWhatsAppText(
  supplier: SupplierDueEntry,
  shopName: string,
  lang: Language = 'en'
): string {
  const cleanPhone = supplier.supplierPhone.replace(/[^0-9]/g, '');
  const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  let itemListStr = '';
  if (supplier.items && supplier.items.length > 0) {
    itemListStr = supplier.items
      .map(
        (item, idx) =>
          `${idx + 1}. ${item.itemName} - ${item.quantity} ${item.unit || ''} @ ₹${item.price} = ₹${item.totalAmount}`
      )
      .join('\n');
  } else {
    itemListStr = `1. ${supplier.itemPurchased} - ${supplier.quantity} = ₹${supplier.amount}`;
  }

  let text = '';
  if (lang === 'hi') {
    text = `*खरीद बिल सारांश (Purchase Bill Summary)*\n` +
      `दुकान: ${shopName}\n` +
      `सप्लायर: ${supplier.supplierName}\n` +
      `खरीद तारीख: ${formatDate(supplier.date, 'hi')}\n` +
      `अंतिम भुगतान तारीख: ${formatDate(supplier.dueDate, 'hi')}\n` +
      `--------------------------------\n` +
      `*सामान सूची:*\n${itemListStr}\n` +
      `--------------------------------\n` +
      `कुल बिल राशि: ₹${supplier.amount.toLocaleString('en-IN')}\n` +
      `भुगतान की गई राशि: ₹${supplier.paidAmount.toLocaleString('en-IN')}\n` +
      `*बाकी राशि: ₹${supplier.dueAmount.toLocaleString('en-IN')}*\n` +
      (supplier.note ? `नोट: ${supplier.note}\n` : '') +
      `================================\n` +
      `कृपया पुष्टि करें। सादर, ${shopName}`;
  } else if (lang === 'or') {
    text = `*କ୍ରୟ ବିଲ୍ ସାରାଂଶ (Purchase Bill Summary)*\n` +
      `ଦୋକାନ: ${shopName}\n` +
      `ସପ୍ଲାୟାର: ${supplier.supplierName}\n` +
      `କ୍ରୟ ତାରିଖ: ${formatDate(supplier.date, 'or')}\n` +
      `ଦେୟ ତାରିଖ: ${formatDate(supplier.dueDate, 'or')}\n` +
      `--------------------------------\n` +
      `*ସାମଗ୍ରୀ ତାଲିକା:*\n${itemListStr}\n` +
      `--------------------------------\n` +
      `ମୋଟ ବିଲ୍ ରାଶି: ₹${supplier.amount.toLocaleString('en-IN')}\n` +
      `ପୈଠ ରାଶି: ₹${supplier.paidAmount.toLocaleString('en-IN')}\n` +
      `*ବାକି ରାଶି: ₹${supplier.dueAmount.toLocaleString('en-IN')}*\n` +
      (supplier.note ? `ଟିପ୍ପଣୀ: ${supplier.note}\n` : '') +
      `================================\n` +
      `ଦୟାକରି ଯାଞ୍ଚ କରନ୍ତୁ। ସାଦର, ${shopName}`;
  } else if (lang === 'bn') {
    text = `*ক্রয় বিল বিবরণী (Purchase Bill Summary)*\n` +
      `দোকান: ${shopName}\n` +
      `সাপ্লায়ার: ${supplier.supplierName}\n` +
      `ক্রয়ের তারিখ: ${formatDate(supplier.date, 'bn')}\n` +
      `পরিশোধের শেষ তারিখ: ${formatDate(supplier.dueDate, 'bn')}\n` +
      `--------------------------------\n` +
      `*পণ্য তালিকা:*\n${itemListStr}\n` +
      `--------------------------------\n` +
      `মোট বিল: ₹${supplier.amount.toLocaleString('en-IN')}\n` +
      `পরিশোধিত টাকা: ₹${supplier.paidAmount.toLocaleString('en-IN')}\n` +
      `*বকেয়া টাকা: ₹${supplier.dueAmount.toLocaleString('en-IN')}*\n` +
      (supplier.note ? `মন্তব্য: ${supplier.note}\n` : '') +
      `================================\n` +
      `দয়া করে নিশ্চিত করুন। বিনীত, ${shopName}`;
  } else {
    text = `*PURCHASE BILL SUMMARY*\n` +
      `Shop: ${shopName}\n` +
      `Supplier: ${supplier.supplierName}\n` +
      `Purchase Date: ${formatDate(supplier.date, 'en')}\n` +
      `Due Date: ${formatDate(supplier.dueDate, 'en')}\n` +
      `--------------------------------\n` +
      `*Item List:*\n${itemListStr}\n` +
      `--------------------------------\n` +
      `Total Bill Amount: ₹${supplier.amount.toLocaleString('en-IN')}\n` +
      `Paid Amount: ₹${supplier.paidAmount.toLocaleString('en-IN')}\n` +
      `*Remaining Due: ₹${supplier.dueAmount.toLocaleString('en-IN')}*\n` +
      (supplier.note ? `Note: ${supplier.note}\n` : '') +
      `================================\n` +
      `Please verify and confirm. Regards, ${shopName}`;
  }

  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`;
}
