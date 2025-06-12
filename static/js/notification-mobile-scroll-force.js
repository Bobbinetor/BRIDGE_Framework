/**
 * Force Mobile Notification Scrolling
 * Questo script forza il corretto scrolling delle notifiche su dispositivi mobili
 * sovrascrivendo qualsiasi stile che potrebbe impedire lo scrolling
 */
(function() {
    'use strict';
    
    // Esegui immediatamente per priorità massima
    console.log('[NOTIFICATION-SCROLL-FORCE] Inizializzazione force scrolling per mobile');
    
    // Esegui quando il DOM è completamente caricato
    document.addEventListener('DOMContentLoaded', function() {
        // Esegui subito e poi periodicamente per assicurarsi che venga applicato
        applyForceScroll();
        
        // Controlla periodicamente per assicurarsi che lo scrolling sia sempre attivo
        const scrollInterval = setInterval(applyForceScroll, 1000);
        
        // Aggiungi anche un listener per gli eventi di click sulla campanella
        const notificationBell = document.getElementById('notification-bell');
        if (notificationBell) {
            notificationBell.addEventListener('click', function() {
                // Attendi che il menu sia visibile
                setTimeout(applyForceScroll, 50);
                setTimeout(applyForceScroll, 300);
                setTimeout(applyForceScroll, 1000);
            });
        }
        
        // Pulizia dopo un po' per non occupare risorse
        setTimeout(function() {
            clearInterval(scrollInterval);
        }, 10000);
    });
    
    function applyForceScroll() {
        const notificationMenu = document.getElementById('notification-menu');
        const notificationList = document.querySelector('.notification-list');
        
        if (!notificationMenu || !notificationList) return;
        
        // Forza stili solo su dispositivi mobili
        if (window.innerWidth <= 768) {
            console.log('[NOTIFICATION-SCROLL-FORCE] Applicazione stili forzati per scrolling su mobile');
            
            // 1. Container principale delle notifiche
            notificationMenu.style.overflowY = 'auto';
            notificationMenu.style.webkitOverflowScrolling = 'touch';
            notificationMenu.style.maxHeight = '60vh';
            notificationMenu.style.position = 'fixed';
            
            // Forza il supporto touch
            notificationMenu.style.touchAction = 'pan-y';
            
            // 2. Lista delle notifiche
            notificationList.style.overflowY = 'visible';
            notificationList.style.maxHeight = 'none';
            
            // 3. Forza l'aggiunta di una classe speciale per debugging
            notificationMenu.classList.add('force-scroll-applied');
            
            // 4. Rimuovi ogni trasformazione CSS che potrebbe interferire
            const elements = [
                notificationMenu,
                notificationList,
                ...document.querySelectorAll('.notification-scrollable-container, .notification-item')
            ];
            
            elements.forEach(el => {
                if (el) {
                    el.style.transform = 'none';
                    el.style.filter = 'none';
                    
                    // Ensure scrollable elements have proper overflow settings
                    if (el === notificationMenu || el.classList.contains('notification-scrollable-container')) {
                        el.style.overflowY = 'auto';
                        el.style.webkitOverflowScrolling = 'touch';
                    }
                }
            });
            
            // 5. Aggiungi manualmente una scrollable-container se non esiste
            if (!document.querySelector('.notification-scrollable-container')) {
                console.log('[NOTIFICATION-SCROLL-FORCE] Creazione container scrollabile mancante');
                
                const scrollContainer = document.createElement('div');
                scrollContainer.className = 'notification-scrollable-container';
                scrollContainer.style.overflowY = 'auto';
                scrollContainer.style.webkitOverflowScrolling = 'touch';
                scrollContainer.style.maxHeight = '50vh';
                
                // Sposta tutti gli elementi della lista nel nuovo container
                if (notificationList.parentNode === notificationMenu) {
                    notificationMenu.insertBefore(scrollContainer, notificationList);
                    scrollContainer.appendChild(notificationList);
                }
            }
        }
    }
})();
