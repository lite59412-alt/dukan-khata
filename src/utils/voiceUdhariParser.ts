/**
 * Voice Parser for DukaanPro "Voice Add Udhari"
 * Supports Hindi, Hinglish, and English voice commands.
 * Examples:
 * - "Ramesh ko 2 kilo chawal 120 rupaye ka udhar"
 * - "Suresh ko 5 packet biscuit 50 rupaye"
 * - "Mahesh bhai 1 litre tel 140 rupaye"
 * - "Rahul 500 rupaye ka atta"
 * - "2 kilo chawal 120 rupaye Ramesh"
 */

export interface ParsedVoiceUdhari {
  rawTranscript: string;
  customerName: string;
  matchedCustomer?: {
    key: string;
    name: string;
    phone: string;
  };
  itemName: string;
  quantity: string;
  unit: string;
  amount: string;
  price?: string;
  missingFields: ('customer' | 'item' | 'amount' | 'quantity')[];
  confidence: number;
}

export interface ExistingCustomerRef {
  key: string;
  name: string;
  phone: string;
}

// Common Hindi number words to digits
const HINDI_NUMBER_WORDS: Record<string, number> = {
  ek: 1,
  do: 2,
  teen: 3,
  char: 4,
  chaar: 4,
  paanch: 5,
  panch: 5,
  chhe: 6,
  che: 6,
  saat: 7,
  aath: 8,
  nau: 9,
  das: 10,
  gyarah: 11,
  barah: 12,
  pandrah: 15,
  bees: 20,
  bis: 20,
  pachees: 25,
  tees: 30,
  chalis: 40,
  pachas: 50,
  saath: 60,
  sattar: 70,
  assi: 80,
  nabbe: 90,
  sau: 100,
  derh: 1.5,
  dhai: 2.5,
  aadha: 0.5,
  adha: 0.5,
  half: 0.5,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};

// Common units normalization
const UNIT_MAP: Record<string, string> = {
  kilo: 'kg',
  kilos: 'kg',
  kg: 'kg',
  kgs: 'kg',
  kilogram: 'kg',
  kilograms: 'kg',
  gram: 'gm',
  grams: 'gm',
  gm: 'gm',
  gms: 'gm',
  g: 'gm',
  litre: 'litre',
  liter: 'litre',
  litres: 'litre',
  liters: 'litre',
  ltr: 'litre',
  l: 'litre',
  packet: 'packet',
  packets: 'packet',
  pkt: 'packet',
  pkts: 'packet',
  piece: 'pcs',
  pieces: 'pcs',
  pcs: 'pcs',
  pc: 'pcs',
  darjan: 'dozen',
  dozen: 'dozen',
  dabba: 'box',
  box: 'box',
  bora: 'sack',
  sack: 'sack',
  pouch: 'pouch',
  pouches: 'pouch',
  bottle: 'bottle',
  bottles: 'bottle',
};

export function parseVoiceUdhariCommand(
  rawTranscript: string,
  existingCustomers: ExistingCustomerRef[] = [],
  popularItemNames: string[] = []
): ParsedVoiceUdhari {
  const cleanTranscript = (rawTranscript || '').trim();
  let text = cleanTranscript.toLowerCase();

  // Normalize punctuation and extra spaces
  text = text.replace(/[,.-]/g, ' ').replace(/\s+/g, ' ');

  let detectedCustomer = '';
  let matchedCustomer: ExistingCustomerRef | undefined;
  let detectedItem = '';
  let detectedQuantity = '';
  let detectedUnit = 'pcs';
  let detectedAmount = '';

  // 1. Try matching existing customers directly from transcript
  // Look for full names first, then first names
  if (existingCustomers.length > 0) {
    // Sort by name length descending so "Ramesh Sharma" matches before "Ramesh"
    const sortedExisting = [...existingCustomers].sort(
      (a, b) => b.name.length - a.name.length
    );

    for (const cust of sortedExisting) {
      const cName = cust.name.toLowerCase().trim();
      if (!cName) continue;

      // Check if text contains customer full name
      const regex = new RegExp(`\\b${cName}\\b`, 'i');
      if (regex.test(text)) {
        detectedCustomer = cust.name;
        matchedCustomer = cust;
        // Remove customer name from parsing text
        text = text.replace(regex, ' [CUST] ');
        break;
      }

      // Check first name if full name has multiple words
      const firstName = cName.split(' ')[0];
      if (firstName.length >= 3) {
        const fnRegex = new RegExp(`\\b${firstName}\\b`, 'i');
        if (fnRegex.test(text)) {
          detectedCustomer = cust.name;
          matchedCustomer = cust;
          text = text.replace(fnRegex, ' [CUST] ');
          break;
        }
      }
    }
  }

  // 2. If no existing customer matched, extract customer name from common Hindi/English patterns
  if (!detectedCustomer) {
    // Patterns like "Ramesh ko", "Ramesh bhai ko", "Suresh ji ko", "Raju ka"
    const hindiCustMatch = text.match(
      /^(?:add\s+udhari\s+)?([a-z\u0900-\u097f]+(?:\s+[a-z\u0900-\u097f]+)?)\s+(?:ko|ka|ki|ke|se|bhai|ji|ne)\b/i
    );
    if (hindiCustMatch && hindiCustMatch[1]) {
      const candidate = hindiCustMatch[1].trim();
      // Ensure candidate is not a number or command word
      if (!/^(add|udhari|nayi|ek|do|teen|\d+)/i.test(candidate)) {
        detectedCustomer = candidate;
        text = text.replace(hindiCustMatch[0], ' [CUST] ');
      }
    }

    // English patterns like "for Ramesh", "to Ramesh", "give Ramesh"
    if (!detectedCustomer) {
      const engCustMatch = text.match(/(?:for|to|give|customer)\s+([a-z]+(?:\s+[a-z]+)?)\b/i);
      if (engCustMatch && engCustMatch[1]) {
        detectedCustomer = engCustMatch[1].trim();
        text = text.replace(engCustMatch[0], ' [CUST] ');
      }
    }
  }

  // Capitalize detected customer name nicely
  if (detectedCustomer) {
    detectedCustomer = detectedCustomer
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  // 3. Extract Amount
  // Patterns like "120 rupaye", "₹120", "rs 120", "120 rs", "120 ka udhar", "120 rupaye ka udhar"
  const amountPatterns = [
    /(?:₹|rs\.?|inr)\s*(\d+(?:\.\d+)?)/i,
    /(\d+(?:\.\d+)?)\s*(?:rupaye|rupayee|rupees|rupee|rs|inr|rupya|rupe|ka|ki)\s*(?:ka\s+)?(?:udhar)?/i,
    /(\d+(?:\.\d+)?)\s*(?:ka\s+)?udhar/i,
    /(\d+(?:\.\d+)?)\s*(?:rupaye|rupees|rs)/i,
  ];

  for (const pat of amountPatterns) {
    const amtMatch = text.match(pat);
    if (amtMatch && amtMatch[1]) {
      detectedAmount = amtMatch[1];
      text = text.replace(pat, ' [AMT] ');
      break;
    }
  }

  // If amount still not found, check for standalone number towards the end or after "udhar"
  if (!detectedAmount) {
    const endNumberMatch = text.match(/\b(\d{2,6})\b(?!\s*(?:kg|kilo|gram|gm|litre|liter|packet|pcs|piece))/i);
    if (endNumberMatch && endNumberMatch[1]) {
      detectedAmount = endNumberMatch[1];
      text = text.replace(endNumberMatch[0], ' [AMT] ');
    }
  }

  // 4. Extract Quantity and Unit
  // Patterns like "2 kilo", "500 gm", "1.5 litre", "5 packet", "10 pcs"
  const qtyUnitPattern = /(\d+(?:\.\d+)?|\d+\/\d+|aadha|adha|ek|do|teen|char|paanch|chhe|saat|aath|nau|das|one|two|three|four|five)\s*(kilo|kg|kilograms|kilogram|gram|gm|gms|litre|liter|litres|ltr|l|packet|packets|pkt|pkts|piece|pieces|pcs|pc|darjan|dozen|dabba|box|bora|sack|pouch|bottle)?\b/i;
  const qtyMatch = text.match(qtyUnitPattern);

  if (qtyMatch) {
    const rawQty = qtyMatch[1].toLowerCase();
    const rawUnit = (qtyMatch[2] || '').toLowerCase();

    // Convert word number if needed
    if (HINDI_NUMBER_WORDS[rawQty] !== undefined) {
      detectedQuantity = String(HINDI_NUMBER_WORDS[rawQty]);
    } else {
      detectedQuantity = rawQty;
    }

    if (rawUnit && UNIT_MAP[rawUnit]) {
      detectedUnit = UNIT_MAP[rawUnit];
    } else if (rawUnit) {
      detectedUnit = rawUnit;
    }

    text = text.replace(qtyMatch[0], ' [QTY] ');
  }

  // 5. Extract Item Name
  // First check if any known popular item appears in the text or original transcript
  if (popularItemNames.length > 0) {
    for (const popName of popularItemNames) {
      const pRegex = new RegExp(`\\b${popName.toLowerCase().trim()}\\b`, 'i');
      if (pRegex.test(cleanTranscript.toLowerCase())) {
        detectedItem = popName;
        break;
      }
    }
  }

  // If not found in popular items, extract from residual text
  if (!detectedItem) {
    // Clean out placeholders and stop words
    let itemResidual = text
      .replace(/\[cust\]/gi, '')
      .replace(/\[amt\]/gi, '')
      .replace(/\[qty\]/gi, '')
      .replace(/\b(ko|ka|ki|ke|se|bhai|ji|ne|udhar|udhari|hai|hain|karo|likho|likh|do|de|diya|rupaye|rupees|rs|add|new|please|pe|par)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // If customer wasn't caught earlier, and residual has 2 words, the first might be customer
    if (!detectedCustomer && itemResidual) {
      const words = itemResidual.split(' ');
      if (words.length >= 2) {
        detectedCustomer = words[0].charAt(0).toUpperCase() + words[0].slice(1).toLowerCase();
        itemResidual = words.slice(1).join(' ');
      }
    }

    if (itemResidual) {
      // Capitalize first letter of item
      detectedItem = itemResidual
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    }
  }

  // Fallback defaults if partially matched
  if (!detectedQuantity) {
    detectedQuantity = '1';
  }

  // Determine missing fields
  const missingFields: ('customer' | 'item' | 'amount' | 'quantity')[] = [];
  if (!detectedCustomer) missingFields.push('customer');
  if (!detectedItem) missingFields.push('item');
  if (!detectedAmount || parseFloat(detectedAmount) <= 0) missingFields.push('amount');

  // Calculate confidence score (0 to 1)
  let score = 1.0;
  if (!detectedCustomer) score -= 0.35;
  if (!detectedItem) score -= 0.35;
  if (!detectedAmount) score -= 0.3;

  return {
    rawTranscript: cleanTranscript,
    customerName: detectedCustomer,
    matchedCustomer,
    itemName: detectedItem,
    quantity: detectedQuantity,
    unit: detectedUnit || 'pcs',
    amount: detectedAmount,
    price:
      detectedAmount && detectedQuantity && parseFloat(detectedQuantity) > 0
        ? String(Math.round(parseFloat(detectedAmount) / parseFloat(detectedQuantity)))
        : detectedAmount,
    missingFields,
    confidence: Math.max(0, score),
  };
}
