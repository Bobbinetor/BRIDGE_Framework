/**
 * iOS Scroll Fix
 * Questo script risolve problemi specifici con lo scrolling su dispositivi iOS
 * che possono interferire con lo scrolling delle notifiche
 */
(function() {
    'use strict';
    
    // Esegui immediatamente per avere la massima efficacia
    function fixIOSScrolling() {
        // Verifica se stiamo su iOS
        const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;
        
        if (isIOS) {
            console.log('[IOS-SCROLL-FIX] Applicazione fix per iOS');
            
            // Aggiungi classe specifica per iOS
            document.documentElement.classList.add('ios-device');
            
            // Assicurati che il viewport sia configurato correttamente
            const metaViewport = document.querySelector('meta[name="viewport"]');
            if (metaViewport) {
                metaViewport.setAttribute('content', 
                    'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
            }
            
            // Previeni il bounce effect di iOS che può interferire con lo scrolling custom
            document.addEventListener('touchmove', function(e) {
                // Non bloccare eventi di scrolling legittimi
                if (e.target.closest('.notification-scrollable-container, .notification-menu, .notification-list')) {
                    return true;
                }
            }, { passive: true });
            
            // Aggiungi la classe per lo scrolling momentum
            document.addEventListener('DOMContentLoaded', function() {
                // Fix per scrolling containers
                [
                    '.notification-menu',
                    '.notification-scrollable-container',
                    '.notification-list'
                ].forEach(selector => {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(el => {
                        if (el) {
                            el.style.webkitOverflowScrolling = 'touch';
                            el.style.overflowY = 'scroll';
                        }
                    });
                });
            });
        }
    }
    
    // Esegui subito
    fixIOSScrolling();
    
    // Esegui anche dopo il caricamento completo
    window.addEventListener('load', fixIOSScrolling);
})();
