/**
 * Unified Sidebar Controller
 * Questo script unifica e semplifica la gestione della sidebar mobile
 * risolvendo i problemi di apertura e chiusura su tutti i dispositivi
 * VERSIONE AGGIORNATA: risolve i problemi di chiusura
 */
(function() {
    // Log iniziale per debug
    console.log('[SIDEBAR-CONTROLLER] Caricamento controller sidebar unificato');
    
    // Esegui quando il DOM è pronto
    document.addEventListener('DOMContentLoaded', function() {
        console.log('[SIDEBAR-CONTROLLER] Inizializzazione controller sidebar');
        
        // Aggiungi un breve ritardo per assicurarti che tutto sia caricato
        setTimeout(function() {
            initSidebarController();
        }, 100);

    function initSidebarController() {
        // Elementi principali
        const sidebar = document.querySelector('.sidebar');
        const sidebarOverlay = document.getElementById('sidebar-overlay');
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
        
        // Verifica che tutti gli elementi necessari esistano
        if (!sidebar || !sidebarOverlay || !mobileMenuToggle) {
            console.error('[SIDEBAR-CONTROLLER] Elementi richiesti non trovati');
            return;
        }
        
        // Rimuovi tutti gli event listener esistenti usando un clone
        const newMobileToggle = mobileMenuToggle.cloneNode(true);
        if (mobileMenuToggle.parentNode) {
            mobileMenuToggle.parentNode.replaceChild(newMobileToggle, mobileMenuToggle);
        }
        
        const newOverlay = sidebarOverlay.cloneNode(true);
        if (sidebarOverlay.parentNode) {
            sidebarOverlay.parentNode.replaceChild(newOverlay, sidebarOverlay);
        }
        
        // Aggiorna i riferimenti
        const mobileToggle = newMobileToggle;
        const overlay = newOverlay;
        
        /**
         * Apre la sidebar con animazione fluida
         */
        function openSidebar() {
            console.log('[SIDEBAR-CONTROLLER] Apertura sidebar');
            
            // Applica le classi
            sidebar.classList.add('active');
            overlay.classList.add('active');
            document.body.classList.add('sidebar-open');
            
            // Forza posizionamento corretto con stili inline
            sidebar.style.left = '0';
            overlay.style.display = 'block';
            
            // Cambia l'icona del pulsante
            const mobileIcon = mobileToggle.querySelector('i');
            if (mobileIcon) {
                mobileIcon.classList.remove('fa-bars');
                mobileIcon.classList.add('fa-times');
            }
            
            // Cambia anche l'icona del pulsante desktop se esiste
            if (toggleSidebarBtn) {
                const desktopIcon = toggleSidebarBtn.querySelector('i');
                if (desktopIcon) {
                    desktopIcon.classList.remove('fa-bars');
                    desktopIcon.classList.add('fa-times');
                }
            }
        }
        
        /**
         * Chiude la sidebar con animazione fluida
         */
        function closeSidebar() {
            console.log('[SIDEBAR-CONTROLLER] Chiusura sidebar');
            
            // Rimuovi le classi
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.classList.remove('sidebar-open');
            
            // Forza posizionamento corretto con stili inline
            sidebar.style.left = '-280px';
            overlay.style.display = 'none';
            
            // Cambia l'icona del pulsante
            const mobileIcon = mobileToggle.querySelector('i');
            if (mobileIcon) {
                mobileIcon.classList.remove('fa-times');
                mobileIcon.classList.add('fa-bars');
            }
            
            // Cambia anche l'icona del pulsante desktop se esiste
            if (toggleSidebarBtn) {
                const desktopIcon = toggleSidebarBtn.querySelector('i');
                if (desktopIcon) {
                    desktopIcon.classList.remove('fa-times');
                    desktopIcon.classList.add('fa-bars');
                }
            }
        }
        
        /**
         * Toggle the sidebar state
         */
        function toggleSidebar() {
            console.log('[SIDEBAR-CONTROLLER] Toggle sidebar');
            
            if (sidebar.classList.contains('active')) {
                closeSidebar();
            } else {
                openSidebar();
            }
        }
        
        // Aggiungi i nuovi event listener
        mobileToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('[SIDEBAR-CONTROLLER] Click sul pulsante mobile');
            toggleSidebar();
        });
        
        // Click sull'overlay chiude la sidebar
        overlay.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('[SIDEBAR-CONTROLLER] Click sull\'overlay');
            closeSidebar();
        });
        
        // Anche il pulsante desktop deve usare la logica unificata
        if (toggleSidebarBtn) {
            const newToggleBtn = toggleSidebarBtn.cloneNode(true);
            if (toggleSidebarBtn.parentNode) {
                toggleSidebarBtn.parentNode.replaceChild(newToggleBtn, toggleSidebarBtn);
            }
            
            newToggleBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('[SIDEBAR-CONTROLLER] Click sul pulsante desktop');
                toggleSidebar();
            });
        }
        
        // Inizializza lo stato corretto in base alla dimensione dello schermo
        function initSidebarState() {
            if (window.innerWidth <= 768) {
                // Su mobile, la sidebar dev'essere nascosta all'inizio
                closeSidebar();
                mobileToggle.style.display = 'flex';
            } else {
                // Su desktop, la sidebar è visibile di default (usa solo le classi CSS)
                sidebar.style.left = '';
                sidebar.classList.remove('active');
                mobileToggle.style.display = 'none';
            }
        }
        
        // Handler per il ridimensionamento della finestra
        window.addEventListener('resize', function() {
            initSidebarState();
        });
        
        // Inizializza lo stato
        initSidebarState();
        
        // Swipe gesture per mobile (opzionale)
        if ('ontouchstart' in window) {
            let touchStartX = 0;
            let touchEndX = 0;
            
            document.addEventListener('touchstart', function(e) {
                touchStartX = e.changedTouches[0].screenX;
            }, { passive: true });
            
            document.addEventListener('touchend', function(e) {
                touchEndX = e.changedTouches[0].screenX;
                handleSwipe();
            }, { passive: true });
            
            function handleSwipe() {
                const swipeThreshold = 100;
                const diff = touchEndX - touchStartX;
                
                // Swipe da sinistra a destra (apre)
                if (diff > swipeThreshold && !sidebar.classList.contains('active')) {
                    openSidebar();
                }
                
                // Swipe da destra a sinistra (chiude)
                if (diff < -swipeThreshold && sidebar.classList.contains('active')) {
                    closeSidebar();
                }
            }
        }
        
        // Esponi le funzioni globalmente per debug
        window.sidebarController = {
            open: openSidebar,
            close: closeSidebar,
            toggle: toggleSidebar
        };
        
        console.log('[SIDEBAR-CONTROLLER] Inizializzazione completata');
    });
})();