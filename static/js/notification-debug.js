/**
 * Debug per notifiche - per individuare e correggere problemi di visualizzazione
 */
(function() {
    // Esegui solo in modalità sviluppo - verificare se siamo in production tramite una variabile
    const isDevelopment = true; // In un ambiente reale questo dovrebbe essere controllato

    if (!isDevelopment) return;

    // Attendi il caricamento completo
    document.addEventListener('DOMContentLoaded', function() {
        console.log('[NOTIFICATION-DEBUG] Strumento di debug notifiche caricato');
        
        // Raccogli gli elementi rilevanti
        const notificationBell = document.getElementById('notification-bell');
        const notificationMenu = document.getElementById('notification-menu');
        
        if (!notificationBell || !notificationMenu) {
            console.error('[NOTIFICATION-DEBUG] Elementi notifiche mancanti');
            return;
        }
        
        // Aggiungi listener per monitorare il click sulla campanella
        notificationBell.addEventListener('click', function() {
            console.log('[NOTIFICATION-DEBUG] Click campanella rilevato');
            
            // Controlla stato dopo il click (con un piccolo ritardo)
            setTimeout(function() {
                const isVisible = notificationMenu.classList.contains('active');
                const display = window.getComputedStyle(notificationMenu).display;
                
                console.log('[NOTIFICATION-DEBUG] Stato menu dopo click:');
                console.log('- Classe active:', isVisible);
                console.log('- Display CSS:', display);
                console.log('- Posizione:', window.getComputedStyle(notificationMenu).position);
                console.log('- Z-index:', window.getComputedStyle(notificationMenu).zIndex);
                console.log('- Dimensioni viewport:', window.innerWidth, 'x', window.innerHeight);
                
                // Controlla overlay
                const overlay = document.getElementById('notification-overlay');
                if (overlay) {
                    console.log('- Overlay display:', window.getComputedStyle(overlay).display);
                } else {
                    console.log('- Overlay non trovato nel DOM');
                }
                
                // Aggiungi un bottone di emergenza per forzare la visibilità se necessario
                if (isVisible && display === 'none') {
                    console.warn('[NOTIFICATION-DEBUG] Menu dovrebbe essere visibile ma non lo è! Applicazione fix...');
                    notificationMenu.style.display = 'block';
                }
            }, 100);
        });
        
        // Aggiungi funzione globale per l'ispezione manuale
        window.debugNotificationMenu = function() {
            console.log('[NOTIFICATION-DEBUG] Stato attuale menu notifiche:');
            console.log('- Elemento:', notificationMenu);
            console.log('- Classi:', notificationMenu.className);
            console.log('- Display:', window.getComputedStyle(notificationMenu).display);
            console.log('- Posizione:', window.getComputedStyle(notificationMenu).position);
            
            // Renderizza alcuni stili
            return {
                position: window.getComputedStyle(notificationMenu).position,
                display: window.getComputedStyle(notificationMenu).display,
                zIndex: window.getComputedStyle(notificationMenu).zIndex,
                top: window.getComputedStyle(notificationMenu).top,
                left: window.getComputedStyle(notificationMenu).left,
                right: window.getComputedStyle(notificationMenu).right,
                width: window.getComputedStyle(notificationMenu).width,
                height: window.getComputedStyle(notificationMenu).height
            };
        };
    });
})();
