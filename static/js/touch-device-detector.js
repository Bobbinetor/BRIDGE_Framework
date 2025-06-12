/**
 * Touch Device Detector
 * Questo script rileva se il dispositivo supporta il touch e aggiunge classi HTML appropriate
 * per migliorare la gestione dello scrolling sui dispositivi touch
 */
(function() {
    'use strict';
    
    // Esegui immediatamente per avere il massimo effetto
    function detectTouchDevice() {
        const isTouchDevice = 
            ('ontouchstart' in window) ||
            (navigator.maxTouchPoints > 0) ||
            (navigator.msMaxTouchPoints > 0);
            
        if (isTouchDevice) {
            document.documentElement.classList.add('touch-device');
            
            // Aggiungi anche listener per iOS Safari
            document.addEventListener('touchstart', function(){}, {passive: true});
        } else {
            document.documentElement.classList.add('no-touch-device');
        }
    }
    
    // Esegui subito
    detectTouchDevice();
    
    // Riesegui quando il DOM è completamente caricato
    document.addEventListener('DOMContentLoaded', function() {
        // Assicurati che venga rilevato correttamente
        detectTouchDevice();
    });
})();
