export const getMexicoDayString = (date: Date = new Date()) => {
    // Return a string formatted as "YYYY-MM-DD" in the America/Mexico_City timezone
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Mexico_City',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(date);
};

export const getMexicoStartOfDayISO = (dateStr: string) => {
    // Input dateStr is like "2026-03-11"
    // We want the UTC time that corresponds to 2026-03-11T00:00:00.000 in America/Mexico_City
    // A simple hack without a library: construct ISO string in UTC-6
    // Since Mexico City is mostly UTC-6 (no daylight saving time as of 2023), 
    return new Date(`${dateStr}T00:00:00-06:00`).toISOString();
};

export const getMexicoEndOfDayISO = (dateStr: string) => {
    // Input dateStr is like "2026-03-11"
    return new Date(`${dateStr}T23:59:59.999-06:00`).toISOString();
};

export const parseMexicoDateToLocal = (dateStr: string) => {
    // Display dates as if they were local, by explicitly parsing local timezone
    return new Date(`${dateStr}T12:00:00.000`);
};
