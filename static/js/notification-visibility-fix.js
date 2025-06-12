/**
 * Script per migliorare la visibilità delle notifiche su mobile rimuovendo l'oscuramento dello schermo
 * Questo script modifica dinamicamente l'overlay per renderlo più trasparente
 */
(function() {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('[NOTIFICATION-VISIBILITY] Script di miglioramento visibilità notifiche caricato');
        
        // Attendi che tutti gli elementi siano caricati
        setTimeout(function() {
            // Trova gli elementi principali
            const notificationBell = document.getElementById('notification-bell');
            const notificationOverlay = document.getElementById('notification-overlay');
            
            if (!notificationBell || !notificationOverlay) {
                console.warn('[NOTIFICATION-VISIBILITY] Elementi non trovati');
                return;
            }
            
            // Monitora i click sulla campanella per migliorare l'overlay
            notificationBell.addEventListener('click', function() {
                // Assicurati che l'overlay sia sempre trasparente
                setTimeout(function() {
                    if (notificationOverlay.style.display === 'block') {
                        // Rendi l'overlay quasi invisibile
                        notificationOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.01)';
                        notificationOverlay.style.opacity = '0.1';
                        
                        // Rimuovi qualsiasi effetto di blur che potrebbe essere stato applicato
                        document.querySelectorAll('.app-container, .chat-container, body')
                            .forEach(el => {
                                if (el) {
                                    el.style.filter = 'none';
                                    el.style.opacity = '1';
                                }
                            });
                    }
                }, 100); // Piccolo ritardo per assicurarci che altri script abbiano finito
            });
            
            // Applica lo stile anche al caricamento iniziale
            if (notificationOverlay) {
                notificationOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.01)';
                notificationOverlay.style.opacity = '0.1';
            }
            
            console.log('[NOTIFICATION-VISIBILITY] Miglioramento visibilità notifiche applicato');
        }, 300);
    });
})();
