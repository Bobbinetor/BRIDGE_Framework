document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const chatList = document.getElementById('chat-list');
    const messagesContainer = document.getElementById('messages-container');
    const chatMessages = document.getElementById('chat-messages');
    const welcomeContainer = document.getElementById('welcome-container');
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const newChatBtn = document.getElementById('new-chat-btn');
    const currentChatTitle = document.getElementById('current-chat-title');
    const renameChatBtn = document.getElementById('rename-chat-btn');
    const deleteChatBtn = document.getElementById('delete-chat-btn');
    const voiceBtn = document.getElementById('voice-btn');
    const languageSelector = document.getElementById('language-selector');
    const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
    const sidebar = document.querySelector('.sidebar');
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    
    const renameModal = document.getElementById('rename-modal');
    const newTitleInput = document.getElementById('new-title-input');
    const renameForm = document.getElementById('rename-form');
    const cancelRenameBtn = document.getElementById('cancel-rename-btn');
    
    const confirmModal = document.getElementById('confirm-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    
    // DOM elements for appointment modal
    const appointmentModal = document.getElementById('appointment-modal');
    const appointmentForm = document.getElementById('appointment-form');
    const appointmentTitle = document.getElementById('appointment-title');
    const appointmentStart = document.getElementById('appointment-start');
    const appointmentEnd = document.getElementById('appointment-end');
    const appointmentLocation = document.getElementById('appointment-location');
    const cancelAppointmentBtn = document.getElementById('cancel-appointment-btn');

    // DOM elements for event modal
    const eventModal = document.getElementById('event-modal');
    const eventForm = document.getElementById('event-form');
    const eventTitle = document.getElementById('event-title');
    const eventStart = document.getElementById('event-start');
    const eventEnd = document.getElementById('event-end');
    const eventLocation = document.getElementById('event-location');
    const cancelEventBtn = document.getElementById('cancel-event-btn');
    
    // Notification bell elements
    const notificationBell = document.getElementById('notification-bell');
    const notificationMenu = document.getElementById('notification-menu');
    const notificationList = document.getElementById('notification-list');
    const notificationBadge = document.getElementById('notification-badge');

    // Application state
    let currentChatId = null;
    let chats = [];
    let isProcessing = false;
    let mediaRecorder = null;
    let isRecording = false; // Track recording state
    let audioContext = null; // For playing received audio
    let audioSource = null; // For managing audio playback
    let socket = null; // WebSocket connection
    let speechRecognition = null; // For speech recognition
    let currentLanguage = 'en'; // Default language is English
    let current_user = { id: null }; // Add proper initialization for current_user

    // Calendario mensile nella sidebar
    const calendarMonthDiv = document.getElementById('calendar-month');
    const appointmentsList = document.getElementById('appointments-list');
    const addAppointmentBtn = document.getElementById('add-appointment-btn');
    const appointmentsTitle = document.getElementById('appointments-title');

    const eventsList = document.getElementById('events-list');
    const addEventBtn = document.getElementById('add-event-btn');
    const eventsTitle = document.getElementById('events-title');

    let selectedDate = null;

    // Inizializza calendario mensile
    function initCalendar() {
        if (!calendarMonthDiv) return;
        
        try {
            console.log('Initializing calendar...');
            
            // Create cache for events by month
            if (!window.eventCache) {
                window.eventCache = {};
            }
            
            // Ensure the locale is set to English
            Datepicker.locales.en = {
                days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
                daysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
                daysMin: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
                months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
                monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                today: "Today",
                clear: "Clear",
                format: "yyyy-mm-dd",
                titleFormat: "MM yyyy",
                weekStart: 0
            };
            
            // Configurazione del datepicker con opzioni ottimizzate per la sidebar
            const calendar = new Datepicker(calendarMonthDiv, {
                autohide: true,
                format: 'yyyy-mm-dd',
                todayHighlight: true,
                weekStart: 1, // Inizia con lunedì
                maxView: 1, // Limita la vista a mese
                minView: 0, // Vista minima è il giorno
                pickLevel: 0, // Seleziona a livello di giorno
                showOnFocus: true,
                todayBtn: false, // Rimuove il bottone "oggi" per risparmiare spazio
                clearBtn: false,
                prevArrow: '<i class="fas fa-chevron-left"></i>',
                nextArrow: '<i class="fas fa-chevron-right"></i>',
                container: calendarMonthDiv,
                title: '', // Rimuovi il titolo impostando una stringa vuota
                language: 'en' // Explicitly set English language
            });
            
            // Imposta oggi come selezionato
            const today = new Date();
            calendar.setDate(today);
            selectedDate = today.toISOString().slice(0,10);
            
            // Aggiorna titolo lista appuntamenti
            if (appointmentsTitle) {
                appointmentsTitle.textContent = formatDateShort(selectedDate);
            }

            // Aggiorna titolo lista eventi
            if (eventsTitle) {
                eventsTitle.textContent = formatDateShort(selectedDate);
            }
            
            // Carica appuntamenti per oggi
            loadAppointmentsForDate(selectedDate);

            // Carica eventi per oggi
            loadEventsForDate(selectedDate);
            
            // Load events for current month to show indicators - only once at init
            const currentYear = today.getFullYear();
            const currentMonth = today.getMonth() + 1; // JavaScript months are 0-based
            const currentMonthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
            
            // Only fetch if not already in cache
            fetchEventsForMonth(currentYear, currentMonth, true);
            
            // Listener per cambio data
            calendarMonthDiv.addEventListener('changeDate', function(e) {
                const dateObj = e.detail.date;
                if (!dateObj) return;
                
                // Format date without timezone issues
                const year = dateObj.getFullYear();
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                const day = String(dateObj.getDate()).padStart(2, '0');
                selectedDate = `${year}-${month}-${day}`;
                
                // Aggiorna titolo lista appuntamenti con formato compatto
                if (appointmentsTitle) {
                    appointmentsTitle.textContent = formatDateShort(selectedDate);
                }

                // Aggiorna titolo lista eventi con formato compatto
                if (eventsTitle) {
                    eventsTitle.textContent = formatDateShort(selectedDate);
                }
                
                // Carica appuntamenti per la data selezionata
                loadAppointmentsForDate(selectedDate);

                // Carica eventi per la data selezionata
                loadEventsForDate(selectedDate);
            });
            
            // Add listener for month change to update event indicators
            calendarMonthDiv.addEventListener('changeMonth', function(e) {
                console.log("Month changed in calendar");
                const dateObj = e.detail.date;
                if (!dateObj) return;
                
                const year = dateObj.getFullYear();
                const month = dateObj.getMonth() + 1; // JavaScript months are 0-based
                
                // Fetch events for the new month if not already in cache
                fetchEventsForMonth(year, month, true);
            });
            
            // Set up a single observer for calendar changes
            setupCalendarObserver();
            
            console.log('Calendar initialized successfully');
        } catch (error) {
            console.error('Error initializing calendar:', error);
        }
    }
    
    // Debounce function to limit API call frequency
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }
    
    // Rewritten function to fetch and display event indicators with caching
    function fetchEventsForMonth(year, month, forceRefresh = false) {
        // Format month with leading zero if needed
        const formattedMonth = String(month).padStart(2, '0');
        const cacheKey = `${year}-${formattedMonth}`;
        
        // Check if we already have this month's events in cache and not forcing refresh
        if (!forceRefresh && window.eventCache && window.eventCache[cacheKey]) {
            console.log(`Using cached events for ${cacheKey}`);
            
            // Apply cached events to calendar
            if (window.eventCache[cacheKey].length > 0) {
                clearEventIndicators();
                const processedDates = processEventDates(window.eventCache[cacheKey]);
                applyEventIndicators(processedDates);
            }
            return;
        }
        
        // Set a flag to avoid duplicate requests
        if (window.fetchingMonth === cacheKey) {
            console.log(`Already fetching events for ${cacheKey}, skipping duplicate request`);
            return;
        }
        
        window.fetchingMonth = cacheKey;
        console.log(`Fetching events for ${cacheKey} from server`);
        
        // Always clear existing indicators first - CRITICAL FIX
        clearEventIndicators();
        
        // Fetch events from server
        fetch(`/api/events/month/${cacheKey}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }
                return response.json();
            })
            .then(events => {
                // Clear the fetching flag
                window.fetchingMonth = null;
                
                if (!Array.isArray(events)) {
                    console.error('API returned non-array data:', events);
                    return;
                }
                
                // Filter out invalid events to prevent incorrect indicators
                const validEvents = events.filter(event => event && event.start);
                console.log(`Received ${events.length} events, ${validEvents.length} valid for ${cacheKey}`);
                
                // Store in cache
                if (!window.eventCache) {
                    window.eventCache = {};
                }
                window.eventCache[cacheKey] = validEvents;
                
                if (validEvents.length === 0) return;
                
                // Process events to extract dates with events - with enhanced validation
                const processedDates = processEventDates(validEvents);
                
                // Apply indicators to calendar days
                if (processedDates.size > 0) {
                    applyEventIndicators(processedDates);
                }
            })
            .catch(error => {
                window.fetchingMonth = null;
                console.error('Error fetching events:', error);
                // Ensure no phantom indicators remain on error
                clearEventIndicators();
            });
    }

    // Helper function to extract dates from events - improved for better validation
    function processEventDates(events) {
        const eventDates = new Set();
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        
        // Process each event to extract just the date part with careful validation
        events.forEach(event => {
            if (event && event.start) {
                try {
                    // Standardize date format extraction
                    let dateStr = '';
                    if (typeof event.start === 'string') {
                        // For ISO format with T separator (most common)
                        if (event.start.includes('T')) {
                            dateStr = event.start.split('T')[0];
                        } 
                        // For format with space separator
                        else if (event.start.includes(' ')) {
                            const parts = event.start.split(' ')[0].split('-');
                            if (parts.length === 3) {
                                // Ensure consistent formatting with leading zeros
                                dateStr = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
                            }
                        }
                        // Already in YYYY-MM-DD format
                        else if (/^\d{4}-\d{2}-\d{2}$/.test(event.start)) {
                            dateStr = event.start;
                        }
                        // Invalid format
                        else {
                            console.warn('Skipping event with invalid date format:', event.start);
                            return;
                        }
                    } else if (event.start instanceof Date) {
                        // Handle Date objects
                        const d = event.start;
                        dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    }
                    
                    // Additional validation - check if date is valid and properly formatted
                    if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                        const dateParts = dateStr.split('-');
                        const year = parseInt(dateParts[0]);
                        const month = parseInt(dateParts[1]);
                        const day = parseInt(dateParts[2]);
                        
                        // Validate date components
                        if (year > 1900 && year < 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                            eventDates.add(dateStr);
                            console.log(`Valid event on ${dateStr}: ${event.title || 'Unnamed event'}`);
                        } else {
                            console.warn(`Skipping event with invalid date components: ${dateStr}`);
                        }
                    } else {
                        console.warn(`Skipping event with malformed date: ${dateStr}`);
                    }
                } catch (e) {
                    console.error('Error processing event date:', e, event);
                }
            }
        });
        
        console.log(`Processed ${eventDates.size} unique valid dates with events:`, Array.from(eventDates));
        return eventDates;
    }

    // Clear all event indicators - strengthened to ensure complete cleanup
    function clearEventIndicators() {
        if (!calendarMonthDiv) return;
        
        // More thorough cleaning - get ALL cells that might have indicators
        const daysWithIndicators = document.querySelectorAll('.has-events');
        console.log(`Clearing ${daysWithIndicators.length} existing indicators`);
        
        daysWithIndicators.forEach(day => {
            day.classList.remove('has-events');
        });
        
        // Also check for any calendar cells and clean them too for redundancy
        const allCalendarCells = document.querySelectorAll('.datepicker-cell');
        allCalendarCells.forEach(cell => {
            if (cell.classList.contains('has-events')) {
                cell.classList.remove('has-events');
            }
        });
    }

    // Apply event indicators to calendar cells - improved with more precise date matching
    function applyEventIndicators(eventDates) {
        if (!calendarMonthDiv || !eventDates || eventDates.size === 0) {
            console.log('No dates to mark or calendar not available');
            return;
        }
        
        console.log('Applying event indicators to calendar...');
        
        // Try different selectors to find calendar day cells
        let dayCells = calendarMonthDiv.querySelectorAll('.datepicker-cell.day');
        
        if (dayCells.length === 0) {
            console.log('No day cells found with primary selector, trying alternatives...');
            dayCells = calendarMonthDiv.querySelectorAll('.datepicker-cell');
        }
        
        if (dayCells.length === 0) {
            console.error('Could not find any day cells in the calendar');
            return;
        }
        
        console.log(`Found ${dayCells.length} total day cells in calendar`);
        
        // Extract the current month and year from the calendar header for validation
        let currentViewMonth, currentViewYear;
        const header = calendarMonthDiv.querySelector('.datepicker-header');
        
        if (header) {
            const headerText = header.textContent.trim();
            const match = headerText.match(/([A-Za-z]+)\s+(\d{4})/);
            if (match) {
                const monthName = match[1];
                currentViewYear = parseInt(match[2]);
                // Map month name to month number
                const monthIndex = [
                    "January","February","March","April","May","June",
                    "July","August","September","October","November","December"
                ].findIndex(m => m.toLowerCase() === monthName.toLowerCase());
                if (monthIndex >= 0) {
                    currentViewMonth = monthIndex + 1;
                }
            }
        }
        
        // Debug - show what dates are available in the calendar
        const availableDates = new Set();
        dayCells.forEach(cell => {
            if (cell.dataset.date) {
                availableDates.add(cell.dataset.date);
            }
        });
        console.log('Available dates in calendar:', Array.from(availableDates));
        console.log('Events dates to mark:', Array.from(eventDates));
        
        // Mark days that have events - with additional validation
        let indicatorsAdded = 0;
        
        dayCells.forEach(cell => {
            // Skip days from previous/next months to avoid incorrect indicators
            if (cell.classList.contains('prev') || cell.classList.contains('next')) {
                return;
            }
            
            const cellDate = cell.dataset.date;
            
            // Ensure date format is valid before comparison
            if (cellDate && /^\d{4}-\d{2}-\d{2}$/.test(cellDate)) {
                // Extra validation - only add indicators to dates in the current view month
                if (currentViewMonth && currentViewYear) {
                    const cellParts = cellDate.split('-');
                    const cellYear = parseInt(cellParts[0]);
                    const cellMonth = parseInt(cellParts[1]);
                    
                    // Skip if the cell is not in the current view month/year
                    if (cellYear !== currentViewYear || cellMonth !== currentViewMonth) {
                        return;
                    }
                }
                
                // Exact matching of dates
                if (eventDates.has(cellDate)) {
                    cell.classList.add('has-events');
                    indicatorsAdded++;
                    console.log(`✓ Added indicator to ${cellDate}`);
                }
            } else if (cellDate) {
                console.warn(`Cell has invalid date format: ${cellDate}`);
            }
        });
        
        console.log(`Added indicators to ${indicatorsAdded} days out of ${eventDates.size} event dates`);
        
        // If no indicators were added but we have events, use fallback method only for current month cells
        if (indicatorsAdded === 0 && eventDates.size > 0) {
            console.warn('Failed to add any indicators despite having events - using fallback method');
            
            // Extract just the day numbers from event dates
            const eventDaysArray = [];
            eventDates.forEach(dateStr => {
                // Only include days from the current view month/year
                if (currentViewMonth && currentViewYear) {
                    const dateParts = dateStr.split('-');
                    const eventYear = parseInt(dateParts[0]);
                    const eventMonth = parseInt(dateParts[1]);
                    const eventDay = parseInt(dateParts[2]);
                    
                    if (eventYear === currentViewYear && eventMonth === currentViewMonth) {
                        eventDaysArray.push(eventDay);
                    }
                } else {
                    // If we can't determine current view, use the day part directly
                    eventDaysArray.push(parseInt(dateStr.split('-')[2]));
                }
            });
            
            console.log('Attempting to mark days by their number:', eventDaysArray);
            
            dayCells.forEach(cell => {
                // Only process cells that are in the current month view (not prev/next month)
                if (!cell.classList.contains('prev') && !cell.classList.contains('next')) {
                    const dayNum = parseInt(cell.innerText.trim());
                    if (!isNaN(dayNum) && eventDaysArray.includes(dayNum)) {
                        cell.classList.add('has-events');
                        console.log(`Added indicator to day ${dayNum} by number`);
                    }
                }
            });
        }
    }

    // Replace the multiple observer setup with a single, more efficient one
    function setupCalendarObserver() {
        if (!calendarMonthDiv) return;
        
        // Disconnect any existing observer
        if (window._calendarGridObserver) {
            window._calendarGridObserver.disconnect();
            console.log('Disconnected previous calendar observer');
        }
        
        // Target the view that changes when month navigation occurs
        const target = calendarMonthDiv.querySelector('.datepicker-view') || calendarMonthDiv;
        if (!target) return;
        
        // Create a debounced version of the update function
        const debouncedUpdate = debounce(() => {
            // Get current visible month and year from the calendar
            const header = calendarMonthDiv.querySelector('.datepicker-header');
            let year, month;
            
            if (header) {
                // Try to extract month and year from header text (e.g., "June 2024")
                const headerText = header.textContent.trim();
                const match = headerText.match(/([A-Za-z]+)\s+(\d{4})/);
                if (match) {
                    const monthName = match[1];
                    year = parseInt(match[2]);
                    
                    // Map month name to month number
                    const monthIndex = [
                        "January","February","March","April","May","June",
                        "July","August","September","October","November","December"
                    ].findIndex(m => m.toLowerCase() === monthName.toLowerCase());
                    
                    if (monthIndex >= 0) {
                        month = monthIndex + 1;
                    }
                }
            }
            
            // Fallback: use selectedDate if header parsing fails
            if (!year || !month) {
                const d = selectedDate ? new Date(selectedDate) : new Date();
                year = d.getFullYear();
                month = d.getMonth() + 1;
            }
            
            // Check if we need to update indicators from cache
            const cacheKey = `${year}-${String(month).padStart(2, '0')}`;
            
            // Apply cache if available without fetching
            if (window.eventCache && window.eventCache[cacheKey]) {
                console.log(`Observer: Using cached events for ${cacheKey}`);
                
                // Apply cached events to calendar
                clearEventIndicators();
                const processedDates = processEventDates(window.eventCache[cacheKey]);
                applyEventIndicators(processedDates);
            }
        }, 300); // Debounce with 300ms delay
        
        window._calendarGridObserver = new MutationObserver((mutations) => {
            // Only process if we have relevant mutations (class or structure changes)
            const relevantChange = mutations.some(mutation => 
                mutation.type === 'childList' || 
                (mutation.type === 'attributes' && mutation.attributeName === 'class')
            );
            
            if (relevantChange) {
                console.log('Relevant calendar change detected');
                debouncedUpdate();
            }
        });
        
        // Use a more specific configuration
        window._calendarGridObserver.observe(target, { 
            childList: true,    // Watch for added/removed nodes
            attributes: true,   // Watch for attribute changes
            attributeFilter: ['class'], // Only care about class changes
            subtree: false      // Don't need to watch all descendants
        });
        
        console.log('Calendar observer configured successfully');
    }

    // Completely replace the old observeCalendarGrid function
    function observeCalendarGrid() {
        // Just call the new setup function for compatibility with existing code
        setupCalendarObserver();
    }

    // Modified function to update event cache when a new event is added/updated
    function handleEventSubmit(e) {
        e.preventDefault();
        
        if (!eventTitle || !eventStart || !eventEnd || !eventLocation) return;
        
        const title = eventTitle.value.trim();
        let start, end;
        
        // Get date values from flatpickr if available
        if (eventStart._flatpickr) {
            const startDate = eventStart._flatpickr.selectedDates[0];
            start = startDate.toISOString();
        } else {
            start = new Date(eventStart.value).toISOString();
        }
        
        if (eventEnd._flatpickr) {
            const endDate = eventEnd._flatpickr.selectedDates[0];
            end = endDate.toISOString();
        } else {
            end = new Date(eventEnd.value).toISOString();
        }
        
        const location = eventLocation.value;
        
        // Check if we're updating an existing event or creating a new one
        const eventId = eventForm.getAttribute('data-event-id');
        const isUpdate = !!eventId;
        
        console.log(`${isUpdate ? 'Updating' : 'Creating'} event: ${title} from ${start} to ${end} at ${location}`);
        
        if (title && start && end && location) {
            // Show loading state
            const submitBtn = eventForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = isUpdate ? 'Updating...' : 'Saving...';
            
            // Prepare the event data
            const eventData = {
                title,
                start,
                end,
                location
            };
            
            // Determine API endpoint and method based on whether we're updating or creating
            const url = isUpdate ? `/api/events/${eventId}` : '/api/events';
            const method = isUpdate ? 'PUT' : 'POST';
            
            // Send to API
            fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventData)
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(errData => {
                        throw new Error(`Server error: ${errData.error || response.statusText}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                console.log(`Event ${isUpdate ? 'updated' : 'created'} successfully:`, data);
                // Reset form and close modal
                closeEventModal();
                
                // Extract date for display update and cache invalidation
                const eventDate = new Date(data.start);
                const eventYear = eventDate.getFullYear();
                const eventMonth = eventDate.getMonth() + 1;
                const eventMonthKey = `${eventYear}-${String(eventMonth).padStart(2, '0')}`;
                const eventDateStr = eventDate.toISOString().split('T')[0];
                
                console.log(`Event date for refresh: ${eventDateStr}, month key: ${eventMonthKey}`);
                
                // Invalidate cache for this month to ensure fresh data
                if (window.eventCache) {
                    delete window.eventCache[eventMonthKey];
                }
                
                // Fetch fresh events for this month
                fetchEventsForMonth(eventYear, eventMonth, true);
                
                // If we're viewing the date where the event was added/updated, update the list
                if (selectedDate === eventDateStr) {
                    loadEventsForDate(selectedDate);
                }
            })
            .catch(error => {
                console.error(`Error ${isUpdate ? 'updating' : 'creating'} event:`, error);
                alert(`Error ${isUpdate ? 'updating' : 'creating'} event: ${error.message}. Please try again.`);
            })
            .finally(() => {
                // Reset button state
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            });
        }
    }

    // Formattazione compatta della data per risparmiare spazio
    function formatDateShort(dateStr) {
        try {
            // Create date object and ensure we handle it as local time, not UTC
            const parts = dateStr.split('-');
            // Create date with year, month-1, day parameters (local timezone)
            const date = new Date(parts[0], parts[1] - 1, parts[2]);
            
            // Use en-US instead of it-IT to match the English UI
            return date.toLocaleDateString('en-US', { 
                day: 'numeric', 
                month: 'short' 
            });
        } catch (e) {
            console.error("Date formatting error:", e);
            return dateStr;
        }
    }

    // Carica appuntamenti per la data selezionata
    function loadAppointmentsForDate(dateStr) {
        if (!appointmentsList) return;
        
        const appointments = getAppointmentsForDate(dateStr);
        renderAppointmentsList(appointments);
    }

    // Ottieni appuntamenti dal localStorage per una data
    function getAppointmentsForDate(dateStr) {
        const all = JSON.parse(localStorage.getItem('appointments') || '{}');
        return all[dateStr] || [];
    }

    // Salva appuntamenti per una data
    function saveAppointmentsForDate(dateStr, appointments) {
        const all = JSON.parse(localStorage.getItem('appointments') || '{}');
        all[dateStr] = appointments;
        localStorage.setItem('appointments', JSON.stringify(all));
    }

    // Renderizza la lista appuntamenti with enhanced display
    function renderAppointmentsList(appointments) {
        if (!appointmentsList) return;
        
        appointmentsList.innerHTML = '';
        
        if (!appointments || appointments.length === 0) {
            appointmentsList.innerHTML = '<li style="color:#ccc;font-size:0.9em;text-align:center;">No appointments</li>';
            return;
        }
        
        appointments.forEach((appt, idx) => {
            const li = document.createElement('li');
            
            // Format the time display
            const timeDisplay = appt.time || appt.start?.split('T')[1].substring(0, 5) || '';
            const locationDisplay = appt.location ? `<span class="appointment-location"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(appt.location)}</span>` : '';
            
            li.innerHTML = `
                <div class="appointment-details">
                    <div class="appointment-title">${escapeHtml(appt.title)}</div>
                    <div class="appointment-meta">
                        <span class="appointment-time">${timeDisplay}</span>
                        ${locationDisplay}
                    </div>
                </div>
                <button class="delete-appointment-btn" title="Delete" data-idx="${idx}">
                    <i class="fas fa-trash-alt"></i>
                </button>`;
            appointmentsList.appendChild(li);
        });
        
        // Delete event handlers
        appointmentsList.querySelectorAll('.delete-appointment-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                const idx = parseInt(btn.getAttribute('data-idx'));
                let appointments = getAppointmentsForDate(selectedDate);
                appointments.splice(idx, 1);
                saveAppointmentsForDate(selectedDate, appointments);
                renderAppointmentsList(appointments);
            });
        });
    }

    // Carica eventi per la data selezionata
    function loadEventsForDate(dateStr) {
        if (!eventsList) return;
        
        // Show loading indicator
        eventsList.innerHTML = '<li style="color:#ccc;font-size:0.9em;text-align:center;">Loading events...</li>';
        
        console.log(`Loading events for date: ${dateStr}`);
        
        // Ensure the date is in YYYY-MM-DD format
        let formattedDate = dateStr;
        if (dateStr && typeof dateStr === 'string') {
            // Normalize the date format if needed
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                // Ensure leading zeros in month and day
                const year = parts[0];
                const month = parts[1].padStart(2, '0');
                const day = parts[2].padStart(2, '0');
                formattedDate = `${year}-${month}-${day}`;
            }
        }
        
        console.log(`Formatted date for API call: ${formattedDate}`);
        
        // Fetch events from API instead of localStorage
        fetch(`/api/events?date=${formattedDate}`)
            .then(response => {
                console.log(`API response status: ${response.status}`);
                if (!response.ok) {
                    return response.json().then(errData => {
                        throw new Error(`Server error: ${errData.error || response.statusText}`);
                    });
                }
                return response.json();
            })
            .then(events => {
                console.log(`Received ${events.length} events from server`);
                // Sort events by start time
                events.sort((a, b) => new Date(a.start) - new Date(b.start));
                renderEventsList(events);
            })
            .catch(error => {
                console.error('Error fetching events:', error);
                eventsList.innerHTML = `<li style="color:#ccc;font-size:0.9em;text-align:center;">Error loading events: ${error.message}</li>`;
                
                // Auto-retry after a short delay (only once)
                setTimeout(() => {
                    console.log('Retrying event fetch...');
                    fetch(`/api/events?date=${formattedDate}`)
                        .then(response => response.ok ? response.json() : [])
                        .then(events => {
                            if (events && events.length >= 0) {
                                console.log(`Retry succeeded, received ${events.length} events`);
                                events.sort((a, b) => new Date(a.start) - new Date(b.start));
                                renderEventsList(events);
                            }
                        })
                        .catch(retryError => {
                            console.error('Retry also failed:', retryError);
                        });
                }, 1000);
            });
    }

    // Renderizza la lista eventi with enhanced display
    function renderEventsList(events) {
        if (!eventsList) return;
        
        eventsList.innerHTML = '';
        
        if (!events || events.length === 0) {
            eventsList.innerHTML = '<li style="color:#ccc;font-size:0.9em;text-align:center;">No events</li>';
            return;
        }
        
        // Get current user ID safely
        const currentUserId = current_user && current_user.id ? current_user.id : null;
        console.log('Current user ID when rendering events:', currentUserId);
        
        events.forEach((evt) => {
            const li = document.createElement('li');
            
            // Format the time display - parse ISO string to get time
            const startDate = new Date(evt.start);
            const endDate = new Date(evt.end);
            const timeDisplay = `${startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}-${endDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
            
            const locationDisplay = evt.location ? 
                `<span class="event-location"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(evt.location)}</span>` : '';
            
            // Include username to show who created the event
            const usernameDisplay = `<span class="event-creator"><i class="fas fa-user"></i> ${escapeHtml(evt.username)}</span>`;
            
            // Only show action buttons if we know the current user and they own the event
            const showButtons = currentUserId && evt.user_id === currentUserId;
            
            li.innerHTML = `
                <div class="event-details">
                    <div class="event-title">${escapeHtml(evt.title)}</div>
                    <div class="event-meta">
                        <span class="event-time">${timeDisplay}</span>
                        ${locationDisplay}
                        ${usernameDisplay}
                    </div>
                </div>
                ${showButtons ? 
                `<div class="event-actions">
                    <button class="edit-event-btn themed-edit-btn" title="Edit event" data-id="${evt.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-event-btn themed-delete-btn" title="Delete event" data-id="${evt.id}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>` : ''}`;
                
            eventsList.appendChild(li);
        });
        
        // Add edit button handlers
        eventsList.querySelectorAll('.edit-event-btn').forEach(btn => {
            // Apply theme-consistent styling to edit buttons
            btn.addEventListener('mouseenter', function() {
                this.classList.add('edit-hover');
            });
            
            btn.addEventListener('mouseleave', function() {
                this.classList.remove('edit-hover');
            });
            
            // Edit event handler
            btn.addEventListener('click', function(e) {
                const eventId = btn.getAttribute('data-id');
                // Find the event in the current list
                const event = events.find(evt => evt.id === eventId);
                if (event) {
                    openEventModalForEdit(event);
                }
            });
        });
        
        // Add enhanced styling and effects to delete buttons
        eventsList.querySelectorAll('.delete-event-btn').forEach(btn => {
            btn.addEventListener('mouseenter', function() {
                this.classList.add('delete-hover');
            });
            
            btn.addEventListener('mouseleave', function() {
                this.classList.remove('delete-hover');
            });
            
            // Delete event handlers with improved feedback
            btn.addEventListener('click', function(e) {
                const eventId = btn.getAttribute('data-id');
                
                if (confirm('Are you sure you want to delete this event?')) {
                    // Show loading state
                    const originalHTML = btn.innerHTML;
                    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                    btn.disabled = true;
                    
                    // Find the event to get its date before deletion (for cache invalidation)
                    const eventToDelete = events.find(evt => evt.id === eventId);
                    let eventMonthKey = null;
                    
                    if (eventToDelete && eventToDelete.start) {
                        const eventDate = new Date(eventToDelete.start);
                        const eventYear = eventDate.getFullYear();
                        const eventMonth = eventDate.getMonth() + 1;
                        eventMonthKey = `${eventYear}-${String(eventMonth).padStart(2, '0')}`;
                    }
                    
                    fetch(`/api/events/${eventId}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Network response was not ok');
                        }
                        return response.json();
                    })
                    .then(data => {
                        if (data.success) {
                            // Visual feedback before reload
                            const listItem = btn.closest('li');
                            listItem.style.opacity = '0.5';
                            listItem.style.height = listItem.offsetHeight + 'px';
                            
                            // If we know which month this event was in, invalidate that cache
                            if (eventMonthKey && window.eventCache) {
                                console.log(`Invalidating cache for ${eventMonthKey} after deletion`);
                                delete window.eventCache[eventMonthKey];
                                
                                // Get the current month/year from the calendar
                                const header = calendarMonthDiv.querySelector('.datepicker-header');
                                if (header) {
                                    const headerText = header.textContent.trim();
                                    const match = headerText.match(/([A-Za-z]+)\s+(\d{4})/);
                                    if (match) {
                                        const monthName = match[1];
                                        const year = parseInt(match[2]);
                                        const monthIndex = [
                                            "January","February","March","April","May","June",
                                            "July","August","September","October","November","December"
                                        ].findIndex(m => m.toLowerCase() === monthName.toLowerCase());
                                        
                                        if (monthIndex >= 0) {
                                            const currentMonth = monthIndex + 1;
                                            const currentMonthKey = `${year}-${String(currentMonth).padStart(2, '0')}`;
                                            
                                            // If the deleted event was in the currently displayed month,
                                            // refresh the calendar indicators
                                            if (currentMonthKey === eventMonthKey) {
                                                setTimeout(() => {
                                                    fetchEventsForMonth(year, currentMonth, true);
                                                }, 300);
                                            }
                                        }
                                    }
                                }
                            }
                            
                            // Animate removal
                            setTimeout(() => {
                                listItem.style.height = '0';
                                listItem.style.margin = '0';
                                listItem.style.padding = '0';
                                listItem.style.overflow = 'hidden';
                                
                                // Reload events after animation
                                setTimeout(() => loadEventsForDate(selectedDate), 300);
                            }, 200);
                        } else {
                            alert('Error deleting event: ' + data.error);
                            btn.innerHTML = originalHTML;
                            btn.disabled = false;
                        }
                    })
                    .catch(error => {
                        console.error('Error deleting event:', error);
                        alert('Error deleting event. Please try again.');
                        btn.innerHTML = originalHTML;
                        btn.disabled = false;
                    });
                }
            });
        });
    }

    // New function to open event modal for editing
    function openEventModalForEdit(event) {
        if (!eventModal || !eventForm) return;
        
        console.log('Opening event modal for editing:', event);
        
        // Store the event ID in the form for update handling
        eventForm.setAttribute('data-event-id', event.id);
        
        // Set form values from event data
        if (eventTitle) {
            eventTitle.value = event.title;
        }
        
        // Parse the dates
        const startDate = new Date(event.start);
        const endDate = new Date(event.end);
        
        // Format for flatpickr or regular input
        const startFormatted = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')} ${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`;
        const endFormatted = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')} ${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
        
        // For Flatpickr inputs
        if (eventStart && eventStart._flatpickr) {
            eventStart._flatpickr.setDate(startFormatted);
        } else if (eventStart) {
            eventStart.value = startFormatted;
        }
        
        if (eventEnd && eventEnd._flatpickr) {
            eventEnd._flatpickr.setDate(endFormatted);
        } else if (eventEnd) {
            eventEnd.value = endFormatted;
        }
        
        // Set location if applicable
        if (eventLocation) {
            // Try to find the matching option
            const options = eventLocation.options;
            for (let i = 0; i < options.length; i++) {
                if (options[i].value === event.location) {
                    eventLocation.selectedIndex = i;
                    break;
                }
            }
        }
        
        // Update the submit button to show "Update"
        const submitBtn = eventForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = 'Update Event';
            submitBtn.classList.add('update-mode');
        }
        
        // Show the modal
        eventModal.classList.add('active');
        
        // Focus on the title field
        setTimeout(() => {
            if (eventTitle) {
                eventTitle.focus();
            }
        }, 200);
    }

    // Close event modal - updated to reset form state
    function closeEventModal() {
        if (eventModal) {
            eventModal.classList.remove('active');
            
            // Reset form state
            if (eventForm) {
                eventForm.removeAttribute('data-event-id');
                
                // Reset submit button
                const submitBtn = eventForm.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.innerHTML = 'Add Event';
                    submitBtn.classList.remove('update-mode');
                }
            }
        }
    }

    // Aggiungi appuntamento - Updated to use modal
    if (addAppointmentBtn) {
        addAppointmentBtn.addEventListener('click', function() {
            if (!selectedDate) return;
            openAppointmentModal();
        });
    }

    // Aggiungi evento - Updated to use modal
    if (addEventBtn) {
        addEventBtn.addEventListener('click', function() {
            if (!selectedDate) return;
            openEventModal();
        });
    }

    // Open appointment modal
    function openAppointmentModal() {
        if (!selectedDate) return;
        
        // Set default values
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        // Default to current date/time and one hour later for end
        const startDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
        
        // End time is one hour later
        now.setHours(now.getHours() + 1);
        const endHours = String(now.getHours()).padStart(2, '0');
        const endMinutes = String(now.getMinutes()).padStart(2, '0');
        const endDateTime = `${year}-${month}-${day}T${endHours}:${endMinutes}`;
        
        // Set form values
        if (appointmentTitle) appointmentTitle.value = '';
        if (appointmentStart) appointmentStart.value = startDateTime;
        if (appointmentEnd) appointmentEnd.value = endDateTime;
        if (appointmentLocation) appointmentLocation.selectedIndex = 0;
        
        // Set English locale for date inputs
        setDateInputsToEnglishLocale();
        
        // Show the modal
        if (appointmentModal) {
            appointmentModal.classList.add('active');
            // Focus on the title field
            setTimeout(() => appointmentTitle.focus(), 100);
        }
    }

    // Open event modal
    function openEventModal() {
        if (!selectedDate) return;
        
        console.log('Opening event modal...');
        
        // Set default values
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        // Default to current date/time and one hour later for end
        const startDateTime = `${year}-${month}-${day} ${hours}:${minutes}`;
        
        // End time is one hour later
        now.setHours(now.getHours() + 1);
        const endHours = String(now.getHours()).padStart(2, '0');
        const endMinutes = String(now.getMinutes()).padStart(2, '0');
        const endDateTime = `${year}-${month}-${day} ${endHours}:${endMinutes}`;
        
        // Set form values
        if (eventTitle) {
            eventTitle.value = '';
            console.log('Event title field found:', eventTitle);
        } else {
            console.warn('Event title field not found!');
        }
        
        // For Flatpickr inputs
        if (eventStart && eventStart._flatpickr) {
            eventStart._flatpickr.setDate(startDateTime);
        } else if (eventStart) {
            eventStart.value = startDateTime;
        }
        
        if (eventEnd && eventEnd._flatpickr) {
            eventEnd._flatpickr.setDate(endDateTime);
        } else if (eventEnd) {
            eventEnd.value = endDateTime;
        }
        
        if (eventLocation) eventLocation.selectedIndex = 0;
        
        // Show the modal
        if (eventModal) {
            eventModal.classList.add('active');
            console.log('Event modal activated');
            
            // Focus on the title field
            setTimeout(() => {
                if (eventTitle) {
                    eventTitle.focus();
                    console.log('Focus on event title');
                }
            }, 200);
        } else {
            console.warn('Event modal element not found!');
        }
    }

    // Function to force English locale for date inputs
    function setDateInputsToEnglishLocale() {
        // Force English locale for datetime-local inputs
        try {
            // This ensures the browser's datepicker displays in English
            document.documentElement.lang = 'en';
            
            // Try to influence browser locale
            if (typeof Intl !== 'undefined' && typeof Intl.DateTimeFormat !== 'undefined') {
                Intl.DateTimeFormat('en-US');
            }
            
            // For datetime-local inputs, add specific attributes
            const dateTimeInputs = document.querySelectorAll('input[type="datetime-local"]');
            dateTimeInputs.forEach(input => {
                input.setAttribute('lang', 'en');
                
                // Remove and re-add the input to force re-rendering with the new locale
                const parent = input.parentNode;
                const nextSibling = input.nextSibling;
                const oldValue = input.value;
                
                // Store any event listeners (simplified approach)
                const newInput = input.cloneNode(true);
                newInput.value = oldValue;
                
                // Remove old input
                parent.removeChild(input);
                
                // Add new input
                if (nextSibling) {
                    parent.insertBefore(newInput, nextSibling);
                } else {
                    parent.appendChild(newInput);
                }
                
                // Add a click handler to enforce locale
                newInput.addEventListener('click', function() {
                    // Try to influence browser's picker locale
                    if (navigator.language) {
                        Object.defineProperty(navigator, 'language', {
                            get: function() { return 'en-US'; }
                        });
                    }
                });
                
                console.log('Date input rebuilt with English locale');
            });
        } catch (e) {
            console.error('Error setting English locale for date inputs:', e);
        }
    }

    // Close appointment modal
    function closeAppointmentModal() {
        if (appointmentModal) {
            appointmentModal.classList.remove('active');
        }
    }

    // Handle appointment form submission
    function handleAppointmentSubmit(e) {
        e.preventDefault();
        
        if (!appointmentTitle || !appointmentStart || !appointmentEnd || !appointmentLocation) return;
        
        const title = appointmentTitle.value.trim();
        const start = appointmentStart.value;
        const end = appointmentEnd.value;
        const location = appointmentLocation.value;
        
        if (title && start && end && location) {
            // Extract date for storage key
            const startDate = start.split('T')[0]; // Extract YYYY-MM-DD part
            
            // Format time for display
            const startTime = start.split('T')[1].substring(0, 5); // Extract HH:MM
            const endTime = end.split('T')[1].substring(0, 5); // Extract HH:MM
            
            // Create appointment object with all details
            const appointment = {
                title,
                start,
                end,
                location,
                time: `${startTime}-${endTime}` // For display in the list
            };
            
            let appointments = getAppointmentsForDate(startDate);
            appointments.push(appointment);
            
            // Sort by start time
            appointments.sort((a, b) => a.start.localeCompare(b.start));
            
            saveAppointmentsForDate(startDate, appointments);
            
            // If we're viewing the date where the appointment was added, update the list
            if (selectedDate === startDate) {
                renderAppointmentsList(appointments);
            }
            
            closeAppointmentModal();
        }
    }

    // Initialize app
    function init() {
        // Set the language selector to the default value or saved preference
        const savedLanguage = localStorage.getItem('preferredLanguage');
        if (savedLanguage) {
            currentLanguage = savedLanguage;
            languageSelector.value = savedLanguage;
        }
        
        // Improve the "Add event" button appearance
        if (addEventBtn) {
            // Change text to "Add event"
            addEventBtn.innerHTML = '<i class="fas fa-plus"></i> Add event';
            // Apply theme-appropriate styling
            addEventBtn.classList.add('themed-button');
            // Use primary theme color
            addEventBtn.style.backgroundColor = 'var(--primary-color, #1E88E5)';
            addEventBtn.style.color = 'white';
            addEventBtn.style.border = 'none';
            addEventBtn.style.padding = '8px 12px';
            addEventBtn.style.borderRadius = '4px';
            addEventBtn.style.cursor = 'pointer';
            addEventBtn.style.fontWeight = '500';
            addEventBtn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            
            // Add hover effect
            addEventBtn.addEventListener('mouseenter', function() {
                this.style.backgroundColor = 'var(--primary-dark, #1565C0)';
                this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
            });
            
            addEventBtn.addEventListener('mouseleave', function() {
                this.style.backgroundColor = 'var(--primary-color, #1E88E5)';
                this.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            });
            
            console.log('Event button styled and renamed to "Add event"');
        }
        
        // Set the current user ID from a global variable
        try {
            // Try to get from the global variable that should be set in the HTML template
            if (typeof currentUserId !== 'undefined' && currentUserId) {
                current_user.id = currentUserId;
                console.log('Current user ID initialized from template:', current_user.id);
            } else {
                // If not available in the template, try to fetch it from the server
                fetchCurrentUser();
            }
        } catch (e) {
            console.error('Error initializing current user:', e);
            // Try to fetch from server as a fallback
            fetchCurrentUser();
        }

        fetchChats();
        setupEventListeners();
        adjustTextareaHeight();
        document.body.addEventListener('click', initAudioContext, { once: true });
        connectWebSocket(); // Establish WebSocket connection
        
        // Auto-create a new chat if there are no chats
        setTimeout(() => {
            if (chats.length === 0) {
                createNewChat();
            }
        }, 500);

        // Check if we're on mobile and show appropriate UI
        checkIfMobile();
        window.addEventListener('resize', checkIfMobile);

        // Inizializza il calendario
        setTimeout(initCalendar, 500);

        // Set up appointment modal event listeners
        if (appointmentForm) {
            appointmentForm.addEventListener('submit', handleAppointmentSubmit);
        }
        
        if (cancelAppointmentBtn) {
            cancelAppointmentBtn.addEventListener('click', closeAppointmentModal);
        }

        // Set up event modal event listeners
        if (eventForm) {
            eventForm.addEventListener('submit', handleEventSubmit);
            console.log('Event form submit listener added');
        } else {
            console.warn('Event form not found during initialization');
        }
        
        if (cancelEventBtn) {
            cancelEventBtn.addEventListener('click', closeEventModal);
            console.log('Cancel event button listener added');
        } else {
            console.warn('Cancel event button not found during initialization');
        }
        
        // Add a check for the modal elements
        console.log('Event modal elements check:');
        console.log('- eventModal:', !!eventModal);
        console.log('- eventTitle:', !!eventTitle);
        console.log('- eventForm:', !!eventForm);

        // Set document language to English to influence all datetime pickers
        document.documentElement.lang = 'en';
        
        // Override navigator language for date pickers (where possible)
        try {
            // This is a non-standard approach that might work in some browsers
            Object.defineProperty(navigator, 'language', {
                get: function() { return 'en-US'; }
            });
            
            if (navigator.languages) {
                Object.defineProperty(navigator, 'languages', {
                    get: function() { return ['en-US', 'en']; }
                });
            }
        } catch (e) {
            console.warn('Could not override navigator language:', e);
        }
    }

    // Function to fetch current user info if not provided in the template
    function fetchCurrentUser() {
        console.log('Fetching current user info from server...');
        fetch('/api/user/current')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch current user');
                }
                return response.json();
            })
            .then(data => {
                if (data && data.id) {
                    current_user.id = data.id;
                    console.log('Current user ID fetched from server:', current_user.id);
                }
            })
            .catch(error => {
                console.error('Error fetching current user:', error);
                // Use a fallback ID that won't match any events
                current_user.id = -1;
            });
    }

    function initAudioContext() {
        if (!audioContext) {
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                console.log("AudioContext initialized.");
            } catch (e) {
                console.error("Error initializing AudioContext:", e);
                alert("Audio playback might not work in this browser.");
            }
        }
    }
    
    // Establish WebSocket Connection
    function connectWebSocket() {
        socket = io();

        socket.on('connect', () => {
            console.log('WebSocket connected:', socket.id);
            // Initialize speech recognition after socket connection
            initSpeechRecognition();
        });

        socket.on('disconnect', (reason) => {
            console.log('WebSocket disconnected:', reason);
            isRecording = false;
            updateVoiceModeUI();
            alert('Lost connection to the server. Please refresh the page.');
        });

        socket.on('voice_started', (data) => {
            console.log('Server ready for audio:', data.message);
        });

        socket.on('processing_voice', (data) => {
            console.log('Server processing voice:', data.message);
            showProcessingIndicator(data.message || 'Processing voice...');
        });

        socket.on('transcript_result', (data) => {
            console.log('Transcript:', data.transcript);
        });

        socket.on('new_message', (message) => {
            console.log('New message received:', message);
            renderMessage(message);
            scrollToBottom();
        });

        socket.on('audio_response', (data) => {
            console.log(`Received audio response: ${data.audio.byteLength} bytes, type: ${data.mime_type}`);
            hideProcessingIndicator();
            const audioBlob = new Blob([data.audio], { type: data.mime_type });
            playAudioBlob(audioBlob);
        });

        socket.on('voice_interaction_complete', (data) => {
            console.log('Voice interaction complete:', data.message);
            hideProcessingIndicator();
        });

        socket.on('voice_error', (data) => {
            console.error('Voice Error:', data.error);
            hideProcessingIndicator();
            renderSystemMessage(`Voice Error: ${data.error}`, 'error');
            if (isRecording) {
                isRecording = false;
                updateVoiceModeUI();
            }
        });
    }

    // Initialize Web Speech API recognition
    function initSpeechRecognition() {
        // Check if browser supports speech recognition
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.error("Speech recognition not supported in this browser");
            alert("Il tuo browser non supporta il riconoscimento vocale. Prova con Chrome o Edge.");
            return;
        }

        // Create speech recognition object
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        speechRecognition = new SpeechRecognition();
        
        // Configure speech recognition
        speechRecognition.lang = 'it-IT'; // Set to Italian
        speechRecognition.continuous = false; // Stop after one utterance
        speechRecognition.interimResults = false; // We want only final results
        
        // Handle recognition results
        speechRecognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            console.log("Speech recognized:", transcript);
            
            // If we're in a voice interaction (button is active), send the transcript
            if (isRecording && currentChatId && socket && socket.connected) {
                // Instead of collecting audio chunks, send the transcript directly
                socket.emit('voice_transcript', { 
                    chat_id: currentChatId,
                    transcript: transcript,
                    language: currentLanguage
                });
                
                // Show processing indicator
                showProcessingIndicator("Elaborazione della risposta...");
            }
        };
        
        // Handle speech recognition errors
        speechRecognition.onerror = function(event) {
            console.error("Speech recognition error:", event.error);
            if (isRecording) {
                renderSystemMessage(`Errore di riconoscimento vocale: ${event.error}`, 'error');
                isRecording = false;
                updateVoiceModeUI();
            }
        };
        
        // When recognition stops (either by timeout or end of speech)
        speechRecognition.onend = function() {
            console.log("Speech recognition ended");
            isRecording = false;
            updateVoiceModeUI();
        };
        
        console.log("Speech recognition initialized");
    }

    // --- Notification logic ---
    let notifications = []; // This will be filled later via API or other logic

    // Show a browser notification if enabled in preferences
    function showSystemNotification(text) {
        // Check if notifications are enabled in preferences
        const savedPreferences = localStorage.getItem('notificationPreferences');
        if (savedPreferences) {
            const preferences = JSON.parse(savedPreferences);
            if (preferences.enableSystemNotifications && 'Notification' in window && Notification.permission === 'granted') {
                const notification = new Notification('BRIDGE Framework', {
                    body: text,
                    icon: '/static/img/favicon.ico'  // You may need to adjust this path
                });
                
                // Auto close based on preferences
                setTimeout(() => {
                    notification.close();
                }, preferences.displayTime * 1000);
                
                // Play sound if enabled
                if (preferences.enableSound) {
                    const audio = new Audio('/static/sounds/notification.mp3');  // You'll need to add this file
                    audio.play().catch(e => console.log('Could not play notification sound'));
                }
            }
        }
    }

    // Function to add a new notification
    function addNotification(text, type = 'default') {
        const newNotification = {
            text: text,
            type: type,
            read: false,
            timestamp: new Date().toISOString(),
            isHTML: text.includes('<') && text.includes('>') // Check if the text contains HTML tags
        };
        
        notifications.unshift(newNotification); // Add to beginning of array
        renderNotifications();
        
        // Show system notification if enabled (strip HTML for system notifications)
        const plainText = text.replace(/<[^>]*>?/gm, '');
        showSystemNotification(plainText);
        
        return newNotification;
    }

    function renderNotifications() {
        notificationList.innerHTML = '';
        if (!notifications.length) {
            notificationList.innerHTML = '<li class="notification-empty">No notifications</li>';
            notificationBadge.style.display = 'none';
        } else {
            notifications.forEach((notif, idx) => {
                const li = document.createElement('li');
                li.className = `notification-item notification-${notif.type}`;
                
                // Handle HTML content if needed
                if (notif.isHTML) {
                    li.innerHTML = notif.text;
                } else {
                    li.textContent = notif.text;
                }
                
                // Add timestamp if available
                if (notif.timestamp) {
                    const time = document.createElement('small');
                    time.className = 'notification-time';
                    time.textContent = formatTimestamp(notif.timestamp);
                    li.appendChild(time);
                }
                
                // Add buttons container
                const buttonsContainer = document.createElement('div');
                buttonsContainer.className = 'notification-actions';
                
                // Add dismiss button
                const dismissButton = document.createElement('button');
                dismissButton.className = 'notification-dismiss';
                dismissButton.innerHTML = '<i class="fas fa-times"></i>';
                dismissButton.title = 'Dismiss notification';
                dismissButton.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent notification click
                    notifications.splice(idx, 1);
                    renderNotifications();
                });
                
                buttonsContainer.appendChild(dismissButton);
                li.appendChild(buttonsContainer);
                
                // Add click handler for each notification
                li.addEventListener('click', (e) => {
                    if (e.target.tagName !== 'BUTTON' && !e.target.closest('button')) {
                        e.stopPropagation(); // Prevent menu from closing immediately
                        notif.read = true;
                        
                        // For event match notifications, handle differently
                        if (notif.type === 'event-match') {
                            // Keep notification but mark as read by applying a class
                            li.classList.add('notification-read');
                        } else {
                            // Remove standard notifications on click
                            notifications.splice(idx, 1);
                            renderNotifications();
                        }
                    }
                });
                
                notificationList.appendChild(li);
            });
            // Show badge with count
            notificationBadge.textContent = notifications.length;
            notificationBadge.style.display = 'inline-block';
        }
    }

    // Toggle notification menu
    if (notificationBell) {
        notificationBell.addEventListener('click', function(e) {
            e.stopPropagation();
            // Toggle menu visibility
            const isActive = notificationMenu.classList.contains('active');
            // Close all other dropdowns if needed (future-proof)
            document.querySelectorAll('.notification-menu.active').forEach(menu => {
                if (menu !== notificationMenu) menu.classList.remove('active');
            });
            
            if (!isActive) {
                notificationMenu.classList.add('active');
                renderNotifications();
            } else {
                notificationMenu.classList.remove('active');
            }
        });
    }
    
    // Notification settings button functionality
    const notificationSettingsBtn = document.getElementById('notification-settings');
    if (notificationSettingsBtn) {
        notificationSettingsBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent menu from closing
            
            // Create a settings menu with options
            const settingsOptions = document.createElement('div');
            settingsOptions.className = 'notification-settings-options';
            settingsOptions.innerHTML = `
                <div class="notification-settings-option" id="clear-all-notifications">
                    <i class="fas fa-trash-alt"></i> Clear all notifications
                </div>
                <div class="notification-settings-option" id="notification-preferences">
                    <i class="fas fa-cog"></i> Notification preferences
                </div>
            `;
            
            // Remove any existing settings menu
            const existingMenu = document.querySelector('.notification-settings-options');
            if (existingMenu) {
                existingMenu.remove();
            } else {
                // Position and append the settings menu
                notificationMenu.appendChild(settingsOptions);
                
                // Add click handlers for options
                document.getElementById('clear-all-notifications').addEventListener('click', function(e) {
                    e.stopPropagation();
                    // Clear all notifications
                    notifications = [];
                    renderNotifications();
                    settingsOptions.remove();
                });
                
                document.getElementById('notification-preferences').addEventListener('click', function(e) {
                    e.stopPropagation();
                    // Show notification preferences modal
                    openNotificationPreferencesModal();
                    settingsOptions.remove();
                });
            }
        });
    }
    // Hide notification menu when clicking outside (not on bell or menu)
    document.addEventListener('click', function(e) {
        if (notificationMenu && notificationMenu.classList.contains('active')) {
            if (
                !notificationMenu.contains(e.target) &&
                !notificationBell.contains(e.target)
            ) {
                notificationMenu.classList.remove('active');
            }
        }
    });

    // --- Existing code continues ---
    // Initialize app
    function init() {
        // Set the language selector to the default value or saved preference
        const savedLanguage = localStorage.getItem('preferredLanguage');
        if (savedLanguage) {
            currentLanguage = savedLanguage;
            languageSelector.value = savedLanguage;
        }
        
        // Improve the "Add event" button appearance
        if (addEventBtn) {
            // Change text to "Add event"
            addEventBtn.innerHTML = '<i class="fas fa-plus"></i> Add event';
            // Apply theme-appropriate styling
            addEventBtn.classList.add('themed-button');
            // Use primary theme color
            addEventBtn.style.backgroundColor = 'var(--primary-color, #1E88E5)';
            addEventBtn.style.color = 'white';
            addEventBtn.style.border = 'none';
            addEventBtn.style.padding = '8px 12px';
            addEventBtn.style.borderRadius = '4px';
            addEventBtn.style.cursor = 'pointer';
            addEventBtn.style.fontWeight = '500';
            addEventBtn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            
            // Add hover effect
            addEventBtn.addEventListener('mouseenter', function() {
                this.style.backgroundColor = 'var(--primary-dark, #1565C0)';
                this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
            });
            
            addEventBtn.addEventListener('mouseleave', function() {
                this.style.backgroundColor = 'var(--primary-color, #1E88E5)';
                this.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            });
            
            console.log('Event button styled and renamed to "Add event"');
        }
        
        // Set the current user ID from a global variable
        try {
            // Try to get from the global variable that should be set in the HTML template
            if (typeof currentUserId !== 'undefined' && currentUserId) {
                current_user.id = currentUserId;
                console.log('Current user ID initialized from template:', current_user.id);
            } else {
                // If not available in the template, try to fetch it from the server
                fetchCurrentUser();
            }
        } catch (e) {
            console.error('Error initializing current user:', e);
            // Try to fetch from server as a fallback
            fetchCurrentUser();
        }

        fetchChats();
        setupEventListeners();
        adjustTextareaHeight();
        document.body.addEventListener('click', initAudioContext, { once: true });
        connectWebSocket(); // Establish WebSocket connection
        
        // Auto-create a new chat if there are no chats
        setTimeout(() => {
            if (chats.length === 0) {
                createNewChat();
            }
        }, 500);

        // Check if we're on mobile and show appropriate UI
        checkIfMobile();
        window.addEventListener('resize', checkIfMobile);

        // Inizializza il calendario
        setTimeout(initCalendar, 500);

        // Set up appointment modal event listeners
        if (appointmentForm) {
            appointmentForm.addEventListener('submit', handleAppointmentSubmit);
        }
        
        if (cancelAppointmentBtn) {
            cancelAppointmentBtn.addEventListener('click', closeAppointmentModal);
        }

        // Set up event modal event listeners
        if (eventForm) {
            eventForm.addEventListener('submit', handleEventSubmit);
            console.log('Event form submit listener added');
        } else {
            console.warn('Event form not found during initialization');
        }
        
        if (cancelEventBtn) {
            cancelEventBtn.addEventListener('click', closeEventModal);
            console.log('Cancel event button listener added');
        } else {
            console.warn('Cancel event button not found during initialization');
        }
        
        // Add a check for the modal elements
        console.log('Event modal elements check:');
        console.log('- eventModal:', !!eventModal);
        console.log('- eventTitle:', !!eventTitle);
        console.log('- eventForm:', !!eventForm);

        // Set document language to English to influence all datetime pickers
        document.documentElement.lang = 'en';
        
        // Override navigator language for date pickers (where possible)
        try {
            // This is a non-standard approach that might work in some browsers
            Object.defineProperty(navigator, 'language', {
                get: function() { return 'en-US'; }
            });
            
            if (navigator.languages) {
                Object.defineProperty(navigator, 'languages', {
                    get: function() { return ['en-US', 'en']; }
                });
            }
        } catch (e) {
            console.warn('Could not override navigator language:', e);
        }
    }

    // Function to fetch current user info if not provided in the template
    function fetchCurrentUser() {
        console.log('Fetching current user info from server...');
        fetch('/api/user/current')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch current user');
                }
                return response.json();
            })
            .then(data => {
                if (data && data.id) {
                    current_user.id = data.id;
                    console.log('Current user ID fetched from server:', current_user.id);
                }
            })
            .catch(error => {
                console.error('Error fetching current user:', error);
                // Use a fallback ID that won't match any events
                current_user.id = -1;
            });
    }

    function initAudioContext() {
        if (!audioContext) {
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                console.log("AudioContext initialized.");
            } catch (e) {
                console.error("Error initializing AudioContext:", e);
                alert("Audio playback might not work in this browser.");
            }
        }
    }
    
    // Establish WebSocket Connection
    function connectWebSocket() {
        socket = io();

        socket.on('connect', () => {
            console.log('WebSocket connected:', socket.id);
            // Initialize speech recognition after socket connection
            initSpeechRecognition();
        });

        socket.on('disconnect', (reason) => {
            console.log('WebSocket disconnected:', reason);
            isRecording = false;
            updateVoiceModeUI();
            alert('Lost connection to the server. Please refresh the page.');
        });

        socket.on('voice_started', (data) => {
            console.log('Server ready for audio:', data.message);
        });

        socket.on('processing_voice', (data) => {
            console.log('Server processing voice:', data.message);
            showProcessingIndicator(data.message || 'Processing voice...');
        });

        socket.on('transcript_result', (data) => {
            console.log('Transcript:', data.transcript);
        });

        socket.on('new_message', (message) => {
            console.log('New message received:', message);
            renderMessage(message);
            scrollToBottom();
        });

        socket.on('audio_response', (data) => {
            console.log(`Received audio response: ${data.audio.byteLength} bytes, type: ${data.mime_type}`);
            hideProcessingIndicator();
            const audioBlob = new Blob([data.audio], { type: data.mime_type });
            playAudioBlob(audioBlob);
        });

        socket.on('voice_interaction_complete', (data) => {
            console.log('Voice interaction complete:', data.message);
            hideProcessingIndicator();
        });

        socket.on('voice_error', (data) => {
            console.error('Voice Error:', data.error);
            hideProcessingIndicator();
            renderSystemMessage(`Voice Error: ${data.error}`, 'error');
            if (isRecording) {
                isRecording = false;
                updateVoiceModeUI();
            }
        });
    }

    // Initialize Web Speech API recognition
    function initSpeechRecognition() {
        // Check if browser supports speech recognition
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.error("Speech recognition not supported in this browser");
            alert("Il tuo browser non supporta il riconoscimento vocale. Prova con Chrome o Edge.");
            return;
        }

        // Create speech recognition object
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        speechRecognition = new SpeechRecognition();
        
        // Configure speech recognition
        speechRecognition.lang = 'it-IT'; // Set to Italian
        speechRecognition.continuous = false; // Stop after one utterance
        speechRecognition.interimResults = false; // We want only final results
        
        // Handle recognition results
        speechRecognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            console.log("Speech recognized:", transcript);
            
            // If we're in a voice interaction (button is active), send the transcript
            if (isRecording && currentChatId && socket && socket.connected) {
                // Instead of collecting audio chunks, send the transcript directly
                socket.emit('voice_transcript', { 
                    chat_id: currentChatId,
                    transcript: transcript,
                    language: currentLanguage
                });
                
                // Show processing indicator
                showProcessingIndicator("Elaborazione della risposta...");
            }
        };
        
        // Handle speech recognition errors
        speechRecognition.onerror = function(event) {
            console.error("Speech recognition error:", event.error);
            if (isRecording) {
                renderSystemMessage(`Errore di riconoscimento vocale: ${event.error}`, 'error');
                isRecording = false;
                updateVoiceModeUI();
            }
        };
        
        // When recognition stops (either by timeout or end of speech)
        speechRecognition.onend = function() {
            console.log("Speech recognition ended");
            isRecording = false;
            updateVoiceModeUI();
        };
        
        console.log("Speech recognition initialized");
    }

    // Function to format date in a more readable way
    function formatDateNice(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString(undefined, { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
        });
    }
    
    // Function to check for matching events in same date/city as current user's events
    function checkMatchingEvents() {
        console.log('Checking for matching events and generating suggestions...');
        // Show loading in notification list
        const tempNotification = addNotification('Checking for matching events and generating suggestions...', 'info');
        
        fetch('/api/events/matches/suggestions')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }
                return response.json();
            })
            .then(suggestions => {
                // Remove loading notification
                notifications = notifications.filter(n => n !== tempNotification);
                
                if (!suggestions || suggestions.length === 0) {
                    addNotification('No matching events found with other users.', 'info');
                    return;
                }
                
                console.log(`Found ${suggestions.length} event matches with LLM suggestions`);
                
                // Add notifications for each suggestion
                suggestions.forEach(suggestion => {
                    if (suggestion.error) {
                        addNotification(`Error generating suggestion for ${suggestion.location} on ${suggestion.date}: ${suggestion.error}`, 'error');
                        return;
                    }
                    
                    // Get event details
                    const location = suggestion.location;
                    const formattedDate = suggestion.formatted_date;
                    const userEvents = suggestion.user_events || [];
                    const matchingEvents = suggestion.matching_events || [];
                    const usersInvolved = suggestion.users_involved || [];
                    const llmSuggestion = suggestion.suggestion;
                    
                    // Create a detailed message with the LLM suggestion prominently displayed
                    let message = `<div class="llm-suggestion">
                        <div class="llm-suggestion-header">
                            <i class="fas fa-lightbulb suggestion-icon"></i>
                            <strong>Meetup Opportunity in ${location} on ${formattedDate}</strong>
                        </div>
                        <div class="llm-suggestion-content">
                            "${llmSuggestion}"
                        </div>
                        <div class="llm-suggestion-details">
                            <div class="contact-info-section">
                                <h4>Contact Information</h4>
                                <ul class="contact-list">`;
                    
                    // Add matching events with user emails
                    const uniqueUsers = {};
                    matchingEvents.forEach(event => {
                        if (!uniqueUsers[event.username] && event.email) {
                            uniqueUsers[event.username] = event.email;
                            message += `<li><i class="fas fa-envelope"></i> <strong>${event.username}</strong>: <a href="mailto:${event.email}">${event.email}</a></li>`;
                        }
                    });
                    
                    message += `</ul>
                            </div>
                            <div class="event-mini-summary">
                                <p><i class="fas fa-calendar"></i> You have <strong>${userEvents.length}</strong> event(s) and <strong>${matchingEvents.length}</strong> matching event(s) in ${location}.</p>
                            </div>
                        </div>
                    </div>`;
                    
                    const notif = addNotification(message, 'llm-suggestion');
                });
                
                // Add event listeners for toggles after notifications are rendered
                setTimeout(() => {
                    document.querySelectorAll('.details-toggle').forEach(toggle => {
                        toggle.addEventListener('click', function() {
                            const content = this.nextElementSibling;
                            if (content.style.display === 'none') {
                                content.style.display = 'block';
                                this.textContent = 'Hide event details';
                            } else {
                                content.style.display = 'none';
                                this.textContent = 'Show event details';
                            }
                        });
                    });
                }, 100);
            })
            .catch(error => {
                console.error('Error checking for matching events:', error);
                // Remove loading notification
                notifications = notifications.filter(n => n !== tempNotification);
                addNotification('Error checking for matching events. Please try again.', 'error');
            });
    }
    
    // Set up all event listeners
    function setupEventListeners() {
        newChatBtn.addEventListener('click', function() {
            createNewChat();
            if (window.innerWidth <= 768) {
                closeMobileSidebar();
            }
        });
        
        messageForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (messageInput.value.trim() !== '' && !isProcessing) {
                sendMessage(messageInput.value.trim());
            }
        });
        
        messageInput.addEventListener('input', adjustTextareaHeight);
        
        let lastEnterPress = 0;
        const DOUBLE_ENTER_THRESHOLD = 500;
        
        messageInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                const currentTime = new Date().getTime();
                
                if (currentTime - lastEnterPress < DOUBLE_ENTER_THRESHOLD) {
                    e.preventDefault();
                    if (messageInput.value.trim() !== '' && !isProcessing) {
                        sendMessage(messageInput.value.trim());
                    }
                }
                
                lastEnterPress = currentTime;
            }
        });
        
        renameChatBtn.addEventListener('click', openRenameModal);
        renameForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const newTitle = newTitleInput.value.trim();
            if (newTitle !== '') {
                renameChat(currentChatId, newTitle);
                closeRenameModal();
            }
        });
        cancelRenameBtn.addEventListener('click', closeRenameModal);
        
        deleteChatBtn.addEventListener('click', openConfirmModal);
        confirmDeleteBtn.addEventListener('click', function() {
            deleteChat(currentChatId);
            closeConfirmModal();
        });
        cancelDeleteBtn.addEventListener('click', closeConfirmModal);

        voiceBtn.addEventListener('click', toggleRecording);

        // Add event listener for language selector
        languageSelector.addEventListener('change', function() {
            currentLanguage = languageSelector.value;
            localStorage.setItem('preferredLanguage', currentLanguage);
            console.log('Language changed to:', currentLanguage);
            
            // Update speech recognition language for voice interactions
            if (speechRecognition) {
                switch(currentLanguage) {
                    case 'en': speechRecognition.lang = 'en-US'; break;
                    case 'it': speechRecognition.lang = 'it-IT'; break;
                    case 'fr': speechRecognition.lang = 'fr-FR'; break;
                    case 'es': speechRecognition.lang = 'es-ES'; break;
                    case 'de': speechRecognition.lang = 'de-DE'; break;
                    default: speechRecognition.lang = 'en-US';
                }
                console.log('Speech recognition language set to:', speechRecognition.lang);
            }
            
            // Notifica all'utente che la lingua è cambiata 
            const languageNames = {
                'en': 'English',
                'it': 'Italiano',
                'fr': 'Français',
                'es': 'Español',
                'de': 'Deutsch'
            };
            
            // Mostra un messaggio di sistema che indica il cambio lingua
            renderSystemMessage(`Language changed to: ${languageNames[currentLanguage]}`, 'info');
            
            // Se c'è una chat attiva, aggiungiamo una nota di sistema invisibile per segnalare al modello il cambio di lingua
            if (currentChatId) {
                // Invia una notifica al server per informare che la lingua è cambiata
                fetch(`/api/chats/${currentChatId}/set-language`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        language: currentLanguage
                    }),
                })
                .then(response => response.json())
                .then(data => {
                    console.log('Language preference updated on server:', data);
                })
                .catch(error => {
                    console.error('Error updating language preference:', error);
                });
            }
        });

        // Enhanced sidebar toggle for desktop
        toggleSidebarBtn.addEventListener('click', function(e) {
            // Ensure this only runs on desktop
            if (window.innerWidth > 768) {
                console.log('Desktop sidebar toggle');
                e.preventDefault();
                e.stopPropagation();
                
                sidebar.classList.toggle('sidebar-collapsed');
                
                const icon = toggleSidebarBtn.querySelector('i');
                if (sidebar.classList.contains('sidebar-collapsed')) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-expand');
                } else {
                    icon.classList.remove('fa-expand');
                    icon.classList.add('fa-bars');
                }
                
                return false;
            }
        });

        // Close sidebar when clicking outside on mobile
        if (window.innerWidth <= 768) {
            document.addEventListener('click', function(e) {
                if (sidebar.classList.contains('active') && 
                    !sidebar.contains(e.target) && 
                    e.target !== toggleSidebarBtn && 
                    !toggleSidebarBtn.contains(e.target)) {
                    sidebar.classList.remove('active');
                    toggleSidebarBtn.classList.remove('active');
                    const icon = toggleSidebarBtn.querySelector('i');
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            });
        }
        
        // Auto-close sidebar after selecting a chat on mobile
        chatList.addEventListener('click', function(e) {
            if (window.innerWidth <= 768 && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
                toggleSidebarBtn.classList.remove('active');
                const icon = toggleSidebarBtn.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
        
        // Add stop audio playback button functionality
        let stopAudioBtn = document.createElement('button');
        stopAudioBtn.id = 'stop-audio-btn';
        stopAudioBtn.className = 'action-btn';
        stopAudioBtn.title = 'Stop Audio';
        stopAudioBtn.innerHTML = '<i class="fas fa-stop"></i>';
        stopAudioBtn.style.display = 'none';
        stopAudioBtn.addEventListener('click', function() {
            if (audioSource) {
                try {
                    if (audioSource.stop) audioSource.stop();
                } catch (e) { }
                audioSource = null;
                stopAudioBtn.style.display = 'none';
            }
        });
        document.querySelector('#message-form').appendChild(stopAudioBtn);

        // Mobile sidebar toggle
        mobileMenuToggle.addEventListener('click', toggleMobileSidebar);
        sidebarOverlay.addEventListener('click', toggleMobileSidebar);

        // Also close mobile sidebar when selecting a chat
        document.querySelectorAll('.chat-item').forEach(item => {
            item.addEventListener('click', closeMobileSidebar);
        });
        
        // Add event listener for check events button
        const checkEventsBtn = document.getElementById('check-events-btn');
        if (checkEventsBtn) {
            checkEventsBtn.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent menu from closing
                checkMatchingEvents();
            });
        }
        
        // Notification preferences modal event listeners
        const notificationPreferencesForm = document.getElementById('notification-preferences-form');
        const cancelNotificationPreferencesBtn = document.getElementById('cancel-notification-preferences-btn');
        
        if (notificationPreferencesForm) {
            notificationPreferencesForm.addEventListener('submit', saveNotificationPreferences);
        }
        
        if (cancelNotificationPreferencesBtn) {
            cancelNotificationPreferencesBtn.addEventListener('click', closeNotificationPreferencesModal);
        }
        
        // Request notification permission if it's not set yet
        if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            // We'll request this when the user enables system notifications in preferences
            document.getElementById('enable-system-notifications').addEventListener('change', function(e) {
                if (e.target.checked && Notification.permission !== 'granted') {
                    Notification.requestPermission();
                }
            });
        }
    }

    // Toggle Recording (Modified for Web Speech API)
    async function toggleRecording() {
        if (!socket || !socket.connected) {
            alert('Non connesso al server. Attendere o ricaricare la pagina.');
            return;
        }
        
        initAudioContext(); // Ensure AudioContext is ready for playback

        if (isRecording) {
            // --- Stop Recording ---
            console.log('Stopping speech recognition...');
            if (speechRecognition) {
                try {
                    speechRecognition.stop();
                } catch (e) {
                    console.error("Error stopping speech recognition:", e);
                }
            }
            isRecording = false;
            updateVoiceModeUI();
        } else {
            // --- Start Recording ---
            if (!currentChatId) {
                alert('Seleziona o crea una nuova chat prima.');
                return;
            }
            if (isProcessing) {
                console.warn('Impossibile avviare la registrazione: elaborazione di una richiesta precedente in corso.');
                return;
            }
            
            // Ensure speech recognition is initialized
            if (!speechRecognition) {
                initSpeechRecognition();
                if (!speechRecognition) {
                    alert("Impossibile avviare il riconoscimento vocale.");
                    return;
                }
            }
            
            // Signal to server that we're starting a voice interaction
            socket.emit('start_voice_interaction', { chat_id: currentChatId });
            
            try {
                // Start the speech recognition
                speechRecognition.start();
                isRecording = true;
                updateVoiceModeUI();
                console.log('Speech recognition started');
            } catch (err) {
                console.error('Error starting speech recognition:', err);
                alert(`Impossibile avviare il riconoscimento vocale: ${err.message}`);
                isRecording = false;
                updateVoiceModeUI();
            }
        }
    }

    // Update UI based on recording state
    function updateVoiceModeUI() {
        if (isRecording) {
            voiceBtn.classList.add('recording');
            voiceBtn.innerHTML = '<i class="fas fa-stop"></i>';
        } else {
            voiceBtn.classList.remove('recording');
            voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        }
    }

    // Function to play received audio blob - now with stop button functionality
    function playAudioBlob(blob) {
        if (!audioContext) {
            console.error("AudioContext not available to play audio.");
            initAudioContext();
            if (!audioContext) {
                 alert("Could not initialize audio playback. Please interact with the page first.");
                 return;
            }
        }
        const url = URL.createObjectURL(blob);

        if (audioSource) {
            try {
                if (audioSource.stop) audioSource.stop();
            } catch (e) { }
            audioSource = null;
        }

        const audio = new Audio(url);
        const stopAudioBtn = document.getElementById('stop-audio-btn');
        
        audio.onplay = () => {
            stopAudioBtn.style.display = 'flex';
        };
        
        audio.onended = () => {
            console.log("Audio playback finished.");
            URL.revokeObjectURL(url);
            stopAudioBtn.style.display = 'none';
        };
        
        audio.onerror = (e) => {
            console.error("Error playing audio:", e);
            URL.revokeObjectURL(url);
            renderSystemMessage("Error playing audio response.", "error");
            stopAudioBtn.style.display = 'none';
        };
        
        audio.play().catch(e => {
             console.error("Audio play failed:", e);
             renderSystemMessage(`Audio playback failed: ${e.message}`, "error");
             stopAudioBtn.style.display = 'none';
        });
        
        audioSource = audio; // Store reference for stop functionality
    }

    // Helper to show a processing indicator
    function showProcessingIndicator(text = "Processing...") {
        let indicator = document.getElementById('processing-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'processing-indicator';
            indicator.className = 'message system processing';
            indicator.innerHTML = `
                <div class="message-content">
                     <div class="typing-indicator" style="justify-content: center;">
                        <span></span><span></span><span></span>
                    </div>
                    <p style="text-align: center; margin-top: 5px;">${text}</p>
                </div>`;
            chatMessages.appendChild(indicator);
        } else {
            indicator.querySelector('p').textContent = text;
            indicator.style.display = 'flex';
        }
        scrollToBottom();
    }

    // Helper to hide the processing indicator
    function hideProcessingIndicator() {
        const indicator = document.getElementById('processing-indicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }

    // Render a system message
    function renderSystemMessage(content, type = 'info') {
        const messageElement = document.createElement('div');
        messageElement.className = `message system ${type}`;
        messageElement.innerHTML = `
            <div class="message-content">
                <p>${escapeHtml(content)}</p>
            </div>
        `;
        chatMessages.appendChild(messageElement);
        scrollToBottom();
    }

    // Fetch all chats
    function fetchChats() {
        fetch('/api/chats')
            .then(response => response.json())
            .then(data => {
                chats = data;
                renderChatList();
            })
            .catch(error => console.error('Error fetching chats:', error));
    }
    
    // Render the chat list in the sidebar
    function renderChatList() {
        chatList.innerHTML = '';
        
        if (chats.length === 0) {
            chatList.innerHTML = '<div class="empty-chat-list">No chats yet</div>';
            return;
        }
        
        chats.forEach(chat => {
            const chatElement = document.createElement('div');
            chatElement.className = `chat-item ${chat.id === currentChatId ? 'active' : ''}`;
            chatElement.innerHTML = `
                <i class="fas fa-comment-dots"></i>
                <span>${chat.title}</span>
            `;
            chatElement.addEventListener('click', () => selectChat(chat.id));
            chatList.appendChild(chatElement);
        });
    }
    
    // Create a new chat
    function createNewChat() {
        fetch('/api/chats', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: 'New Chat'
            }),
        })
        .then(response => response.json())
        .then(chat => {
            chats.push(chat);
            renderChatList();
            selectChat(chat.id);
        })
        .catch(error => console.error('Error creating chat:', error));
    }
    
    // Select a chat
    function selectChat(chatId) {
        currentChatId = chatId;
        
        fetch(`/api/chats/${chatId}`)
            .then(response => response.json())
            .then(chat => {
                renderChatList();
                currentChatTitle.textContent = chat.title;
                welcomeContainer.style.display = 'none';
                chatMessages.style.display = 'flex';
                messageInput.disabled = false;
                sendBtn.disabled = false;
                renameChatBtn.disabled = false;
                deleteChatBtn.disabled = false;

                // Explicitly enable the message input and send button
                messageInput.disabled = false;
                sendBtn.disabled = false;

                // Focus on the message input to allow immediate typing
                messageInput.focus();
                
                renderMessages(chat.messages);
                scrollToBottom();
            })
            .catch(error => console.error('Error fetching chat details:', error));
    }
    
    // Render messages for the selected chat
    function renderMessages(messages) {
        chatMessages.innerHTML = '';
        
        if (messages.length === 0) {
            chatMessages.innerHTML = `
                <div class="empty-chat-message">
                    <p>This is the start of your conversation with Gemma 3:1B.</p>
                </div>
            `;
            return;
        }
        
        messages.forEach(message => {
            renderMessage(message);
        });
    }
    
    // Render a single message
    function renderMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.role}`;
        
        const formattedTime = formatTimestamp(message.timestamp);
        
        messageElement.innerHTML = `
            <div class="message-avatar">
                <i class="${message.role === 'user' ? 'fas fa-user' : 'fas fa-robot'}"></i>
            </div>
            <div class="message-content">
                ${formatMessageContent(message.content)}
                <div class="message-timestamp">${formattedTime}</div>
            </div>
        `;
        
        chatMessages.appendChild(messageElement);
    }
    
    // Format message content (handle markdown, code, etc.)
    function formatMessageContent(content) {
        content = content.replace(/```(\w+)?\n([\s\S]*?)```/g, function(match, language, code) {
            const langClass = language ? ` class="language-${language}"` : '';
            return `<pre><code${langClass}>${escapeHtml(code)}</code></pre>`;
        });
        
        content = content.replace(/`([^`]+)`/g, function(match, code) {
            return `<code>${escapeHtml(code)}</code>`;
        });
        
        content = content.replace(/^### (.*$)/gm, '<h3>$1</h3>');
        content = content.replace(/^## (.*$)/gm, '<h2>$1</h2>');
        content = content.replace(/^# (.*$)/gm, '<h1>$1</h1>');
        
        content = content.replace(/^\s*\n\* (.*)/gm, '<ul>\n<li>$1</li>');
        content = content.replace(/^(\* )(.*)/gm, '<li>$2</li>');
        content = content.replace(/^\s*\n\d+\. (.*)/gm, '<ol>\n<li>$1</li>');
        content = content.replace(/^(\d+\. )(.*)/gm, '<li>$2</li>');
        
        content = content.replace(/^\> (.*$)/gm, '<blockquote>$1</blockquote>');
        
        content = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function(match, text, url) {
            return `<a href="${escapeHtml(url)}" target="_blank">${escapeHtml(text)}</a>`;
        });
        
        content = content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        content = content.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        content = content.replace(/\_\_([^_]+)\_\_/g, '<strong>$1</strong>');
        content = content.replace(/\_([^_]+)\_/g, '<em>$1</em>');
        
        const paragraphs = content.split('\n\n');
        let processedContent = '';
        for (let i = 0; i < paragraphs.length; i++) {
            if (paragraphs[i].trim() !== '' && 
                !paragraphs[i].startsWith('<h') && 
                !paragraphs[i].startsWith('<ul') && 
                !paragraphs[i].startsWith('<ol') && 
                !paragraphs[i].startsWith('<blockquote') && 
                !paragraphs[i].startsWith('<pre>')) {
                processedContent += `<p>${paragraphs[i]}</p>`;
            } else {
                processedContent += paragraphs[i];
            }
        }
        
        processedContent = processedContent.replace(/<p>(.*)\n(.*)<\/p>/g, '<p>$1<br>$2</p>');
        
        return processedContent;
    }
    
    // Escape HTML to prevent XSS
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    // Format timestamp
    function formatTimestamp(timestamp) {
        if (!timestamp) return '';
        
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Send a message
    function sendMessage(content) {
        if (isRecording) {
            alert("Please stop voice recording before sending a text message.");
            return;
        }
        if (!currentChatId) return;
        if (isProcessing) {
            console.warn("Cannot send text message while processing voice.");
            return;
        }
        
        isProcessing = true;
        messageInput.disabled = true;
        sendBtn.disabled = true;
        
        messageInput.value = '';
        adjustTextareaHeight();
        
        const tempUserMsg = {
            id: 'temp-' + Date.now(),
            role: 'user',
            content: content,
            timestamp: new Date().toISOString()
        };
        renderMessage(tempUserMsg);
        scrollToBottom();
        
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'message assistant typing';
        typingIndicator.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        chatMessages.appendChild(typingIndicator);
        scrollToBottom();
        
        fetch(`/api/chats/${currentChatId}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: content,
                language: currentLanguage
            }),
        })
        .then(response => response.json())
        .then(data => {
            typingIndicator.remove();
            
            const chat = chats.find(c => c.id === currentChatId);
            if (chat && data.chat_title) {
                chat.title = data.chat_title;
                currentChatTitle.textContent = chat.title;
                renderChatList();
            }
            
            renderMessage(data.ai_message);
            scrollToBottom();
        })
        .catch(error => {
            console.error('Error sending message:', error);
            typingIndicator.remove();
            
            const errorMsg = document.createElement('div');
            errorMsg.className = 'message system error';
            errorMsg.innerHTML = `
                <div class="message-content">
                    <p>Error: Failed to send message. Please try again.</p>
                </div>
            `;
            chatMessages.appendChild(errorMsg);
            scrollToBottom();
        })
        .finally(() => {
            isProcessing = false;
            messageInput.disabled = false;
            sendBtn.disabled = false;
            messageInput.focus();
        });
    }
    
    // Delete a chat
    function deleteChat(chatId) {
        fetch(`/api/chats/${chatId}`, {
            method: 'DELETE',
        })
        .then(response => response.json())
        .then(() => {
            chats = chats.filter(chat => chat.id !== chatId);
            currentChatId = null;
            
            renderChatList();
            resetChatView();
        })
        .catch(error => console.error('Error deleting chat:', error));
    }
    
    // Rename a chat
    function renameChat(chatId, newTitle) {
        fetch(`/api/chats/${chatId}/rename`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: newTitle
            }),
        })
        .then(response => response.json())
        .then(updatedChat => {
            const chat = chats.find(c => c.id === chatId);
            if (chat) {
                chat.title = updatedChat.title;
                currentChatTitle.textContent = chat.title;
                renderChatList();
            }
        })
        .catch(error => console.error('Error renaming chat:', error));
    }
    
    // Reset chat view
    function resetChatView() {
        currentChatTitle.textContent = 'Select or create a chat';
        welcomeContainer.style.display = 'flex';
        chatMessages.style.display = 'none';
        chatMessages.innerHTML = '';
        messageInput.disabled = true;
        sendBtn.disabled = true;
        renameChatBtn.disabled = true;
        deleteChatBtn.disabled = true;
    }
    
    // Scroll to bottom of messages
    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Adjust textarea height based on content
    function adjustTextareaHeight() {
        messageInput.style.height = 'auto';
        messageInput.style.height = (messageInput.scrollHeight) + 'px';
    }
    
    // Modal functions
    function openRenameModal() {
        const chat = chats.find(c => c.id === currentChatId);
        newTitleInput.value = chat ? chat.title : '';
        renameModal.classList.add('active');
        setTimeout(() => newTitleInput.focus(), 100);
    }
    
    function closeRenameModal() {
        renameModal.classList.remove('active');
    }
    
    function openConfirmModal() {
        confirmModal.classList.add('active');
    }
    
    function closeConfirmModal() {
        confirmModal.classList.remove('active');
    }
    
    // Notification preferences modal functions
    function openNotificationPreferencesModal() {
        const notificationPreferencesModal = document.getElementById('notification-preferences-modal');
        notificationPreferencesModal.classList.add('active');
        
        // Load saved preferences if they exist
        const savedPreferences = localStorage.getItem('notificationPreferences');
        if (savedPreferences) {
            const preferences = JSON.parse(savedPreferences);
            document.getElementById('enable-all-notifications').checked = preferences.enableAll;
            document.getElementById('enable-sound-notifications').checked = preferences.enableSound;
            document.getElementById('enable-system-notifications').checked = preferences.enableSystemNotifications;
            document.getElementById('notification-display-time').value = preferences.displayTime;
        }
    }
    
    function closeNotificationPreferencesModal() {
        const notificationPreferencesModal = document.getElementById('notification-preferences-modal');
        notificationPreferencesModal.classList.remove('active');
    }
    
    function saveNotificationPreferences(e) {
        e.preventDefault();
        
        // Get values from form
        const enableAll = document.getElementById('enable-all-notifications').checked;
        const enableSound = document.getElementById('enable-sound-notifications').checked;
        const enableSystemNotifications = document.getElementById('enable-system-notifications').checked;
        const displayTime = document.getElementById('notification-display-time').value;
        
        // Save to localStorage
        const preferences = {
            enableAll,
            enableSound,
            enableSystemNotifications,
            displayTime
        };
        localStorage.setItem('notificationPreferences', JSON.stringify(preferences));
        
        // If system notifications are enabled, request permission
        if (enableSystemNotifications && 'Notification' in window) {
            Notification.requestPermission();
        }
        
        // Close the modal
        closeNotificationPreferencesModal();
        
        // Show a confirmation
        renderSystemMessage("Notification preferences saved successfully.", "success");
    }

    // Check if we're on a mobile device and adjust the UI accordingly
    function checkIfMobile() {
        if (window.innerWidth <= 768) {
            console.log('Mobile view detected: ' + window.innerWidth);
            mobileMenuToggle.style.display = 'flex';
            
            // Reset desktop-specific classes when in mobile mode
            sidebar.classList.remove('sidebar-collapsed');
            
            // Assicuriamoci che la sidebar sia chiusa all'inizio su mobile
            sidebar.style.left = '-280px';  // Imposta direttamente lo stile
            
            // Hint visibile per l'utente
            const hasSeenMobileHint = localStorage.getItem('hasSeenMobileHint');
            if (!hasSeenMobileHint) {
                setTimeout(() => {
                    renderSystemMessage("Tap the button in the top-left corner to access your chats.", "info");
                    localStorage.setItem('hasSeenMobileHint', 'true');
                }, 1000);
            }
            
            // Pulizia e riassegnazione degli event listener per evitare duplicati
            mobileMenuToggle.removeEventListener('click', toggleMobileSidebar);
            mobileMenuToggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Mobile menu button clicked');
                toggleMobileSidebar();
                return false;
            });
            
            sidebarOverlay.removeEventListener('click', closeMobileSidebar);
            sidebarOverlay.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Overlay clicked');
                closeMobileSidebar();
                return false;
            });
        } else {
            console.log('Desktop view detected: ' + window.innerWidth);
            mobileMenuToggle.style.display = 'none';
            
            // Clear mobile-specific styles and classes
            sidebar.style.left = ''; // Rimuovi lo stile diretto su desktop
            sidebar.classList.remove('active');
            
            // Reset to desktop default state
            if (sidebar.classList.contains('sidebar-collapsed')) {
                // Keep collapsed state if it was previously set on desktop
                const icon = toggleSidebarBtn.querySelector('i');
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-expand');
            } else {
                // Reset to default expanded state
                const icon = toggleSidebarBtn.querySelector('i');
                icon.classList.remove('fa-expand');
                icon.classList.add('fa-bars');
            }
            
            // Remove mobile overlay
            sidebarOverlay.classList.remove('active');
            document.body.classList.remove('sidebar-open');
        }
    }

    // Toggle mobile sidebar - versione migliorata
    function toggleMobileSidebar() {
        // Debug visibile
        console.log('toggleMobileSidebar called');
        
        // Manipolazione diretta dello stile invece di affidarsi solo alle classi
        if (!sidebar.classList.contains('active')) {
            // Aprire la sidebar
            console.log('Opening sidebar');
            sidebar.classList.add('active');
            sidebar.style.left = '0'; // Imposta direttamente lo stile
            sidebarOverlay.classList.add('active');
            document.body.classList.add('sidebar-open');
            
            // Cambia l'icona
            const icon = mobileMenuToggle.querySelector('i');
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            // Chiudere la sidebar
            console.log('Closing sidebar');
            sidebar.classList.remove('active');
            sidebar.style.left = '-280px'; // Imposta direttamente lo stile
            sidebarOverlay.classList.remove('active');
            document.body.classList.remove('sidebar-open');
            
            // Cambia l'icona
            const icon = mobileMenuToggle.querySelector('i');
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
            
            closeSidebarCalendarDropdown();
        }
    }
    
    // Close mobile sidebar - versione migliorata
    function closeMobileSidebar() {
        console.log('closeMobileSidebar called');
        sidebar.classList.remove('active');
        sidebar.style.left = '-280px'; // Imposta direttamente lo stile
        sidebarOverlay.classList.remove('active');
        document.body.classList.remove('sidebar-open');
        
        const icon = mobileMenuToggle.querySelector('i');
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
        
        closeSidebarCalendarDropdown();
    }

    // Chiudi il calendario se aperto quando la sidebar si chiude
    function closeSidebarCalendarDropdown() {
        if (window.Datepicker && calendarMonthDiv && calendarMonthDiv.querySelector('.datepicker')) {
            // Vanilla JS Datepicker: nascondi il dropdown se presente
            const dp = calendarMonthDiv.querySelector('.datepicker');
            if (dp && dp.classList.contains('active')) {
                // Simula click fuori dal calendario per chiuderlo
                document.body.click();
            }
        }
    }

    // Initialize the app
    init();
});