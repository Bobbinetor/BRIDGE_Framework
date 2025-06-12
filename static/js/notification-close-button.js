/**
 * Notification Close Button Handler
 * Questo script gestisce il pulsante di chiusura esplicito nelle notifiche
 */
(function() {
    'use strict';
    
    document.addEventListener('DOMContentLoaded', function() {
        console.log('[NOTIFICATION-CLOSE-BUTTON] Inizializzazione');
        
        // Attendi che tutti gli elementi siano disponibili
        setTimeout(initCloseButton, 500);
    });
    
    function initCloseButton() {
        // Elementi principali
        const closeButton = document.getElementById('notification-close-btn');
        const notificationMenu = document.getElementById('notification-menu');
        const notificationOverlay = document.getElementById('notification-overlay');
        
        if (!closeButton || !notificationMenu) {
            console.error('[NOTIFICATION-CLOSE-BUTTON] Elementi necessari non trovati');
            return;
        }
        
        console.log('[NOTIFICATION-CLOSE-BUTTON] Inizializzazione evento click');
        
        // Funzione di chiusura
        function closeNotifications() {
            notificationMenu.classList.remove('active');
            notificationMenu.style.display = 'none';
            
            if (notificationOverlay) {
                notificationOverlay.style.display = 'none';
            }
            
            console.log('[NOTIFICATION-CLOSE-BUTTON] Notifiche chiuse dal pulsante');
        }
        
        // Aggiungi evento click
        closeButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeNotifications();
        });
        
        // Stile per migliorare visibilità su mobile
        if (window.innerWidth <= 768) {
            closeButton.style.width = '36px';
            closeButton.style.height = '36px';
            closeButton.style.fontSize = '16px';
        }
    }
})();
