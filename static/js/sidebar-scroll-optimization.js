/**
 * Sidebar Scroll Optimization
 * Migliora l'esperienza di scrolling della sidebar su dispositivi mobili
 */
(function() {
    // Esegui quando il documento è pronto
    document.addEventListener('DOMContentLoaded', function() {
        console.log('[SIDEBAR-SCROLL] Initializing sidebar scroll optimization');
        
        // Elementi principali
        const sidebar = document.querySelector('.sidebar');
        const chatList = document.querySelector('.chat-list');
        
        // Verifica la presenza degli elementi
        if (!sidebar || !chatList) {
            console.error('[SIDEBAR-SCROLL] Required elements not found');
            return;
        }
        
        // Abilita lo scrolling fluido per tutta la sidebar
        function enableSmoothScrolling() {
            // Assicurati che la chat list non abbia scroll proprio
            chatList.style.overflowY = 'visible';
            chatList.style.maxHeight = 'none';
            chatList.style.height = 'auto';
            
            // Assicurati che la sidebar abbia scroll fluido
            sidebar.style.overflowY = 'auto';
            sidebar.style.webkitOverflowScrolling = 'touch';
            
            // Controlla quando la sidebar viene scrollata per applicare effetti visivi
            sidebar.addEventListener('scroll', function() {
                // Aggiungi classe per effetti visivi quando si fa scroll
                if (sidebar.scrollTop > 10) {
                    sidebar.classList.add('scrolled');
                } else {
                    sidebar.classList.remove('scrolled');
                }
            });
        }
        
        // Migliora gli elementi interattivi nella sidebar per dispositivi touch
        function enhanceTouchInteraction() {
            // Seleziona tutti gli elementi interattivi nella sidebar
            const interactiveElements = sidebar.querySelectorAll('button, .chat-item, a');
            
            interactiveElements.forEach(function(element) {
                // Aggiunge una classe di feedback visivo quando l'elemento viene toccato
                element.addEventListener('touchstart', function() {
                    this.classList.add('touch-feedback');
                });
                
                element.addEventListener('touchend touchcancel', function() {
                    this.classList.remove('touch-feedback');
                });
            });
            
            // Previene il bounce/overscroll della sidebar su iOS
            sidebar.addEventListener('touchmove', function(e) {
                const currentScrollTop = sidebar.scrollTop;
                const maxScrollTop = sidebar.scrollHeight - sidebar.clientHeight;
                
                if ((currentScrollTop <= 0 && e.touches[0].clientY > e.touches[0].clientY - 5) || 
                    (currentScrollTop >= maxScrollTop && e.touches[0].clientY < e.touches[0].clientY + 5)) {
                    // Non blocchiamo l'evento, ma preveniamo comportamenti indesiderati
                }
            }, { passive: true });
        }
        
        // Ottimizza la dimensione degli elementi della sidebar per facilitare il tap
        function optimizeElementsForTouchInteraction() {
            // Aumenta leggermente la dimensione degli elementi della chat per facilitare il tap
            const chatItems = chatList.querySelectorAll('.chat-item');
            
            chatItems.forEach(function(item) {
                item.style.minHeight = '44px';
                item.style.padding = '12px 8px';
                item.style.margin = '4px 0';
            });
        }
        
        // Aggiungi classe visiva all'elemento attualmente attivo
        function highlightActiveElements() {
            // Evidenzia la chat attiva quando viene selezionata
            const chatItems = chatList.querySelectorAll('.chat-item');
            
            chatItems.forEach(function(item) {
                item.addEventListener('click', function() {
                    // Rimuovi la classe active da tutti gli elementi
                    chatItems.forEach(function(chatItem) {
                        chatItem.classList.remove('active');
                    });
                    
                    // Aggiungi la classe active all'elemento cliccato
                    this.classList.add('active');
                    
                    // Su mobile, chiudi automaticamente la sidebar dopo la selezione
                    if (window.innerWidth <= 768) {
                        sidebar.classList.remove('active');
                        const sidebarOverlay = document.getElementById('sidebar-overlay');
                        if (sidebarOverlay) {
                            sidebarOverlay.classList.remove('active');
                        }
                        sidebar.style.left = '-280px';
                    }
                });
            });
        }
        
        // Inizializza tutte le ottimizzazioni
        function initSidebarOptimizations() {
            // Abilita funzionalità solo su mobile
            if (window.innerWidth <= 768) {
                enableSmoothScrolling();
                enhanceTouchInteraction();
                optimizeElementsForTouchInteraction();
            }
            
            // Funzionalità per tutte le dimensioni dello schermo
            highlightActiveElements();
        }
        
        // Inizializza ottimizzazioni
        initSidebarOptimizations();
        
        // Aggiorna ottimizzazioni sul ridimensionamento
        window.addEventListener('resize', function() {
            initSidebarOptimizations();
        });
        
        console.log('[SIDEBAR-SCROLL] Sidebar scroll optimization initialized');
    });
})();
