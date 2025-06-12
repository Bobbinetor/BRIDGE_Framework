/**
 * Notification State Manager
 * Questo script gestisce correttamente lo stato delle notifiche, assicurando che:
 * 1. Le notifiche siano chiuse all'avvio dell'applicazione
 * 2. Le notifiche possano essere chiuse correttamente su mobile
 */
(function() {
    'use strict';
    
    // Esegui immediatamente per priorità massima
    console.log('[NOTIFICATION-STATE] Inizializzazione state manager');
    
    // Funzione per ripristinare lo stato corretto all'avvio
    function resetNotificationState() {
        const notificationMenu = document.getElementById('notification-menu');
        const notificationOverlay = document.getElementById('notification-overlay');
        
        if (notificationMenu) {
            // Assicurati che il menu sia nascosto all'avvio
            notificationMenu.classList.remove('active');
            notificationMenu.style.display = '';
            
            // Rimuovi stili inline potenzialmente problematici
            if (window.innerWidth <= 768) {
                notificationMenu.style.removeProperty('display');
                
                // Assicurati di nascondere il menu
                if (!notificationMenu.style.display || notificationMenu.style.display !== 'none') {
                    notificationMenu.style.display = 'none';
                }
            }
        }
        
        if (notificationOverlay) {
            // Assicurati che l'overlay sia nascosto all'avvio
            notificationOverlay.style.display = 'none';
        }
    }
    
    // Esegui subito per evitare flash di notifiche all'avvio
    resetNotificationState();
    
    // Esegui anche quando il DOM è completamente caricato
    document.addEventListener('DOMContentLoaded', function() {
        // Attendi un momento per permettere ad altri script di inizializzare elementi
        setTimeout(function() {
            console.log('[NOTIFICATION-STATE] Applicazione state manager');
            
            // Applica il reset iniziale
            resetNotificationState();
            
            // Ottieni riferimenti agli elementi chiave
            const notificationBell = document.getElementById('notification-bell');
            const notificationMenu = document.getElementById('notification-menu');
            const notificationOverlay = document.getElementById('notification-overlay');
            
            if (!notificationBell || !notificationMenu || !notificationOverlay) {
                console.error('[NOTIFICATION-STATE] Elementi notifica non trovati');
                return;
            }
            
            // Crea un gestore unificato per il click sulla campanella
            function handleBellClick(e) {
                // Previene eventi predefiniti
                e.preventDefault();
                e.stopPropagation();
                
                console.log('[NOTIFICATION-STATE] Click sulla campanella rilevato');
                
                // Rileva lo stato corrente
                const isMenuOpen = notificationMenu.classList.contains('active') || 
                                  (notificationMenu.style.display === 'block');
                
                if (isMenuOpen) {
                    console.log('[NOTIFICATION-STATE] Chiusura menu notifiche');
                    
                    // Chiudi il menu
                    notificationMenu.classList.remove('active');
                    notificationMenu.style.display = 'none';
                    notificationOverlay.style.display = 'none';
                    
                    // Su dispositivi mobili, forza la chiusura
                    if (window.innerWidth <= 768) {
                        // Rimuovi qualsiasi stile inline potenzialmente problematico
                        document.body.classList.remove('notification-open');
                    }
                } else {
                    console.log('[NOTIFICATION-STATE] Apertura menu notifiche');
                    
                    // Apri il menu
                    notificationMenu.classList.add('active');
                    notificationMenu.style.display = 'block';
                    
                    // Su dispositivi mobili, mostra l'overlay e posiziona correttamente
                    if (window.innerWidth <= 768) {
                        const headerHeight = document.querySelector('.chat-header')?.offsetHeight || 60;
                        notificationMenu.style.top = headerHeight + 'px';
                        notificationOverlay.style.display = 'block';
                        document.body.classList.add('notification-open');
                    }
                }
            }
            
            // Gestisci il click sull'overlay per chiudere il menu
            function handleOverlayClick(e) {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('[NOTIFICATION-STATE] Click su overlay rilevato');
                
                // Chiudi il menu
                notificationMenu.classList.remove('active');
                notificationMenu.style.display = 'none';
                notificationOverlay.style.display = 'none';
                document.body.classList.remove('notification-open');
            }
            
            // Rimuovi tutti gli handler esistenti
            const newBell = notificationBell.cloneNode(true);
            if (notificationBell.parentNode) {
                notificationBell.parentNode.replaceChild(newBell, notificationBell);
            }
            
            const newOverlay = notificationOverlay.cloneNode(true);
            if (notificationOverlay.parentNode) {
                notificationOverlay.parentNode.replaceChild(newOverlay, notificationOverlay);
            }
            
            // Aggiungi i nuovi handler
            newBell.addEventListener('click', handleBellClick);
            newOverlay.addEventListener('click', handleOverlayClick);
            
            // Osserva cambiamenti alla finestra
            window.addEventListener('resize', function() {
                // Quando la dimensione della finestra cambia, assicurati che lo stato sia corretto
                const isMenuOpen = notificationMenu.classList.contains('active');
                
                if (isMenuOpen) {
                    if (window.innerWidth <= 768) {
                        // Su mobile, mostra l'overlay
                        notificationOverlay.style.display = 'block';
                        
                        // Posiziona correttamente il menu
                        const headerHeight = document.querySelector('.chat-header')?.offsetHeight || 60;
                        notificationMenu.style.top = headerHeight + 'px';
                    } else {
                        // Su desktop, nascondi l'overlay
                        notificationOverlay.style.display = 'none';
                    }
                }
            });
            
            // Periodicamente verifica lo stato corretto (failsafe)
            setInterval(function() {
                // Verifica se dovremmo essere in stato chiuso ma qualcosa è visibile
                const isMenuActive = notificationMenu.classList.contains('active');
                const isMenuVisible = (notificationMenu.style.display === 'block');
                const isOverlayVisible = (notificationOverlay.style.display === 'block');
                
                // Se il menu non è attivo ma è comunque visibile, correggi
                if (!isMenuActive && (isMenuVisible || isOverlayVisible)) {
                    console.log('[NOTIFICATION-STATE] Correzione stato inconsistente');
                    notificationMenu.style.display = 'none';
                    notificationOverlay.style.display = 'none';
                    document.body.classList.remove('notification-open');
                }
            }, 1000);
            
            console.log('[NOTIFICATION-STATE] State manager inizializzato correttamente');
        }, 100);
    });
    
    // Assicura corretto stato dopo caricamento pagina
    window.addEventListener('load', function() {
        setTimeout(resetNotificationState, 300);
    });
})();
