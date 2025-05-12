/**
 * Date parser utility to handle natural language date inputs
 */

// Days of the week for matching
const DAYS_OF_WEEK = [
  'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
];

// Days of the week abbreviations
const DAYS_ABBR = [
  'sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'
];

// Month names for matching
const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june', 
  'july', 'august', 'september', 'october', 'november', 'december'
];

// Month abbreviations
const MONTHS_ABBR = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun', 
  'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
];

/**
 * Parse a date string and return a Date object
 * @param {string} input - The input string to parse
 * @returns {object} An object with the parsed date and the original text that was matched
 */
export function parseDate(input) {
  if (!input) return { date: null, match: '' };
  
  // Lowercase and trim the input
  input = input.toLowerCase().trim();
  
  // Try various parsing strategies
  
  // 1. Check for date formats like MM/DD or M/D
  const slashDatePattern = /(\d{1,2})\/(\d{1,2})(\/(\d{2,4}))?/;
  const slashMatch = input.match(slashDatePattern);
  if (slashMatch) {
    const month = parseInt(slashMatch[1], 10) - 1; // 0-based month
    const day = parseInt(slashMatch[2], 10);
    let year = slashMatch[4] ? parseInt(slashMatch[4], 10) : new Date().getFullYear();
    
    // Handle 2-digit years
    if (year < 100) {
      year += year < 50 ? 2000 : 1900;
    }
    
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setFullYear(year, month, day);
    
    return { 
      date, 
      match: slashMatch[0]
    };
  }
  
  // 2. Check for day of week names (e.g., "Wednesday", "wed")
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentDayOfWeek = today.getDay();
  
  // Full day names - use word boundary regex
  for (let i = 0; i < DAYS_OF_WEEK.length; i++) {
    const day = DAYS_OF_WEEK[i];
    const dayRegex = new RegExp(`\\b${day}\\b`, 'i');
    
    if (dayRegex.test(input)) {
      const match = input.match(dayRegex)[0];
      const targetDate = new Date(today);
      
      // If the mentioned day is today, use today
      if (i === currentDayOfWeek) {
        return { 
          date: targetDate, 
          match
        };
      }
      
      // If the day is in the future this week
      let daysToAdd = i - currentDayOfWeek;
      if (daysToAdd <= 0) {
        daysToAdd += 7; // Go to next week if it's today or in the past
      }
      
      targetDate.setDate(targetDate.getDate() + daysToAdd);
      return { 
        date: targetDate, 
        match
      };
    }
  }
  
  // Day abbreviations - use word boundary regex
  for (let i = 0; i < DAYS_ABBR.length; i++) {
    const dayAbbr = DAYS_ABBR[i];
    const dayAbbrRegex = new RegExp(`\\b${dayAbbr}\\b`, 'i');
    
    if (dayAbbrRegex.test(input)) {
      const match = input.match(dayAbbrRegex)[0];
      const targetDate = new Date(today);
      
      // If the mentioned day is today, use today
      if (i === currentDayOfWeek) {
        return { 
          date: targetDate, 
          match
        };
      }
      
      // If the day is in the future this week
      let daysToAdd = i - currentDayOfWeek;
      if (daysToAdd <= 0) {
        daysToAdd += 7; // Go to next week if it's today or in the past
      }
      
      targetDate.setDate(targetDate.getDate() + daysToAdd);
      return { 
        date: targetDate, 
        match
      };
    }
  }
  
  // 3. Check for month and day format (e.g., "May 13")
  // Use word boundaries for month names to avoid partial matches
  const monthDayPattern = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})\b/i;
  const monthMatch = input.match(monthDayPattern);
  
  if (monthMatch) {
    const monthStr = monthMatch[1].toLowerCase();
    const day = parseInt(monthMatch[2], 10);
    
    let monthIndex = -1;
    
    // Check for full month name
    for (let i = 0; i < MONTHS.length; i++) {
      if (monthStr === MONTHS[i]) {
        monthIndex = i;
        break;
      }
    }
    
    // If not found, check for abbreviated month
    if (monthIndex === -1) {
      for (let i = 0; i < MONTHS_ABBR.length; i++) {
        if (monthStr === MONTHS_ABBR[i]) {
          monthIndex = i;
          break;
        }
      }
    }
    
    if (monthIndex !== -1) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      
      // Handle month in next year if it's already passed
      const currentMonth = date.getMonth();
      const year = monthIndex < currentMonth ? date.getFullYear() + 1 : date.getFullYear();
      
      date.setFullYear(year, monthIndex, day);
      
      return { 
        date, 
        match: monthMatch[0]
      };
    }
  }
  
  // If no match was found, return null
  return { date: null, match: '' };
}

/**
 * Process input text, extract date reference, and update input
 * @param {string} input - The input text
 * @returns {object} Object with the new text and parsed date
 */
export function processDueDateText(input) {
  if (!input) return { updatedText: '', dueDate: null };
  
  const result = parseDate(input);
  
  if (result.date) {
    // Remove the matched portion from the input
    const updatedText = input.replace(result.match, '').trim();
    return {
      updatedText,
      dueDate: result.date
    };
  }
  
  // If no date was found, return original input and null date
  return {
    updatedText: input,
    dueDate: null
  };
}

export default {
  parseDate,
  processDueDateText
}; 