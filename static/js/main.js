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
    let mediaRecorder = null;
    let isRecording = false; // Track recording state
    let audioContext = null; // For playing received audio
    let audioSource = null; // For managing audio playback
    let socket = null; // WebSocket connection
    let speechRecognition = null; // For speech recognition
    let currentLanguage = 'en'; // Default language is English

    // Initialize app
    function init() {
        // Set the language selector to the default value or saved preference
        const savedLanguage = localStorage.getItem('preferredLanguage');
        if (savedLanguage) {
            currentLanguage = savedLanguage;
            languageSelector.value = savedLanguage;
        }
        
        fetchChats();
        setupEventListeners();
        adjustTextareaHeight();
        document.body.addEventListener('click', initAudioContext, { once: true });
        connectWebSocket(); // Establish WebSocket connection
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
        newChatBtn.addEventListener('click', createNewChat);
        
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
                    alert("Impossibile inizializzare il riconoscimento vocale.");
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

    // Function to play received audio blob
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
        audio.onended = () => {
            console.log("Audio playback finished.");
            URL.revokeObjectURL(url);
        };
        audio.onerror = (e) => {
            console.error("Error playing audio:", e);
            URL.revokeObjectURL(url);
            renderSystemMessage("Error playing audio response.", "error");
        };
        audio.play().catch(e => {
             console.error("Audio play failed:", e);
             renderSystemMessage(`Audio playback failed: ${e.message}`, "error");
        });
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