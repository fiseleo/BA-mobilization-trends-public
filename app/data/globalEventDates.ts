// This file stores the start and end times for the Global server corresponding to each event ID.
// Enter time in 'YYYY-MM-DDTHH:mm' format.

export const globalEventDates: Record<number, { start: string; end: string }> = {
    // Example data: Must be filled with actual event IDs and dates.
    10835: { // Placeholder event ID
        start: '2025-10-14T11:00',
        end: '2025-10-21T10:59'
    },
    10836: { // Another placeholder event ID
        start: '2025-11-04T11:00',
        end: '2025-11-18T10:59'
    },
    847: { // Another placeholder event ID
        start: '2025-11-18T11:00',
        end: '2025-12-02T10:59'
    },
    848: { // Another placeholder event ID
        start: '2025-12-16T11:00',
        end: '2025-12-30T10:59'
    }
    // ... Add Global server dates for other events.
};