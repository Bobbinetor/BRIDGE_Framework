/**
 * Gestione migliorata dello scrolling della sidebar
 * Assicura che lo scrolling funzioni correttamente nell'intera sidebar
 */
(function() {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('[SIDEBAR-SCROLL] Inizializzazione miglioramenti scrolling sidebar');
        
        // Elementi della sidebar
        const sidebar = document.querySelector('.sidebar');
        const chatList = document.querySelector('.chat-list');
        
        if (!sidebar || !chatList) {
            console.warn('[SIDEBAR-SCROLL] Elementi sidebar non trovati');
            return;
        }
        
        // Rimuovere altezze fisse e overflow che potrebbero interferire
        function adjustScrollBehavior() {
            console.log('[SIDEBAR-SCROLL] Ottimizzazione comportamento scroll');
            
            // Assicuriamo che la chat-list non abbia scrolling separato
            if (chatList) {
                chatList.style.overflowY = 'visible';
                chatList.style.height = 'auto';
                chatList.style.maxHeight = 'none';
                
                // Rimuovi attributi di stile inline che potrebbero interferire
                if (chatList.hasAttribute('style')) {
                    const style = chatList.getAttribute('style');
                    const newStyle = style
                        .replace(/overflow-y\s*:\s*[^;]+;?/gi, '')
                        .replace(/max-height\s*:\s*[^;]+;?/gi, '')
                        .replace(/height\s*:\s*[^;]+;?/gi, '');
                    
                    chatList.setAttribute('style', newStyle + '; overflow-y: visible !important; height: auto !important; max-height: none !important;');
                }
            }
            
            // Assicurati che la sidebar abbia lo scrolling abilitato
            if (sidebar) {
                sidebar.style.overflowY = 'auto';
                sidebar.style.overscrollBehavior = 'contain'; // Previene lo scroll del body
            }
        }
        
        // Esegui all'avvio
        adjustScrollBehavior();
        
        // Esegui anche dopo un breve ritardo per assicurarsi che altri script abbiano finito
        setTimeout(adjustScrollBehavior, 500);
        
        // Osserva cambiamenti nel DOM per riapplicare le ottimizzazioni quando necessario
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' || mutation.type === 'attributes') {
                    // Controlla se sono stati aggiunti nuovi elementi alla chat-list
                    if (mutation.target === chatList || chatList.contains(mutation.target)) {
                        console.log('[SIDEBAR-SCROLL] Rilevate modifiche in chat-list, riapplicando ottimizzazioni');
                        adjustScrollBehavior();
                    }
                }
            });
        });
        
        // Avvia osservazione
        if (chatList) {
            observer.observe(chatList, { 
                childList: true, 
                subtree: true,
                attributes: true,
                attributeFilter: ['style', 'class']
            });
        }
        
        // Assegna classe per feedback visivo durante lo scroll
        if (sidebar) {
            sidebar.addEventListener('scroll', function() {
                if (sidebar.scrollTop > 10) {
                    sidebar.classList.add('scrolled');
                } else {
                    sidebar.classList.remove('scrolled');
                }
            });
        }
        
        // Riapplica ottimizzazioni anche quando si carica una nuova chat
        document.addEventListener('click', function(e) {
            if (e.target && (e.target.classList.contains('chat-item') || e.target.closest('.chat-item'))) {
                // Quando si fa clic su una chat, aspetta un po' e poi riapplica le ottimizzazioni
                setTimeout(adjustScrollBehavior, 200);
            }
        });
    });
})();
