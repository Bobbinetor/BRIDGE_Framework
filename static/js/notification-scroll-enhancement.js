/**
 * Notification Scroll Enhancement
 * Questo script migliora la gestione dello scrolling nelle notifiche
 * garantendo che funzioni correttamente su tutti i dispositivi
 */
(function() {
    'use strict';
    
    document.addEventListener('DOMContentLoaded', function() {
        console.log('[NOTIFICATION-SCROLL] Inizializzazione miglioramenti scrolling');
        
        // Aspetta che tutti gli elementi siano disponibili
        setTimeout(initNotificationScroll, 200);
    });
    
    function initNotificationScroll() {
        const notificationMenu = document.getElementById('notification-menu');
        const notificationList = document.getElementById('notification-list');
        const notificationBell = document.getElementById('notification-bell');
        
        if (!notificationMenu || !notificationList || !notificationBell) {
            console.error('[NOTIFICATION-SCROLL] Elementi richiesti non trovati');
            return;
        }
        
        // 1. Assicura che il menu abbia proprietà overflow corrette
        function applyScrollStyles() {
            // Forza lo stile di overflow
            notificationMenu.style.overflowY = 'auto';
            notificationMenu.style.webkitOverflowScrolling = 'touch';
            
            // Imposta altezza massima in base al dispositivo
            const isMobile = window.innerWidth <= 768;
            notificationMenu.style.maxHeight = isMobile ? '70vh' : '400px';
            
            console.log('[NOTIFICATION-SCROLL] Stili di scrolling applicati');
        }
        
        // 2. Aggiungi gestione degli eventi touch per migliorare lo scrolling su mobile
        let isScrolling = false;
        
        notificationList.addEventListener('touchstart', function(e) {
            // Non bloccare lo scrolling
            isScrolling = true;
        }, { passive: true });
        
        notificationList.addEventListener('touchend', function() {
            setTimeout(() => { isScrolling = false; }, 100);
        }, { passive: true });
        
        // 3. Evita che il click sugli elementi delle notifiche chiuda il menu
        notificationList.addEventListener('click', function(e) {
            if (isScrolling) return; // Ignora click se stava scrollando
            e.stopPropagation(); // Evita propagazione al documento
        });
        
        // 4. Monitora l'apertura del menu notifiche
        let menuObserver = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && 
                    mutation.attributeName === 'class') {
                    const isActive = notificationMenu.classList.contains('active');
                    if (isActive) {
                        applyScrollStyles();
                        // Assicurati che sia visibile anche se vuoto
                        if (notificationList.children.length === 0) {
                            notificationList.innerHTML = '<li class="notification-item empty-notification">Nessuna notifica disponibile</li>';
                        }
                    }
                }
            });
        });
        
        // Osserva cambiamenti alla classe per rilevare apertura/chiusura
        menuObserver.observe(notificationMenu, { attributes: true });
        
        // 5. Quando viene cliccata la campanella, assicurati che gli stili siano applicati
        notificationBell.addEventListener('click', function() {
            setTimeout(applyScrollStyles, 50);
        });
        
        // 6. Gestisci il ridimensionamento della finestra
        window.addEventListener('resize', function() {
            if (notificationMenu.classList.contains('active')) {
                applyScrollStyles();
            }
        });
        
        console.log('[NOTIFICATION-SCROLL] Inizializzazione completata');
    }
})();
