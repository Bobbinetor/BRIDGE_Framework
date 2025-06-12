/**
 * Notification Toggle Fix
 * Questo script assicura il corretto funzionamento del toggle per aprire/chiudere le notifiche
 */
(function() {
    'use strict';
    
    // Esegui quando il DOM è completamente caricato con priorità alta
    document.addEventListener('DOMContentLoaded', function() {
        console.log('[NOTIFICATION-TOGGLE-FIX] Inizializzazione');
        
        // Piccolo ritardo per assicurarsi che tutti gli elementi siano disponibili
        setTimeout(initToggleFix, 300);
    });
    
    function initToggleFix() {
        // Elementi principali
        const notificationBell = document.getElementById('notification-bell');
        const notificationMenu = document.getElementById('notification-menu');
        const notificationOverlay = document.getElementById('notification-overlay');
        
        if (!notificationBell || !notificationMenu) {
            console.error('[NOTIFICATION-TOGGLE-FIX] Elementi necessari non trovati');
            return;
        }
        
        console.log('[NOTIFICATION-TOGGLE-FIX] Fix inizializzato');
        
        // 1. Assicurati che le notifiche siano chiuse all'avvio
        function closeNotifications() {
            if (notificationMenu) {
                notificationMenu.classList.remove('active');
                notificationMenu.style.display = 'none';
            }
            
            if (notificationOverlay) {
                notificationOverlay.style.display = 'none';
            }
            
            console.log('[NOTIFICATION-TOGGLE-FIX] Notifiche chiuse forzatamente');
        }
        
        // 2. Forza chiusura all'avvio
        closeNotifications();
        
        // 3. Chiudi notifiche dopo un secondo per prevenire apertura automatica
        setTimeout(closeNotifications, 1000);
        
        // 4. Aggiungi un click handler ottimizzato che risolve il problema del toggle
        const originalBellClick = notificationBell.onclick;
        
        notificationBell.onclick = function(e) {
            console.log('[NOTIFICATION-TOGGLE-FIX] Click sulla campanella intercettato');
            
            // Verifica se il menu è già aperto
            const isMenuOpen = notificationMenu.classList.contains('active') || 
                               (window.getComputedStyle(notificationMenu).display !== 'none');
            
            console.log('[NOTIFICATION-TOGGLE-FIX] Stato menu: ' + (isMenuOpen ? 'aperto' : 'chiuso'));
            
            if (isMenuOpen) {
                // Se è aperto, chiudilo
                notificationMenu.classList.remove('active');
                notificationMenu.style.display = 'none';
                
                if (notificationOverlay) {
                    notificationOverlay.style.display = 'none';
                }
                
                // Previeni altri handler
                e.preventDefault();
                e.stopPropagation();
                
                console.log('[NOTIFICATION-TOGGLE-FIX] Notifiche chiuse manualmente');
                return false;
            } else {
                // Consenti agli altri handler di aprire il menu
                console.log('[NOTIFICATION-TOGGLE-FIX] Permesso apertura notifiche');
            }
        };
        
        // 5. Gestisci ESC per chiudere le notifiche
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeNotifications();
            }
        });
        
        // 6. Ripristina l'apertura/chiusura al touch nel tap fuori su mobile
        document.addEventListener('click', function(e) {
            // Se il menu è aperto e il click non è dentro il menu o sulla campanella
            const isMenuOpen = notificationMenu.classList.contains('active');
            
            if (isMenuOpen && 
                !notificationMenu.contains(e.target) && 
                e.target !== notificationBell) {
                closeNotifications();
            }
        });
        
        // 7. Controlla periodicamente che il menu non sia aperto per errore all'avvio
        setTimeout(function() {
            const isMenuOpen = notificationMenu.classList.contains('active') || 
                              (window.getComputedStyle(notificationMenu).display !== 'none');
            
            if (isMenuOpen && window.innerWidth <= 768) {
                console.log('[NOTIFICATION-TOGGLE-FIX] Chiusura notifiche aperte erroneamente');
                closeNotifications();
            }
        }, 2000);
    }
})();
