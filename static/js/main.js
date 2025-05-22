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
            
            console.log('Calendar initialized successfully');
        } catch (error) {
            console.error('Error initializing calendar:', error);
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

    // Handle event form submission - modified to handle both create and update
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
                
                // Extract date for display update
                const eventDate = new Date(data.start).toISOString().split('T')[0];
                console.log(`Event date for refresh: ${eventDate}, current selected date: ${selectedDate}`);
                
                // If we're viewing the date where the event was added/updated, update the list
                if (selectedDate === eventDate) {
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