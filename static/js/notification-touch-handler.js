/**
 * Notification Touch Handler
 * Questo script migliora la gestione degli eventi touch per le notifiche su dispositivi mobili
 * consentendo uno scrolling fluido
 */
(function() {
    'use strict';
    
    document.addEventListener('DOMContentLoaded', function() {
        console.log('[NOTIFICATION-TOUCH] Script caricato');
        
        // Attendi che tutti gli elementi siano disponibili
        setTimeout(initTouchHandler, 500);
    });
    
    function initTouchHandler() {
        const notificationMenu = document.getElementById('notification-menu');
        const notificationScroller = document.querySelector('.notification-scrollable-container');
        const notificationList = document.querySelector('.notification-list');
        
        if (!notificationMenu || (!notificationScroller && !notificationList)) {
            console.error('[NOTIFICATION-TOUCH] Elementi necessari non trovati');
            return;
        }
        
        console.log('[NOTIFICATION-TOUCH] Inizializzazione handler touch per notifiche');
        
        // Imposta gli elementi scrollabili
        const scrollableElements = [
            notificationMenu, 
            notificationScroller, 
            notificationList
        ].filter(Boolean);
        
        // Aggiungi flag per tenere traccia dello scrolling
        let isScrolling = false;
        let startY = 0;
        
        // Aggiungi listener per gli eventi touch su tutti gli elementi scrollabili
        scrollableElements.forEach(element => {
            // Touchstart - registra posizione iniziale
            element.addEventListener('touchstart', function(e) {
                // Non prevenire lo scrolling naturale
                startY = e.touches[0].clientY;
                isScrolling = false;
            }, { passive: true });  // passive: true migliora le prestazioni
            
            // Touchmove - gestisci lo scrolling
            element.addEventListener('touchmove', function(e) {
                const currentY = e.touches[0].clientY;
                const deltaY = currentY - startY;
                
                // Aggiungi una soglia per considerarlo scrolling
                if (Math.abs(deltaY) > 10) {
                    isScrolling = true;
                }
                
                // Non prevenire lo scrolling naturale (passive: true)
            }, { passive: true });
            
            // Touchend - prevenire click se stiamo scrollando
            element.addEventListener('touchend', function(e) {
                if (isScrolling) {
                    // Aggiorna lo stato
                    isScrolling = false;
                }
            }, { passive: true });
        });
        
        // Aggiungi anche un handler specifico per elementi dentro la lista
        document.addEventListener('DOMContentLoaded', function() {
            // Trova tutti gli elementi all'interno della lista di notifiche
            const notificationItems = document.querySelectorAll('.notification-item');
            
            notificationItems.forEach(item => {
                // Assicurati che i click funzionino ma non interferiscano con lo scrolling
                item.addEventListener('click', function(e) {
                    if (isScrolling) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                });
            });
        });
        
        // Inizializza un observer per osservare nuovi elementi aggiunti alla lista
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Controlla se sono stati aggiunti nuovi elementi alla lista
                    const newItems = document.querySelectorAll('.notification-item:not(.touch-enabled)');
                    newItems.forEach(item => {
                        item.classList.add('touch-enabled');
                        
                        // Assicurati che i click funzionino correttamente
                        item.addEventListener('click', function(e) {
                            if (isScrolling) {
                                e.preventDefault();
                            }
                        });
                    });
                }
            });
        });
        
        // Osserva cambiamenti alla lista delle notifiche
        if (notificationList) {
            observer.observe(notificationList, { childList: true, subtree: true });
        }
        
        console.log('[NOTIFICATION-TOUCH] Handler touch inizializzati');
    }
})();
