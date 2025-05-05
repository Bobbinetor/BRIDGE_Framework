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
    
    const renameModal = document.getElementById('rename-modal');
    const newTitleInput = document.getElementById('new-title-input');
    const renameForm = document.getElementById('rename-form');
    const cancelRenameBtn = document.getElementById('cancel-rename-btn');
    
    const confirmModal = document.getElementById('confirm-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    
    // Application state
    let currentChatId = null;
    let chats = [];
    let isProcessing = false;
    
    // Initialize app
    function init() {
        fetchChats();
        setupEventListeners();
        adjustTextareaHeight();
    }
    
    // Set up all event listeners
    function setupEventListeners() {
        // New chat button
        newChatBtn.addEventListener('click', createNewChat);
        
        // Message form submission - update this to ensure it works
        messageForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Form submitted, input value:', messageInput.value.trim()); // Debug log
            console.log('Is processing?', isProcessing); // Debug log
            console.log('Input disabled?', messageInput.disabled); // Debug log
            
            if (messageInput.value.trim() !== '' && !isProcessing) {
                sendMessage(messageInput.value.trim());
            } else {
                console.log('Message not sent: Empty input or already processing'); // Debug log
            }
        });
        
        // Auto-resize textarea
        messageInput.addEventListener('input', adjustTextareaHeight);
        
        // Double Enter detection for message input
        let lastEnterPress = 0;
        const DOUBLE_ENTER_THRESHOLD = 500; // ms
        
        messageInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                const currentTime = new Date().getTime();
                
                if (currentTime - lastEnterPress < DOUBLE_ENTER_THRESHOLD) {
                    // Double Enter detected
                    e.preventDefault();
                    if (messageInput.value.trim() !== '' && !isProcessing) {
                        sendMessage(messageInput.value.trim());
                    }
                }
                
                lastEnterPress = currentTime;
            }
        });
        
        // Rename chat
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
        
        // Delete chat
        deleteChatBtn.addEventListener('click', openConfirmModal);
        confirmDeleteBtn.addEventListener('click', function() {
            deleteChat(currentChatId);
            closeConfirmModal();
        });
        cancelDeleteBtn.addEventListener('click', closeConfirmModal);
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
        
        // Get current favorites
        let favorites = JSON.parse(localStorage.getItem('favoriteChats') || '[]');
        
        chats.forEach(chat => {
            const chatElement = document.createElement('div');
            chatElement.className = `chat-item ${chat.id === currentChatId ? 'active' : ''}`;
            chatElement.setAttribute('data-chat-id', chat.id);
            
            const isFavorite = favorites.includes(chat.id);
            
            chatElement.innerHTML = `
                <div class="chat-item-content">
                    <i class="fas fa-comment-dots"></i>
                    <span>${chat.title}</span>
                </div>
                <button class="favorite-btn" title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                    <i class="fas ${isFavorite ? 'fa-star' : 'fa-star-o'}"></i>
                </button>
            `;
            
            // Add click handler for the chat item (excluding the favorite button)
            const chatContent = chatElement.querySelector('.chat-item-content');
            if (chatContent) {
                chatContent.addEventListener('click', () => selectChat(chat.id));
            }
            
            // Add click handler for the favorite button
            const favoriteBtn = chatElement.querySelector('.favorite-btn');
            if (favoriteBtn) {
                favoriteBtn.addEventListener('click', function(e) {
                    e.stopPropagation(); // Prevent triggering chat selection
                    const isNowFavorite = toggleFavorite(chat.id);
                    
                    // Update icon
                    this.innerHTML = `<i class="fas ${isNowFavorite ? 'fa-star' : 'fa-star-o'}"></i>`;
                    this.title = isNowFavorite ? 'Remove from favorites' : 'Add to favorites';
                    
                    // Update favorites list
                    updateFavoritesList();
                });
            }
            
            chatList.appendChild(chatElement);
        });
    }
    
    // Create a new chat with better error handling
    function createNewChat() {
        console.log('Creating new chat'); // Debug log
        
        // Disable the new chat button during creation
        newChatBtn.disabled = true;
        
        fetch('/api/chats', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: 'New Chat'
            }),
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(`Failed to create chat: ${err.error || response.statusText}`);
                });
            }
            return response.json();
        })
        .then(chat => {
            console.log('New chat created:', chat); // Debug log
            chats.push(chat);
            renderChatList();
            
            // Ensure we select the chat after creation and a short delay
            // This gives the backend time to properly store the chat
            setTimeout(() => selectChat(chat.id), 100);
        })
        .catch(error => {
            console.error('Error creating chat:', error);
            alert(`Failed to create new chat: ${error.message}. Please try again.`);
        })
        .finally(() => {
            // Re-enable the new chat button
            newChatBtn.disabled = false;
        });
    }
    
    // Select a chat
    function selectChat(chatId) {
        console.log(`Selecting chat with ID: ${chatId}`); // Debug log
        currentChatId = chatId;
        
        // Fetch the complete chat with messages
        fetch(`/api/chats/${chatId}`)
            .then(response => {
                console.log('Response status:', response.status);
                if (!response.ok) {
                    return response.json().then(err => {
                        throw new Error(`Server error: ${err.error || err.details || response.statusText}`);
                    });
                }
                return response.json();
            })
            .then(chat => {
                console.log('Chat data retrieved successfully:', chat); // Debug log
                
                // Update UI
                renderChatList();
                currentChatTitle.textContent = chat.title;
                welcomeContainer.style.display = 'none';
                chatMessages.style.display = 'flex';
                
                // Ensure the input and buttons are enabled
                messageInput.disabled = false;
                sendBtn.disabled = false;
                renameChatBtn.disabled = false;
                deleteChatBtn.disabled = false;
                
                // Set focus to the message input for immediate typing
                setTimeout(() => messageInput.focus(), 100);
                
                // Render messages
                renderMessages(chat.messages || []);
                
                // Scroll to bottom
                scrollToBottom();
            })
            .catch(error => {
                console.error('Error fetching chat details:', error);
                
                // Show more detailed error message to user
                const errorMsg = document.createElement('div');
                errorMsg.className = 'message system error';
                errorMsg.innerHTML = `
                    <div class="message-content">
                        <p>Error: Failed to load chat. Please try again.</p>
                        <p class="error-details">${error.message}</p>
                        <button class="retry-btn">Retry</button>
                    </div>
                `;
                chatMessages.innerHTML = '';
                chatMessages.appendChild(errorMsg);
                chatMessages.style.display = 'flex';
                welcomeContainer.style.display = 'none';
                
                // Add event listener to the retry button instead of using inline onclick
                const retryBtn = errorMsg.querySelector('.retry-btn');
                if (retryBtn) {
                    retryBtn.addEventListener('click', function() {
                        selectChat(chatId);
                    });
                }
                
                // Keep the UI consistent - enable action buttons
                renameChatBtn.disabled = false;
                deleteChatBtn.disabled = false;
            });
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
        // Process code blocks with syntax highlighting
        content = content.replace(/```(\w+)?\n([\s\S]*?)```/g, function(match, language, code) {
            const langClass = language ? ` class="language-${language}"` : '';
            return `<pre><code${langClass}>${escapeHtml(code)}</code></pre>`;
        });
        
        // Convert inline code
        content = content.replace(/`([^`]+)`/g, function(match, code) {
            return `<code>${escapeHtml(code)}</code>`;
        });
        
        // Handle headers
        content = content.replace(/^### (.*$)/gm, '<h3>$1</h3>');
        content = content.replace(/^## (.*$)/gm, '<h2>$1</h2>');
        content = content.replace(/^# (.*$)/gm, '<h1>$1</h1>');
        
        // Handle lists
        content = content.replace(/^\s*\n\* (.*)/gm, '<ul>\n<li>$1</li>');
        content = content.replace(/^(\* )(.*)/gm, '<li>$2</li>');
        content = content.replace(/^\s*\n\d+\. (.*)/gm, '<ol>\n<li>$1</li>');
        content = content.replace(/^(\d+\. )(.*)/gm, '<li>$2</li>');
        
        // Handle blockquotes
        content = content.replace(/^\> (.*$)/gm, '<blockquote>$1</blockquote>');
        
        // Convert links
        content = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function(match, text, url) {
            return `<a href="${escapeHtml(url)}" target="_blank">${escapeHtml(text)}</a>`;
        });
        
        // Handle emphasis (bold and italic)
        content = content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        content = content.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        content = content.replace(/\_\_([^_]+)\_\_/g, '<strong>$1</strong>');
        content = content.replace(/\_([^_]+)\_/g, '<em>$1</em>');
        
        // Handle paragraphs properly
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
        
        // Replace single newlines with <br> but only within paragraphs
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
        if (!currentChatId) return;
        
        // Disable input while processing
        isProcessing = true;
        messageInput.disabled = true;
        sendBtn.disabled = true;
        
        // Clear input
        messageInput.value = '';
        adjustTextareaHeight();
        
        // Show user message immediately (optimistic UI)
        const tempUserMsg = {
            id: 'temp-' + Date.now(),
            role: 'user',
            content: content,
            timestamp: new Date().toISOString()
        };
        renderMessage(tempUserMsg);
        scrollToBottom();
        
        // Show typing indicator
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
        
        // Send to API
        fetch(`/api/chats/${currentChatId}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: content
            }),
        })
        .then(response => response.json())
        .then(data => {
            // Remove typing indicator
            typingIndicator.remove();
            
            // Update chat in local state if title was changed
            const chat = chats.find(c => c.id === currentChatId);
            if (chat && data.chat_title) {
                chat.title = data.chat_title;
                currentChatTitle.textContent = chat.title;
                renderChatList();
            }
            
            // Render the AI response
            renderMessage(data.ai_message);
            scrollToBottom();
        })
        .catch(error => {
            console.error('Error sending message:', error);
            // Remove typing indicator
            typingIndicator.remove();
            
            // Show error message
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
            // Re-enable input
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
            
            // Update UI
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
    
    // Enhanced sidebar functionality
    const sidebarTabs = document.querySelectorAll('.sidebar-tab');
    const tabContainers = document.querySelectorAll('.tab-container');
    
    // Tab switching functionality
    sidebarTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs and containers
            sidebarTabs.forEach(t => t.classList.remove('active'));
            tabContainers.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Show corresponding container
            const targetId = this.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });
    
    // Theme toggle functionality
    const themeSwitch = document.getElementById('theme-switch');
    if (themeSwitch) {
        // Check if user has a saved preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
            themeSwitch.checked = true;
        }
        
        themeSwitch.addEventListener('change', function() {
            if (this.checked) {
                document.body.classList.add('dark-theme');
                localStorage.setItem('theme', 'dark');
            } else {
                document.body.classList.remove('dark-theme');
                localStorage.setItem('theme', 'light');
            }
        });
    }
    
    // Favorite chat functionality
    function toggleFavorite(chatId) {
        // Get current favorites from localStorage
        let favorites = JSON.parse(localStorage.getItem('favoriteChats') || '[]');
        
        if (favorites.includes(chatId)) {
            // Remove from favorites
            favorites = favorites.filter(id => id !== chatId);
            localStorage.setItem('favoriteChats', JSON.stringify(favorites));
            return false;
        } else {
            // Add to favorites
            favorites.push(chatId);
            localStorage.setItem('favoriteChats', JSON.stringify(favorites));
            return true;
        }
    }
    
    // Update the favorites list in the sidebar
    function updateFavoritesList() {
        const favoriteList = document.getElementById('favorite-list');
        if (!favoriteList) return;
        
        // Get current favorites
        let favorites = JSON.parse(localStorage.getItem('favoriteChats') || '[]');
        
        // Clear the list
        favoriteList.innerHTML = '';
        
        // If no favorites, show message
        if (favorites.length === 0) {
            favoriteList.innerHTML = '<p class="empty-list-message">No favorite chats yet. Star a chat to add it here.</p>';
            return;
        }
        
        // Add each favorite chat
        favorites.forEach(favoriteId => {
            const chat = chats.find(c => c.id === favoriteId);
            if (chat) {
                const chatElement = document.createElement('div');
                chatElement.className = `chat-item ${chat.id === currentChatId ? 'active' : ''}`;
                chatElement.setAttribute('data-chat-id', chat.id);
                chatElement.innerHTML = `
                    <i class="fas fa-star"></i>
                    <span>${chat.title}</span>
                `;
                chatElement.addEventListener('click', () => selectChat(chat.id));
                favoriteList.appendChild(chatElement);
            }
        });
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl+N for new chat
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            createNewChat();
        }
        
        // Escape to close modals
        if (e.key === 'Escape') {
            closeRenameModal();
            closeConfirmModal();
        }
    });
    
    // Initialize the app
    init();
});

// Add this to your main.js file or in a script tag at the bottom of index.html

document.addEventListener('DOMContentLoaded', function() {
    const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
    const sidebar = document.querySelector('.sidebar');
    const chatContainer = document.querySelector('.chat-container');
    
    toggleSidebarBtn.addEventListener('click', function() {
        sidebar.classList.toggle('sidebar-collapsed');
        
        // Update toggle button icon
        const icon = toggleSidebarBtn.querySelector('i');
        if (sidebar.classList.contains('sidebar-collapsed')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-expand');
        } else {
            icon.classList.remove('fa-expand');
            icon.classList.add('fa-bars');
        }
    });
});

// Calendar functionality
document.addEventListener('DOMContentLoaded', function() {
    // Calendar variables
    const calendarGrid = document.getElementById('calendar-grid');
    const currentMonthElement = document.getElementById('current-month');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const addEventBtn = document.getElementById('add-event-btn');
    const eventModal = document.getElementById('event-modal');
    const eventForm = document.getElementById('event-form');
    const cancelEventBtn = document.getElementById('cancel-event-btn');
    const eventDateInput = document.getElementById('event-date');
    
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();
    let selectedDate = new Date();
    
    // Initialize calendar if elements exist
    if (calendarGrid && currentMonthElement) {
        renderCalendar();
        
        // Event listeners for month navigation
        if (prevMonthBtn) {
            prevMonthBtn.addEventListener('click', function() {
                currentMonth--;
                if (currentMonth < 0) {
                    currentMonth = 11;
                    currentYear--;
                }
                renderCalendar();
            });
        }
        
        if (nextMonthBtn) {
            nextMonthBtn.addEventListener('click', function() {
                currentMonth++;
                if (currentMonth > 11) {
                    currentMonth = 0;
                    currentYear++;
                }
                renderCalendar();
            });
        }
        
        // Event listeners for event management
        if (addEventBtn) {
            addEventBtn.addEventListener('click', openEventModal);
        }
        
        if (cancelEventBtn) {
            cancelEventBtn.addEventListener('click', closeEventModal);
        }
        
        if (eventForm) {
            eventForm.addEventListener('submit', function(e) {
                e.preventDefault();
                saveEvent();
            });
        }
    }
    
    // Render the calendar for the current month - FIXED VERSION
    function renderCalendar() {
        // Update the month display
        const monthNames = ["January", "February", "March", "April", "May", "June",
                            "July", "August", "September", "October", "November", "December"];
        currentMonthElement.textContent = `${monthNames[currentMonth]} ${currentYear}`;
        
        // Clear grid
        calendarGrid.innerHTML = '';
        
        // Add weekday headers
        const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        weekdays.forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.className = 'weekday';
            dayElement.textContent = day;
            calendarGrid.appendChild(dayElement);
        });
        
        // Get the first day of the month
        const firstDay = new Date(currentYear, currentMonth, 1);
        const startingDay = firstDay.getDay(); // Day of week (0-6)
        
        // Get the last day of the month
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const totalDays = lastDay.getDate();
        
        // Get the last day of the previous month
        const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
        
        // Variables to track the current date
        const today = new Date();
        const isCurrentMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;
        
        // Create the grid cells
        let dayCount = 1;
        let nextMonthDay = 1;
        
        // Calculate how many rows we actually need
        // Most months need 5 rows, some need 6
        const daysNeeded = startingDay + totalDays;
        const rowsNeeded = Math.ceil(daysNeeded / 7);
        const totalCells = rowsNeeded * 7;
        
        // Create calendar cells
        for (let i = 0; i < totalCells; i++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'day';
            
            // Previous month days
            if (i < startingDay) {
                const prevMonthDate = prevMonthLastDay - (startingDay - i - 1);
                dayElement.textContent = prevMonthDate;
                dayElement.classList.add('other-month');
                
                // Set date attribute for event handling
                const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
                const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
                dayElement.setAttribute('data-date', `${prevYear}-${(prevMonth + 1).toString().padStart(2, '0')}-${prevMonthDate.toString().padStart(2, '0')}`);
            } 
            // Current month days
            else if (dayCount <= totalDays) {
                dayElement.textContent = dayCount;
                
                // Set date attribute for event handling
                const currentMonthStr = (currentMonth + 1).toString().padStart(2, '0');
                const currentDayStr = dayCount.toString().padStart(2, '0');
                dayElement.setAttribute('data-date', `${currentYear}-${currentMonthStr}-${currentDayStr}`);
                
                // Check if this day has events
                const dateString = `${currentYear}-${currentMonthStr}-${currentDayStr}`;
                const hasEvents = checkForEvents(dateString);
                
                // Highlight today
                if (isCurrentMonth && dayCount === today.getDate()) {
                    dayElement.classList.add('today');
                }
                
                // Mark days with events
                if (hasEvents) {
                    dayElement.classList.add('has-events');
                }
                
                dayCount++;
            } 
            // Next month days
            else if (i < totalCells) {
                dayElement.textContent = nextMonthDay;
                dayElement.classList.add('other-month');
                
                // Set date attribute for event handling
                const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
                const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
                dayElement.setAttribute('data-date', `${nextYear}-${(nextMonth + 1).toString().padStart(2, '0')}-${nextMonthDay.toString().padStart(2, '0')}`);
                
                nextMonthDay++;
            }
            
            // Add click event to view day's events
            dayElement.addEventListener('click', function() {
                const dateAttr = this.getAttribute('data-date');
                selectedDate = new Date(dateAttr);
                updateEventsForDay(dateAttr);
                
                // Remove active class from all days
                document.querySelectorAll('.day').forEach(day => day.classList.remove('active'));
                // Add active class to selected day
                this.classList.add('active');
                
                // Update event date input for new events
                if (eventDateInput) {
                    eventDateInput.value = dateAttr;
                }
            });
            
            calendarGrid.appendChild(dayElement);
        }
        
        // Initial events display
        updateEventsForDay(formatDateForAttribute(today));
    }
    
    // Helper function to format date as YYYY-MM-DD
    function formatDateForAttribute(date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    // Check if a date has events
    function checkForEvents(dateString) {
        const events = getEventsFromStorage();
        return events.some(event => event.date === dateString);
    }
    
    // Update the events list for a selected day
    function updateEventsForDay(dateString) {
        const eventsListTitle = document.querySelector('.events-list h4');
        if (eventsListTitle) {
            const displayDate = new Date(dateString);
            const monthNames = ["January", "February", "March", "April", "May", "June",
                                "July", "August", "September", "October", "November", "December"];
            eventsListTitle.textContent = `Events for ${monthNames[displayDate.getMonth()]} ${displayDate.getDate()}, ${displayDate.getFullYear()}`;
        }
        
        // Get events for this day from storage
        const events = getEventsFromStorage().filter(event => event.date === dateString);
        
        // Display events
        const eventsContainer = document.getElementById('events-container');
        if (eventsContainer) {
            // Clear previous events
            eventsContainer.innerHTML = '';
            
            if (events.length === 0) {
                // No events for this day
                const noEvents = document.createElement('div');
                noEvents.className = 'no-events';
                noEvents.textContent = 'No events scheduled for this day.';
                noEvents.style.color = 'rgba(255, 255, 255, 0.5)';
                noEvents.style.fontStyle = 'italic';
                noEvents.style.textAlign = 'center';
                noEvents.style.padding = '15px 0';
                eventsContainer.appendChild(noEvents);
            } else {
                // Sort events by time
                events.sort((a, b) => a.time.localeCompare(b.time));
                
                // Display each event
                events.forEach(event => {
                    const eventItem = document.createElement('div');
                    eventItem.className = `event-item ${event.type}`;
                    
                    // Format time for display
                    const timeDisplay = formatTimeForDisplay(event.time);
                    
                    // Icon based on event type
                    let icon = 'fas fa-calendar-alt';
                    if (event.type === 'meeting') icon = 'fas fa-users';
                    else if (event.type === 'deadline') icon = 'fas fa-clock';
                    else if (event.type === 'reminder') icon = 'fas fa-bell';
                    
                    eventItem.innerHTML = `
                        <div class="event-time">${timeDisplay}</div>
                        <div class="event-details">
                            <div class="event-title">${event.title}</div>
                            <div class="event-location"><i class="${icon}"></i> ${event.location || 'No location'}</div>
                        </div>
                        <button class="delete-event-btn" data-id="${event.id}" title="Delete Event">
                            <i class="fas fa-trash"></i>
                        </button>
                    `;
                    
                    eventsContainer.appendChild(eventItem);
                    
                    // Add delete event listener
                    const deleteBtn = eventItem.querySelector('.delete-event-btn');
                    if (deleteBtn) {
                        deleteBtn.addEventListener('click', function() {
                            const eventId = this.getAttribute('data-id');
                            deleteEvent(eventId);
                        });
                    }
                });
            }
        }
    }
    
    // Format time from 24h to 12h format
    function formatTimeForDisplay(time24h) {
        const [hours, minutes] = time24h.split(':');
        let period = 'AM';
        let hour = parseInt(hours, 10);
        
        if (hour >= 12) {
            period = 'PM';
            if (hour > 12) hour -= 12;
        }
        
        if (hour === 0) hour = 12;
        
        return `${hour}:${minutes} ${period}`;
    }
    
    // Event Modal Functions
    function openEventModal() {
        // Set default date to selected date
        if (eventDateInput) {
            eventDateInput.value = formatDateForAttribute(selectedDate);
        }
        
        eventModal.classList.add('active');
    }
    
    function closeEventModal() {
        eventModal.classList.remove('active');
        eventForm.reset();
    }
    
    // Save a new event
    function saveEvent() {
        const eventTitle = document.getElementById('event-title').value;
        const eventDate = document.getElementById('event-date').value;
        const eventTime = document.getElementById('event-time').value;
        const eventLocation = document.getElementById('event-location').value;
        const eventType = document.getElementById('event-type').value;
        
        const newEvent = {
            id: Date.now().toString(),
            title: eventTitle,
            date: eventDate,
            time: eventTime,
            location: eventLocation,
            type: eventType
        };
        
        // Add to storage
        const events = getEventsFromStorage();
        events.push(newEvent);
        localStorage.setItem('calendarEvents', JSON.stringify(events));
        
        // Close modal and update UI
        closeEventModal();
        renderCalendar(); // Re-render to show event indicators
        updateEventsForDay(eventDate);
    }
    
    // Delete an event
    function deleteEvent(eventId) {
        let events = getEventsFromStorage();
        const eventToDelete = events.find(e => e.id === eventId);
        const dateToUpdate = eventToDelete ? eventToDelete.date : null;
        
        events = events.filter(event => event.id !== eventId);
        localStorage.setItem('calendarEvents', JSON.stringify(events));
        
        // Update UI
        renderCalendar();
        if (dateToUpdate) {
            updateEventsForDay(dateToUpdate);
        }
    }
    
    // Get events from localStorage
    function getEventsFromStorage() {
        return JSON.parse(localStorage.getItem('calendarEvents') || '[]');
    }
});