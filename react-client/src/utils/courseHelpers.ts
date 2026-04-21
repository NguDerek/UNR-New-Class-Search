// Helper function to format time from 24-hour to 12-hour with AM/PM
export function formatTime(timeString: string | null): string {
  if (!timeString) return '';
  
  // timeString is like "12:00:00" or "14:30:00"
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const minute = minutes;
  
  // Convert to 12-hour format
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12; // Convert 0 to 12 for midnight
  
  return `${hour12}:${minute} ${period}`;
}

// Helper function to determine course level from catalog number
export function getCourseLevel(catalogNum: string): string {
  const num = parseInt(catalogNum, 10);
  
  if(Number.isNaN(num)) return 'Other';
  if (num >= 500) return '600+ Level';
  if (num >= 400) return '400 Level';
  if (num >= 300) return '300 Level';
  if (num >= 200) return '200 Level';
  if (num >= 100) return '100 Level';
  return 'Other';
}

// Helper function to determine course career from catalog number
export function getCourseCareer(catalogNum: string): string {
  const num = parseInt(catalogNum, 10);

  if (Number.isNaN(num)) return 'Undergraduate';
  if (num >= 600) return 'Graduate';  // If your school uses 600+ for med
  return 'Undergraduate';
}

// Helper function to format instruction mode
export function formatInstructionMode(mode: string): string {
  const modeMap: Record<string, string> = {
    'P': 'In Person',
    'HY': 'Hybrid',
    'WL': 'Synchronous Online',
    'WA': 'Asynchronous Online',
  };
  return modeMap[mode] || mode;
}