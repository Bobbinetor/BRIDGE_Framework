/**
 * Notification Overlay Transparency Enforcer
 * 
 * Questo script garantisce che l'overlay delle notifiche rimanga sempre trasparente
 * anche se altri script tentano di modificarlo. Funziona monitorando costantemente
 * lo stato dell'overlay e applicando la trasparenza necessaria.
 */
(function() {
    'use strict';
    
    // Attendi il caricamento del DOM
    document.addEventListener('DOMContentLoaded', function() {
        console.log('[OVERLAY-ENFORCER] Script di trasparenza overlay avviato');
        
        // Aspetta che tutti gli elementi siano caricati
        setTimeout(function() {
            initOverlayEnforcer();
        }, 500);
        
        // Funzione principale
        function initOverlayEnforcer() {
            // Verifica l'esistenza dell'overlay
            const notificationOverlay = document.getElementById('notification-overlay');
            if (!notificationOverlay) {
                console.warn('[OVERLAY-ENFORCER] Overlay notifiche non trovato');
                return;
            }
            
            // Applica immediatamente la trasparenza
            applyTransparency(notificationOverlay);
            
            // Elementi da monitorare
            const notificationBell = document.getElementById('notification-bell');
            const notificationMenu = document.getElementById('notification-menu');
            
            if (notificationBell) {
                // Monitora i click sulla campanella
                notificationBell.addEventListener('click', function() {
                    // Applica trasparenza con un ritardo per assicurarsi che avvenga dopo altri script
                    setTimeout(() => applyTransparency(notificationOverlay), 50);
                    setTimeout(() => applyTransparency(notificationOverlay), 200);
                    setTimeout(() => applyTransparency(notificationOverlay), 500);
                });
            }
            
            // Funzione per gestire il ridimensionamento della finestra
            window.addEventListener('resize', function() {
                setTimeout(() => applyTransparency(notificationOverlay), 200);
            });
            
            // Mutation Observer per monitorare cambiamenti all'overlay
            const observer = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'attributes' && 
                        (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
                        applyTransparency(notificationOverlay);
                    }
                });
            });
            
            // Opzioni per il monitoraggio
            const config = { 
                attributes: true, 
                attributeFilter: ['style', 'class'],
                childList: false, 
                subtree: false 
            };
            
            // Avvia il monitoraggio
            observer.observe(notificationOverlay, config);
            
            console.log('[OVERLAY-ENFORCER] Trasparenza overlay applicata e monitoraggio attivato');
        }
        
        // Applica le modifiche di trasparenza all'overlay
        function applyTransparency(overlay) {
            if (!overlay) return;
            
            // Verifica che l'overlay sia visibile e quindi applica la trasparenza
            if (window.getComputedStyle(overlay).display !== 'none') {
                overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.01)'; // Quasi invisibile
                overlay.style.opacity = '0.1'; // Estremamente trasparente
            }
        }
    });
})();
