/**
 * Script per risolvere problemi di interazione con la sidebar su mobile
 * Migliora il comportamento della chat-list e altri elementi nella sidebar
 */
(function() {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('[SIDEBAR-FIX] Inizializzazione fix interazione sidebar');
        
        // Elementi rilevanti
        const sidebar = document.querySelector('.sidebar');
        const chatList = document.getElementById('chat-list');
        
        if (!sidebar || !chatList) {
            console.error('[SIDEBAR-FIX] Elementi sidebar non trovati');
            return;
        }
        
        // Funzione per assicurarsi che la chat-list abbia lo sfondo corretto
        function fixChatListBackground() {
            // Forza lo sfondo corretto
            chatList.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--deep-blue');
            
            // Se ci sono elementos nella lista
            const chatItems = chatList.querySelectorAll('.chat-item');
            chatItems.forEach(item => {
                // Migliora la capacità di interazione con tap
                item.style.touchAction = 'manipulation';
                
                // Listener per il tap/click sulle chat
                item.addEventListener('touchstart', function() {
                    this.classList.add('touch-active');
                }, { passive: true });
                
                item.addEventListener('touchend', function() {
                    this.classList.remove('touch-active');
                }, { passive: true });
            });
        }
        
        // Funzione per assicurarsi che tutti i componenti della sidebar abbiano lo sfondo corretto
        function ensureSidebarConsistency() {
            const components = [
                sidebar,
                sidebar.querySelector('.sidebar-header'),
                sidebar.querySelector('.user-info'),
                chatList,
                sidebar.querySelector('.sidebar-calendar')
            ];
            
            components.forEach(el => {
                if (el) {
                    el.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--deep-blue');
                }
            });
        }
        
        // Applica le correzioni
        fixChatListBackground();
        ensureSidebarConsistency();
        
        // Osserva cambiamenti dinamici alla lista chat (quando vengono aggiunte chat)
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    console.log('[SIDEBAR-FIX] Cambiamenti rilevati in chat-list, riapplico fix');
                    fixChatListBackground();
                }
            });
        });
        
        // Configura l'osservatore
        observer.observe(chatList, { childList: true, subtree: true });
        
        // Aggiungi stile per evidenziare l'elemento attivo quando viene toccato
        const style = document.createElement('style');
        style.textContent = `
            .chat-item.touch-active {
                background-color: rgba(255, 255, 255, 0.15);
            }
        `;
        document.head.appendChild(style);
        
        console.log('[SIDEBAR-FIX] Fix interazione sidebar completato');
    });
})();
