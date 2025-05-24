/**
 * Calendar Debugger Script
 * This script helps diagnose issues with calendar event indicators
 * but runs silently without visible UI elements
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Calendar debugger loaded - silent mode');
    
    // Wait for calendar to be fully initialized, then run debug silently
    setTimeout(debugCalendar, 2000);
    
    // No longer adding a visible debug button
    // Instead, expose the debug functions to the global scope for console access
    window.debugCalendar = debugCalendar;
    window.fixCalendarIndicators = fixCalendarIndicators;
    window.cleanAllIndicators = cleanAllIndicators; // New function to force clean all indicators
});

function debugCalendar() {
    console.log('=== CALENDAR DEBUG INFO ===');
    
    // Check for calendar element
    const calendarMonthDiv = document.getElementById('calendar-month');
    if (!calendarMonthDiv) {
        console.error('Calendar element not found');
        return;
    }
    console.log('Calendar element found:', calendarMonthDiv);
    
    // Check Datepicker initialization
    const hasDatepickerClass = calendarMonthDiv.querySelector('.datepicker');
    console.log('Has datepicker class:', !!hasDatepickerClass);
    
    // Check for day cells
    const dayCells = calendarMonthDiv.querySelectorAll('.datepicker-cell.day');
    console.log('Day cells found:', dayCells.length);
    
    // Log the data-date attributes of all day cells
    if (dayCells.length > 0) {
        console.log('Sample of day cells:');
        Array.from(dayCells).slice(0, 5).forEach((cell, i) => {
            console.log(`Cell ${i}:`, {
                text: cell.innerText,
                'data-date': cell.dataset.date,
                classes: cell.className
            });
        });
    }
    
    // Check for indicators
    const daysWithIndicators = calendarMonthDiv.querySelectorAll('.has-events');
    console.log('Days with indicators:', daysWithIndicators.length);
    
    if (daysWithIndicators.length > 0) {
        console.log('All days with indicators:');
        Array.from(daysWithIndicators).forEach((cell, i) => {
            console.log(`Indicator ${i}:`, {
                text: cell.innerText,
                'data-date': cell.dataset.date,
                classes: cell.className,
                isCurrentMonth: !cell.classList.contains('prev') && !cell.classList.contains('next')
            });
        });
    }
    
    // Get the current month/year
    const headerText = calendarMonthDiv.querySelector('.datepicker-header')?.textContent;
    console.log('Calendar header:', headerText);
    
    // Check CSS for indicators
    const computedStyle = getComputedStyle(document.documentElement);
    console.log('CSS for indicators:', {
        'content': computedStyle.getPropertyValue('--indicator-content'),
        'position': computedStyle.getPropertyValue('--indicator-position'),
        'color': computedStyle.getPropertyValue('--indicator-color'),
        'display': computedStyle.getPropertyValue('--indicator-display')
    });
    
    // Check event API responses for current month
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    
    fetch(`/api/events/month/${year}-${month}`)
        .then(response => response.json())
        .then(events => {
            console.log(`API returned ${events.length} events for current month`);
            if (events.length > 0) {
                console.log('Sample event:', events[0]);
                console.log('Event dates:', events.map(e => e.start?.split('T')[0] || e.start?.split(' ')[0]));
            }
        })
        .catch(err => console.error('Error fetching events for debugging:', err));
}

function fixCalendarIndicators() {
    console.log('Attempting to fix calendar indicators...');
    
    // First clean all indicators
    cleanAllIndicators();
    
    const calendarMonthDiv = document.getElementById('calendar-month');
    if (!calendarMonthDiv) return;
    
    // Get current month/year
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    
    // Force fetch events for current month
    if (window.fetchEventsForMonth) {
        console.log('Calling fetchEventsForMonth manually...');
        window.fetchEventsForMonth(year, month);
    } else {
        console.warn('fetchEventsForMonth function not found');
    }
}

// New function to force clean all indicators everywhere
function cleanAllIndicators() {
    console.log('Force cleaning ALL event indicators...');
    
    // Clean every element with .has-events class in the entire document
    const allIndicators = document.querySelectorAll('.has-events');
    console.log(`Found ${allIndicators.length} indicators to clean`);
    
    allIndicators.forEach(el => {
        el.classList.remove('has-events');
        console.log('Removed indicator from element:', el);
    });
    
    // For calendar cells specifically
    const calendarMonthDiv = document.getElementById('calendar-month');
    if (calendarMonthDiv) {
        // Get all cells in the calendar
        const allCells = calendarMonthDiv.querySelectorAll('.datepicker-cell');
        
        // Remove has-events class from all cells
        allCells.forEach(cell => {
            if (cell.classList.contains('has-events')) {
                cell.classList.remove('has-events');
                console.log('Removed indicator from calendar cell:', cell.innerText, cell.dataset.date);
            }
        });
    }
    
    return 'All indicators cleaned!';
}
