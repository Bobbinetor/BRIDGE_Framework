/**
 * Miglioramenti responsivi per le notifiche
 * Questo script migliora la visualizzazi        // Sostituisce o estende il comportamento esistente del click sulla campanella
        // Rimuoviamo gli event listener esistenti per evitare duplicazioni
        notificationBell.removeEventListener('click', handleNotificationBellClick);
        
        // Aggiungiamo un nuovo event listener
        notificationBell.addEventListener('click', handleNotificationBellClick);
        
        // Funzione per gestire il click sulla campanella
        function handleNotificationBellClick(e) {
            // Previene propagazione
            e.stopPropagation();
            e.preventDefault();
            
            console.log("[NOTIFICATIONS] Campanella cliccata");
            
            // Toggle menu visibility
            const isActive = notificationMenu.classList.contains('active');
            
            if (!isActive) {
                // Mostra il menu
                notificationMenu.classList.add('active');
                notificationMenu.style.display = 'block';
                
                console.log("[NOTIFICATIONS] Menu attivato");
                
                // Imposta il posizionamento corretto per dispositivi mobili
                adjustNotificationsForMobile();
            } else {
                // Nasconde il menu
                notificationMenu.classList.remove('active');
                notificationMenu.style.display = 'none';
                
                console.log("[NOTIFICATIONS] Menu disattivato");
                
                // Nasconde l'overlay
                const overlay = document.getElementById('notification-overlay');
                if (overlay) {
                    overlay.style.display = 'none';
                }
            }con le notifiche su dispositivi mobili
 */
(function() {
    document.addEventListener('DOMContentLoaded', function() {
        // Elementi relativi alle notifiche
        const notificationBell = document.getElementById('notification-bell');
        const notificationMenu = document.getElementById('notification-menu');
        
        console.log("[NOTIFICATIONS] Inizializzando miglioramenti responsivi per notifiche");
        
        if (!notificationBell || !notificationMenu) {
            console.error("[NOTIFICATIONS] Elementi notifiche non trovati nel DOM");
            return;
        }
        
        // Funzione per gestire il posizionamento delle notifiche su mobile
        function adjustNotificationsForMobile() {
            const isMobile = window.innerWidth <= 768;
            
            if (isMobile && notificationMenu.classList.contains('active')) {
                // Aggiunge una classe specifica per mobile quando le notifiche sono attive
                notificationMenu.classList.add('mobile-view');
                
                // Aggiunge un overlay per permettere la chiusura toccando fuori dal menu
                let overlay = document.getElementById('notification-overlay');
                if (!overlay) {
                    overlay = document.createElement('div');
                    overlay.id = 'notification-overlay';
                    overlay.className = 'modal-overlay';
                    overlay.style.position = 'fixed';
                    overlay.style.top = '0';
                    overlay.style.left = '0';
                    overlay.style.right = '0';
                    overlay.style.bottom = '0';
                    overlay.style.backgroundColor = 'rgba(0,0,0,0.3)';
                    overlay.style.zIndex = '1000';
                    overlay.style.display = 'none';
                    document.body.appendChild(overlay);
                    
                    // Chiusura quando si tocca l'overlay
                    overlay.addEventListener('click', function() {
                        notificationMenu.classList.remove('active');
                        overlay.style.display = 'none';
                    });
                }
                
                // Mostra l'overlay
                overlay.style.display = 'block';
                
                // Aggiunge un pulsante di chiusura visibile al menu delle notifiche su mobile
                if (!document.getElementById('close-notification-mobile')) {
                    const closeBtn = document.createElement('button');
                    closeBtn.id = 'close-notification-mobile';
                    closeBtn.className = 'notification-close-btn';
                    closeBtn.innerHTML = '<i class="fas fa-times"></i>';
                    closeBtn.style.position = 'absolute';
                    closeBtn.style.top = '10px';
                    closeBtn.style.right = '10px';
                    closeBtn.style.background = 'transparent';
                    closeBtn.style.border = 'none';
                    closeBtn.style.fontSize = '16px';
                    closeBtn.style.cursor = 'pointer';
                    closeBtn.style.zIndex = '3';
                    
                    // Aggiunge il pulsante all'intestazione del menu
                    const menuHeader = notificationMenu.querySelector('.notification-menu-header');
                    if (menuHeader) {
                        menuHeader.style.position = 'relative';
                        menuHeader.appendChild(closeBtn);
                        
                        // Event listener per chiudere il menu
                        closeBtn.addEventListener('click', function() {
                            notificationMenu.classList.remove('active');
                            document.getElementById('notification-overlay').style.display = 'none';
                        });
                    }
                }
            } else {
                notificationMenu.classList.remove('mobile-view');
                
                // Nasconde l'overlay se esiste
                const overlay = document.getElementById('notification-overlay');
                if (overlay) {
                    overlay.style.display = 'none';
                }
            }
        }
        
        // Sostituisce o estende il comportamento esistente del click sulla campanella
        const originalClickHandler = notificationBell.onclick;
        notificationBell.onclick = function(e) {
            // Previene propagazione
            e.stopPropagation();
            e.preventDefault();
            
            // Toggle menu visibility
            const isActive = notificationMenu.classList.contains('active');
            
            if (!isActive) {
                notificationMenu.classList.add('active');
                // Imposta il posizionamento corretto per dispositivi mobili
                adjustNotificationsForMobile();
            } else {
                notificationMenu.classList.remove('active');
                // Nasconde l'overlay
                const overlay = document.getElementById('notification-overlay');
                if (overlay) {
                    overlay.style.display = 'none';
                }
            }
            
            return false;
        }
        
        // Chiudi il menu di notifica quando si clicca fuori
        document.addEventListener('click', function(e) {
            if (notificationMenu.classList.contains('active') && 
                !notificationMenu.contains(e.target) && 
                e.target !== notificationBell) {
                
                notificationMenu.classList.remove('active');
                notificationMenu.style.display = 'none';
                
                // Nasconde l'overlay
                const overlay = document.getElementById('notification-overlay');
                if (overlay) {
                    overlay.style.display = 'none';
                }
            }
        });
        
        // Aggiunge gestione responsive quando la finestra viene ridimensionata
        window.addEventListener('resize', adjustNotificationsForMobile);
        
        // Controllo iniziale
        if (notificationMenu.classList.contains('active')) {
            adjustNotificationsForMobile();
        }
        
        // Correggiamo lo stile del menu delle notifiche per assicurarci che funzioni correttamente
        // Applichiamo un fix CSS direttamente tramite JavaScript
        applyNotificationMenuFixes();
    });
    
    // Funzione per applicare correzioni CSS direttamente
    function applyNotificationMenuFixes() {
        const notificationMenu = document.getElementById('notification-menu');
        if (!notificationMenu) return;
        
        // Assicuriamo che il menu abbia gli stili corretti
        notificationMenu.style.position = 'absolute';
        notificationMenu.style.zIndex = '1050';
        
        // Stili base condivisi tra mobile e desktop
        notificationMenu.style.backgroundColor = '#fff';
        notificationMenu.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';
        
        // Stile appropriato per dispositivi mobili
        if (window.innerWidth <= 768) {
            notificationMenu.style.position = 'fixed';
            notificationMenu.style.top = '60px';
            notificationMenu.style.right = '10px'; 
            notificationMenu.style.left = '10px';
            notificationMenu.style.width = 'auto';
            notificationMenu.style.maxWidth = '95%';
            notificationMenu.style.margin = '0 auto';
        } else {
            // Stile desktop
            notificationMenu.style.position = 'absolute';
            notificationMenu.style.right = '0';
            notificationMenu.style.top = '100%';
            notificationMenu.style.width = '300px';
            notificationMenu.style.maxHeight = '400px';
            notificationMenu.style.left = 'auto';
        }
    }
})();
