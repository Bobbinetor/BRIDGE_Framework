/**
 * Fix per le notifiche su dispositivi mobili
 * Questo script garantisce che il menu delle notifiche funzioni correttamente su dispositivi mobili
 * Versione aggiornata che risolve il problema dell'effetto sfocato (blur)
 */
(function() {
    // Esegui quando il DOM è completamente caricato
    document.addEventListener('DOMContentLoaded', function() {
        console.log('[NOTIFICATION-MOBILE] Fix per notifiche mobile caricato (versione anti-blur)');
        
        // Elementi principali
        const notificationBell = document.getElementById('notification-bell');
        const notificationMenu = document.getElementById('notification-menu');
        const notificationOverlay = document.getElementById('notification-overlay') || createNotificationOverlay();
        
        // Verifica che gli elementi esistano
        if (!notificationBell || !notificationMenu) {
            console.error('[NOTIFICATION-MOBILE] Elementi necessari non trovati nel DOM');
            return;
        }
        
        // Funzione per creare l'overlay se non esiste
        function createNotificationOverlay() {
            console.log('[NOTIFICATION-MOBILE] Creando overlay per notifiche (anti-blur)');
            // Rimuovi l'overlay esistente se c'è già un elemento con lo stesso ID
            const existingOverlay = document.getElementById('notification-overlay');
            if (existingOverlay) {
                existingOverlay.remove();
            }
            
            const overlay = document.createElement('div');
            overlay.id = 'notification-overlay';
            overlay.className = 'notification-overlay';
            
            // Assicuriamo che l'overlay non abbia filtri applicati e sia quasi invisibile
            overlay.style.backdropFilter = 'none';
            overlay.style.webkitBackdropFilter = 'none';
            overlay.style.filter = 'none';
            overlay.style.background = 'rgba(0, 0, 0, 0.05)'; // Overlay estremamente leggero, quasi invisibile
            overlay.style.opacity = '0.2'; // Opacità molto ridotta
            overlay.style.zIndex = '1999';
            
            // Previeni qualsiasi trasformazione CSS
            overlay.style.transform = 'none';
            overlay.style.transition = 'none';
            
            document.body.appendChild(overlay);
            return overlay;
        }
        
        // Funzione per regolare il posizionamento del menu su mobile
        function adjustNotificationMenuPosition() {
            if (window.innerWidth <= 768) {
                // Posiziona il menu correttamente su dispositivi mobili
                const headerHeight = document.querySelector('.chat-header')?.offsetHeight || 60;
                
                notificationMenu.style.top = headerHeight + 'px';
                notificationMenu.style.maxHeight = (window.innerHeight - headerHeight - 20) + 'px';
                notificationMenu.style.overflowY = 'auto'; // Forza overflow per scorrimento
                notificationMenu.style.webkitOverflowScrolling = 'touch'; // Migliora scrolling su iOS
                notificationMenu.classList.add('mobile-view');
                
                // Forza hardware acceleration per scrolling fluido
                notificationMenu.style.transform = 'translateZ(0)';
                notificationMenu.style.willChange = 'scroll-position';
                
                // Assicura che l'elenco delle notifiche sia visibile e scrollabile
                const notificationList = document.querySelector('.notification-list');
                if (notificationList) {
                    notificationList.style.maxHeight = 'none';
                    notificationList.style.overflowY = 'visible';
                    
                    // Assicurati che esista un contenitore scrollabile
                    const scrollableContainer = notificationMenu.querySelector('.notification-scrollable-container');
                    if (scrollableContainer) {
                        scrollableContainer.style.overflowY = 'auto';
                        scrollableContainer.style.webkitOverflowScrolling = 'touch';
                        scrollableContainer.style.maxHeight = '50vh';
                        scrollableContainer.style.transform = 'translateZ(0)'; // Hardware acceleration
                        scrollableContainer.style.willChange = 'scroll-position';
                        
                        // Fix specifico per iOS Safari
                        if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
                            scrollableContainer.style.overflowY = 'scroll'; // Più affidabile di auto su iOS
                        }
                    }
                }
            } else {
                // Resetta gli stili per desktop
                notificationMenu.style.top = '';
                notificationMenu.style.maxHeight = '';
                notificationMenu.classList.remove('mobile-view');
            }
        }
        
        // Gestisce i click sulla campanella delle notifiche
        function handleNotificationBellClick(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('[NOTIFICATION-MOBILE] Campanella cliccata');
            
            const isActive = notificationMenu.classList.contains('active');
            
            if (!isActive) {
                // Fix per problemi di blur su mobile (rimuove qualsiasi filtro/blur)
                if (window.innerWidth <= 768) {
                    // Applica fix anti-blur
                    document.querySelectorAll('.notification-menu, .notification-menu *, #notification-overlay')
                        .forEach(el => {
                            if (el) {
                                el.style.backdropFilter = 'none';
                                el.style.webkitBackdropFilter = 'none';
                                el.style.filter = 'none';
                            }
                        });
                        
                    // Rimuovi eventuali trasformazioni o filtri applicati a contenitori principali
                    document.querySelectorAll('.app-container, .chat-container')
                        .forEach(el => {
                            if (el) {
                                el.style.filter = 'none';
                                el.style.transform = 'none';
                            }
                        });
                }
                
                // Prima modifica la visualizzazione poi aggiungi la classe
                notificationMenu.style.display = 'block';
                
                // Regola il posizionamento
                adjustNotificationMenuPosition();
                
                // Attiva il menu
                notificationMenu.classList.add('active');
                
                // Mostra overlay su mobile con trasparenza quasi totale
                if (window.innerWidth <= 768) {
                    notificationOverlay.style.display = 'block';
                    notificationOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.02)'; // Quasi trasparente
                    notificationOverlay.style.opacity = '0.1'; // Opacità minima per mantenere la funzionalità di click
                    
                    // Migliora l'aspetto del menu delle notifiche con bordi e ombre più definiti
                    notificationMenu.style.boxShadow = '0 6px 24px rgba(0, 0, 0, 0.15)';
                    notificationMenu.style.border = '1px solid rgba(0, 0, 0, 0.1)';
                }
                
                console.log('[NOTIFICATION-MOBILE] Menu notifiche aperto');
            } else {
                // Chiudi il menu
                notificationMenu.classList.remove('active');
                notificationMenu.style.display = '';
                
                // Nascondi overlay
                notificationOverlay.style.display = 'none';
                
                console.log('[NOTIFICATION-MOBILE] Menu notifiche chiuso');
            }
        }
        
        // Gestisci chiusura quando si fa clic sull'overlay
        function handleOverlayClick() {
            notificationMenu.classList.remove('active');
            notificationMenu.style.display = '';
            notificationOverlay.style.display = 'none';
        }
        
        /**
         * Applica il fix anti-blur su tutti gli elementi rilevanti
         */
        function applyAntiBlueFix() {
            if (window.innerWidth <= 768) {
                console.log('[NOTIFICATION-MOBILE] Applicazione fix anti-blur');
                
                // Assicura che il menu delle notifiche abbia stili corretti
                if (notificationMenu) {
                    notificationMenu.style.backdropFilter = 'none';
                    notificationMenu.style.webkitBackdropFilter = 'none';
                    notificationMenu.style.filter = 'none';
                    notificationMenu.style.background = 'white';
                    
                    // Imposta uno z-index alto per essere sicuro che sia sopra tutto
                    notificationMenu.style.zIndex = '2000';
                }
                
                // Stili corretti per l'overlay
                if (notificationOverlay) {
                    notificationOverlay.style.backdropFilter = 'none';
                    notificationOverlay.style.webkitBackdropFilter = 'none';
                    notificationOverlay.style.filter = 'none';
                    notificationOverlay.style.background = 'rgba(0, 0, 0, 0.6)';
                    notificationOverlay.style.zIndex = '1999';
                }
                
                // Verifica se ci sono stili globali che potrebbero causare blur
                const appContainer = document.querySelector('.app-container');
                if (appContainer) {
                    appContainer.style.filter = 'none';
                    appContainer.style.backdropFilter = 'none';
                    appContainer.style.webkitBackdropFilter = 'none';
                }
            }
        }
        
        // Inizializzazione
        function initNotificationsFix() {
            // Rimuovi eventhandler esistenti per evitare conflitti
            notificationBell.removeEventListener('click', handleNotificationBellClick);
            notificationOverlay.removeEventListener('click', handleOverlayClick);
            
            // Aggiungi nuovi event handler
            notificationBell.addEventListener('click', handleNotificationBellClick);
            notificationOverlay.addEventListener('click', handleOverlayClick);
            
            // Gestisci ridimensionamento della finestra
            window.addEventListener('resize', function() {
                adjustNotificationMenuPosition();
                applyAntiBlueFix();
            });
            
            // Applica immediatamente il fix anti-blur
            applyAntiBlueFix();
            
            // Assicurati che le notifiche siano chiuse all'avvio
            if (window.innerWidth <= 768) {
                console.log('[NOTIFICATION-MOBILE] Chiusura notifiche all\'avvio');
                notificationMenu.classList.remove('active');
                notificationMenu.style.display = 'none';
                notificationOverlay.style.display = 'none';
            }
            
            console.log('[NOTIFICATION-MOBILE] Fix notifiche mobile inizializzato con anti-blur');
        }
        
        // Inizializza con un piccolo ritardo per assicurarsi che tutto sia caricato
        setTimeout(initNotificationsFix, 300);
    });
})();
