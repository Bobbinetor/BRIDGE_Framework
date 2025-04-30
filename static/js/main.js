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
        
        // Message form submission
        messageForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (messageInput.value.trim() !== '' && !isProcessing) {
                sendMessage(messageInput.value.trim());
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
        
        // Fetch the complete chat with messages
        fetch(`/api/chats/${chatId}`)
            .then(response => response.json())
            .then(chat => {
                // Update UI
                renderChatList();
                currentChatTitle.textContent = chat.title;
                welcomeContainer.style.display = 'none';
                chatMessages.style.display = 'flex';
                messageInput.disabled = false;
                sendBtn.disabled = false;
                renameChatBtn.disabled = false;
                deleteChatBtn.disabled = false;
                
                // Render messages
                renderMessages(chat.messages);
                
                // Scroll to bottom
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
    
    // Initialize the app
    init();
});