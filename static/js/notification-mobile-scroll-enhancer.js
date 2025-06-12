/**
 * Notification Mobile Scroll Enhancer
 * Questo script migliora lo scrolling delle notifiche su dispositivi mobili
 * garantendo che tutte le notifiche siano visualizzabili con uno scrolling fluido
 */
(function() {
    'use strict';
    
    // Esegui quando il DOM è completamente caricato
    document.addEventListener('DOMContentLoaded', function() {
        console.log('[NOTIFICATION-SCROLL-ENHANCER] Script caricato');
        
        // Aggiungi un ritardo minimo per assicurarsi che tutti gli elementi siano disponibili
        setTimeout(initScrollEnhancer, 300);
    });
    
    function initScrollEnhancer() {
        // Trova gli elementi principali
        const notificationBell = document.getElementById('notification-bell');
        const notificationMenu = document.getElementById('notification-menu');
        const notificationList = document.querySelector('.notification-list');
        
        // Verifica che tutti gli elementi necessari esistano
        if (!notificationBell || !notificationMenu || !notificationList) {
            console.error('[NOTIFICATION-SCROLL-ENHANCER] Elementi necessari non trovati');
            return;
        }
        
        console.log('[NOTIFICATION-SCROLL-ENHANCER] Elementi trovati, inizializzazione miglioramenti');
        
        // 1. Applica stili di scrolling ottimizzati ogni volta che il menu viene aperto
        function applyScrollingStyles() {
            if (window.innerWidth <= 768) {
                // Calcola l'altezza ottimale per il menu
                const headerHeight = document.querySelector('.chat-header')?.offsetHeight || 60;
                const viewportHeight = window.innerHeight;
                const maxHeight = Math.floor(viewportHeight * 0.7); // 70% dell'altezza della viewport
                
                // Applica stili per dispositivi mobile
                notificationMenu.style.maxHeight = maxHeight + 'px';
                notificationMenu.style.overflowY = 'auto';
                notificationMenu.style.webkitOverflowScrolling = 'touch';
                notificationMenu.style.paddingBottom = '15px';
                
                // Rimuovi altezze massime dalla lista
                if (notificationList) {
                    notificationList.style.maxHeight = 'none';
                    notificationList.style.overflowY = 'visible';
                }
                
                console.log('[NOTIFICATION-SCROLL-ENHANCER] Stili di scrolling ottimizzati applicati');
            } else {
                // Su desktop mantieni l'impostazione predefinita
                notificationMenu.style.maxHeight = '400px';
            }
        }
        
        // 2. Aggiunge toccabilità al contenuto delle notifiche senza influenzare lo scrolling
        function enhanceNotificationTouchability() {
            // Usa un observer per rilevare nuove notifiche aggiunte alla lista
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.addedNodes.length) {
                        // Aggiungi gestione touch a ciascun elemento notifica
                        document.querySelectorAll('.notification-item').forEach(item => {
                            // Previeni il bubbling degli eventi touch per consentire lo scrolling
                            item.addEventListener('touchmove', function(e) {
                                e.stopPropagation();
                            }, { passive: true });
                            
                            // Feedback visivo al tocco
                            item.addEventListener('touchstart', function() {
                                this.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                            }, { passive: true });
                            
                            item.addEventListener('touchend', function() {
                                this.style.backgroundColor = '';
                            }, { passive: true });
                        });
                    }
                });
            });
            
            // Osserva cambiamenti nella lista delle notifiche
            observer.observe(notificationList, { childList: true, subtree: true });
        }
        
        // 3. Previeni che l'apertura del menu delle notifiche blocchi la scrollabilità
        function ensureMenuIsScrollable() {
            // Quando il menu viene mostrato, verifica che sia scrollabile
            const menuObserver = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.attributeName === 'class') {
                        if (notificationMenu.classList.contains('active')) {
                            // Se il menu è attivo, verifica e applica le proprietà di scrolling
                            applyScrollingStyles();
                            
                            // Forza un refresh del layout per garantire che lo scrolling funzioni
                            notificationMenu.style.display = 'none';
                            notificationMenu.offsetHeight; // Trigger reflow
                            notificationMenu.style.display = 'block';
                            
                            console.log('[NOTIFICATION-SCROLL-ENHANCER] Menu ricaricato per garantire lo scrolling');
                        }
                    }
                });
            });
            
            menuObserver.observe(notificationMenu, { attributes: true });
        }
        
        // 4. Callback quando l'utente clicca sulla campanella
        notificationBell.addEventListener('click', function() {
            // Breve timeout per dare tempo al menu di essere visualizzato
            setTimeout(function() {
                applyScrollingStyles();
            }, 50);
        });
        
        // 5. Gestisci eventuali problemi di scrolling su dispositivi specifici
        function fixSpecificDeviceIssues() {
            // iOS Safari può avere problemi con -webkit-overflow-scrolling
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
            
            if (isIOS) {
                notificationMenu.style.webkitOverflowScrolling = 'touch';
                notificationMenu.style.transform = 'translateZ(0)';
            }
        }
        
        // Inizializza tutte le funzionalità
        applyScrollingStyles();
        enhanceNotificationTouchability();
        ensureMenuIsScrollable();
        fixSpecificDeviceIssues();
        
        // Gestisci il ridimensionamento della finestra
        window.addEventListener('resize', function() {
            applyScrollingStyles();
        });
        
        console.log('[NOTIFICATION-SCROLL-ENHANCER] Miglioramenti di scrolling mobile inizializzati');
    }
})();
