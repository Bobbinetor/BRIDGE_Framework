/**
 * Calendar Debugger Script
 * This script helps diagnose issues with calendar event indicators
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Calendar debugger loaded');
    
    // Wait for calendar to be fully initialized
    setTimeout(debugCalendar, 2000);
    
    // Add a button to manually trigger debugging
    const debugBtn = document.createElement('button');
    debugBtn.textContent = 'Debug Calendar';
    debugBtn.style.position = 'fixed';
    debugBtn.style.bottom = '10px';
    debugBtn.style.right = '10px';
    debugBtn.style.zIndex = '9999';
    debugBtn.style.padding = '5px 10px';
    debugBtn.style.backgroundColor = '#ff5733';
    debugBtn.style.color = 'white';
    debugBtn.style.border = 'none';
    debugBtn.style.borderRadius = '4px';
    debugBtn.style.cursor = 'pointer';
    
    debugBtn.addEventListener('click', function() {
        debugCalendar();
        
        // Also try to fix indicators
        fixCalendarIndicators();
    });
    
    document.body.appendChild(debugBtn);
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
        console.log('Sample of days with indicators:');
        Array.from(daysWithIndicators).slice(0, 5).forEach((cell, i) => {
            console.log(`Indicator ${i}:`, {
                text: cell.innerText,
                'data-date': cell.dataset.date,
                classes: cell.className
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
}

function fixCalendarIndicators() {
    console.log('Attempting to fix calendar indicators...');
    
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
    
    // Manual fallback: add indicators to a few days
    const dayCells = calendarMonthDiv.querySelectorAll('.datepicker-cell.day');
    if (dayCells.length > 0) {
        console.log('Adding test indicators to some days...');
        
        // Add to days 5, 10, 15, 20, 25
        const testDays = [5, 10, 15, 20, 25];
        
        dayCells.forEach(cell => {
            if (!cell.classList.contains('prev') && !cell.classList.contains('next')) {
                const dayNum = parseInt(cell.innerText.trim());
                if (!isNaN(dayNum) && testDays.includes(dayNum)) {
                    cell.classList.add('has-events');
                    
                    // Add a visible marker for debugging
                    cell.style.border = '2px solid red';
                    
                    console.log(`Added test indicator to day ${dayNum}`);
                }
            }
        });
    }
}
