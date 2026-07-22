/**
 * Bikram Sambat (BS) - Nepali Calendar Converter & Formatting Library
 * Provides accurate AD <-> BS conversion, Fiscal Year calculations, and dual date formatting.
 */

export interface BSDate {
  year: number;
  month: number; // 1 to 12
  day: number;   // 1 to 32
  monthName: string;
  monthNameNp: string;
  strBS: string; // e.g. "2083-04-07"
  formatted: string; // e.g. "2083 Shrawan 7"
}

export const BS_MONTHS_EN = [
  'Baisakh',
  'Jestha',
  'Ashadh',
  'Shrawan',
  'Bhadra',
  'Ashwin',
  'Kartik',
  'Mangsir',
  'Poush',
  'Magh',
  'Falgun',
  'Chaitra'
];

export const BS_MONTHS_NP = [
  'बैशाख',
  'जेठ',
  'असार',
  'साउन',
  'भदौ',
  'असोज',
  'कात्तिक',
  'मंसीर',
  'पुस',
  'माघ',
  'फागुन',
  'चैत'
];

export const BS_DAYS_NP = ['आइतबार', 'सोमबार', 'मंगलबार', 'बुधबार', 'बिहिबार', 'शुक्रबार', 'शनिबार'];
export const BS_DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Days in each month for BS years 2075 to 2090
const BS_MONTH_DAYS: Record<number, number[]> = {
  2075: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2076: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2077: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2078: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2079: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2080: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2081: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2082: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30],
  2083: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30], // 2026-2027 AD
  2084: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2085: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30],
  2086: [31, 31, 32, 32, 31, 30, 30, 29, 30, 29, 30, 30],
  2087: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2088: [31, 31, 32, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2089: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2090: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 30]
};

// Reference point: 2083 Baisakh 1 = 2026-04-14 (AD)
const REF_BS_YEAR = 2083;
const REF_AD_DATE = new Date(2026, 3, 14); // 14 April 2026

/**
 * Converts a Gregorian AD Date object or ISO date string to Bikram Sambat (BS)
 */
export function adToBs(dateInput?: Date | string | null): BSDate {
  if (!dateInput) {
    const today = new Date();
    return adToBs(today);
  }

  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) {
    return adToBs(new Date());
  }

  // Calculate total days difference from reference date (2083 Baisakh 1 = 2026-04-14)
  const diffTime = date.getTime() - REF_AD_DATE.getTime();
  let totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  let bsYear = REF_BS_YEAR;
  let bsMonth = 1; // 1-indexed (Baisakh)
  let bsDay = 1;

  if (totalDays >= 0) {
    while (totalDays > 0) {
      const monthDays = getDaysInBSMonth(bsYear, bsMonth);
      if (totalDays >= monthDays) {
        totalDays -= monthDays;
        bsMonth++;
        if (bsMonth > 12) {
          bsMonth = 1;
          bsYear++;
        }
      } else {
        bsDay += totalDays;
        totalDays = 0;
      }
    }
  } else {
    totalDays = Math.abs(totalDays);
    while (totalDays > 0) {
      bsMonth--;
      if (bsMonth < 1) {
        bsMonth = 12;
        bsYear--;
      }
      const monthDays = getDaysInBSMonth(bsYear, bsMonth);
      if (totalDays >= monthDays) {
        totalDays -= monthDays;
      } else {
        bsDay = monthDays - totalDays + 1;
        totalDays = 0;
      }
    }
  }

  const monthName = BS_MONTHS_EN[bsMonth - 1] || 'Baisakh';
  const monthNameNp = BS_MONTHS_NP[bsMonth - 1] || 'बैशाख';
  const strMonth = String(bsMonth).padStart(2, '0');
  const strDay = String(bsDay).padStart(2, '0');
  const strBS = `${bsYear}-${strMonth}-${strDay}`;
  const formatted = `${bsYear} ${monthName} ${bsDay}`;

  return {
    year: bsYear,
    month: bsMonth,
    day: bsDay,
    monthName,
    monthNameNp,
    strBS,
    formatted
  };
}

/**
 * Gets number of days in a given BS Month and Year
 */
export function getDaysInBSMonth(bsYear: number, bsMonth: number): number {
  const yearDays = BS_MONTH_DAYS[bsYear];
  if (yearDays && yearDays[bsMonth - 1]) {
    return yearDays[bsMonth - 1];
  }
  // Standard fallback
  const defaultDays = [31, 31, 32, 31, 31, 30, 30, 29, 30, 29, 30, 30];
  return defaultDays[(bsMonth - 1) % 12];
}

/**
 * Converts Bikram Sambat (BS) date to Gregorian AD Date
 */
export function bsToAd(bsYear: number, bsMonth: number, bsDay: number): Date {
  let daysDiff = 0;

  if (bsYear >= REF_BS_YEAR) {
    for (let y = REF_BS_YEAR; y < bsYear; y++) {
      for (let m = 1; m <= 12; m++) {
        daysDiff += getDaysInBSMonth(y, m);
      }
    }
    for (let m = 1; m < bsMonth; m++) {
      daysDiff += getDaysInBSMonth(bsYear, m);
    }
    daysDiff += (bsDay - 1);

    const resultAD = new Date(REF_AD_DATE);
    resultAD.setDate(resultAD.getDate() + daysDiff);
    return resultAD;
  } else {
    for (let y = bsYear; y < REF_BS_YEAR; y++) {
      for (let m = 1; m <= 12; m++) {
        daysDiff += getDaysInBSMonth(y, m);
      }
    }
    // Adjust current target year months
    for (let m = 1; m < bsMonth; m++) {
      daysDiff -= getDaysInBSMonth(bsYear, m);
    }
    daysDiff -= (bsDay - 1);

    const resultAD = new Date(REF_AD_DATE);
    resultAD.setDate(resultAD.getDate() - daysDiff);
    return resultAD;
  }
}

/**
 * Formats Dual Dates (BS + AD) nicely for UI header badges or detail views
 * Example output: "2083 Shrawan 7 (22 Jul 2026)" or "2083/04/07 (BS)"
 */
export function formatDualDate(
  dateInput?: Date | string | null,
  options: { showDual?: boolean; preferredCalendar?: 'BS' | 'AD' } = {}
): string {
  if (!dateInput) return 'N/A';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return String(dateInput);

  const bs = adToBs(d);
  const day = String(d.getDate()).padStart(2, '0');
  const monthNamesAD = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formattedAD = `${day} ${monthNamesAD[d.getMonth()]} ${d.getFullYear()}`;

  const showDual = options.showDual !== false; // default true
  const preferred = options.preferredCalendar || 'BS';

  if (preferred === 'BS') {
    return showDual
      ? `${bs.year} ${bs.monthName} ${bs.day} (${formattedAD})`
      : `${bs.strBS} (BS)`;
  } else {
    return showDual
      ? `${formattedAD} (${bs.year} ${bs.monthName} ${bs.day})`
      : `${formattedAD}`;
  }
}

/**
 * Calculates current Nepal Fiscal Year based on AD or BS date
 * Nepal Fiscal Year starts Shrawan 1 (approx July 16 AD)
 * Example: 2083/84 (BS)
 */
export function getCurrentFiscalYearBS(dateInput?: Date | string | null): string {
  const bs = adToBs(dateInput);
  if (bs.month >= 4) {
    // Shrawan (Month 4) to Chaitra (Month 12)
    const nextYearTwoDigits = String((bs.year + 1) % 100).padStart(2, '0');
    return `${bs.year}/${nextYearTwoDigits} (BS)`;
  } else {
    // Baisakh (1), Jestha (2), Ashadh (3)
    const prevYear = bs.year - 1;
    const currentYearTwoDigits = String(bs.year % 100).padStart(2, '0');
    return `${prevYear}/${currentYearTwoDigits} (BS)`;
  }
}

/**
 * Formats standard Nepali Rupee with thousands separator
 */
export function formatNPR(amount: number | null | undefined, symbol = 'Rs.'): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return `${symbol} 0`;
  }
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  }).format(amount);
  return `${symbol} ${formatted}`;
}
