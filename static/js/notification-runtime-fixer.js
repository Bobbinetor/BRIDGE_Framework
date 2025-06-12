/**
 * Notification Runtime Fixer
 * Questo script verifica e corregge in tempo reale eventuali problemi con lo scrolling
 * delle notifiche durante l'esecuzione dell'applicazione
 */
(function() {
    'use strict';
    
    // Esegui quando il DOM è completamente caricato
    document.addEventListener('DOMContentLoaded', function() {
        console.log('[RUNTIME-FIXER] Inizializzazione runtime fixer per notifiche');
        
        // Esegui immediatamente
        setTimeout(initRuntimeFixer, 500);
        
        // Esegui anche dopo che tutto è caricato
        window.addEventListener('load', function() {
            setTimeout(initRuntimeFixer, 1000);
        });
    });
    
    function initRuntimeFixer() {
        // Ottieni la campanella delle notifiche
        const notificationBell = document.getElementById('notification-bell');
        
        if (!notificationBell) {
            console.error('[RUNTIME-FIXER] Campanella notifiche non trovata');
            return;
        }
        
        console.log('[RUNTIME-FIXER] Runtime fixer inizializzato');
        
        // Aggiungi handler per la campanella delle notifiche
        notificationBell.addEventListener('click', function() {
            console.log('[RUNTIME-FIXER] Click sulla campanella rilevato');
            
            // Attendi che il menu sia visibile
            setTimeout(fixNotificationIssues, 100);
            setTimeout(fixNotificationIssues, 500);
        });
        
        // Verifica periodicamente se ci sono problemi con le notifiche
        setInterval(checkForIssues, 2000);
    }
    
    // Risolve i problemi comuni con le notifiche
    function fixNotificationIssues() {
        const notificationMenu = document.getElementById('notification-menu');
        
        if (!notificationMenu) return;
        
        // Verifica se il menu è attualmente aperto
        const isActive = notificationMenu.classList.contains('active') || 
                        (notificationMenu.style.display === 'block');
                        
        if (!isActive) return;
        
        console.log('[RUNTIME-FIXER] Applicazione correzioni in tempo reale');
        
        // 1. Verifica se il menu è scrollabile
        if (window.innerWidth <= 768) {
            ensureScrollable(notificationMenu);
            
            // 2. Verifica anche il contenitore scrollabile
            const scrollContainer = notificationMenu.querySelector('.notification-scrollable-container');
            if (scrollContainer) {
                ensureScrollable(scrollContainer);
            }
            
            // 3. Verifica la lista delle notifiche
            const notificationList = document.querySelector('.notification-list');
            if (notificationList) {
                notificationList.style.overflowY = 'visible';
                notificationList.style.maxHeight = 'none';
                
                // 4. Verifica anche gli elementi singoli
                const notificationItems = notificationList.querySelectorAll('.notification-item');
                if (notificationItems.length > 3) {
                    console.log('[RUNTIME-FIXER] Trovate multiple notifiche, assicuro scrollabilità');
                    
                    // Se ci sono diverse notifiche, assicurati che scrolli
                    forceScrollable(notificationMenu);
                    if (scrollContainer) forceScrollable(scrollContainer);
                }
            }
        }
    }
    
    // Controlla e risolve eventuali problemi nell'interfaccia
    function checkForIssues() {
        const notificationMenu = document.getElementById('notification-menu');
        
        if (!notificationMenu) return;
        
        // Verifica se il menu è attualmente aperto
        const isActive = notificationMenu.classList.contains('active') || 
                        (notificationMenu.style.display === 'block');
                        
        if (isActive) {
            // Menu aperto - verifica se ci sono problemi
            const computedStyle = window.getComputedStyle(notificationMenu);
            
            // Se il menu ha overflow: hidden, correggi
            if (computedStyle.overflowY === 'hidden') {
                console.log('[RUNTIME-FIXER] Rilevato overflow:hidden, correzione...');
                forceScrollable(notificationMenu);
            }
            
            // Verifica anche il container scrollabile
            const scrollContainer = notificationMenu.querySelector('.notification-scrollable-container');
            if (scrollContainer) {
                const containerStyle = window.getComputedStyle(scrollContainer);
                if (containerStyle.overflowY === 'hidden') {
                    console.log('[RUNTIME-FIXER] Rilevato container non scrollabile, correzione...');
                    forceScrollable(scrollContainer);
                }
            }
        }
    }
    
    // Utility per assicurarsi che un elemento sia scrollabile
    function ensureScrollable(element) {
        if (!element) return;
        
        const computedStyle = window.getComputedStyle(element);
        
        // Se l'overflow è hidden, correggi
        if (computedStyle.overflowY === 'hidden') {
            forceScrollable(element);
        }
    }
    
    // Forza gli stili di scrolling su un elemento
    function forceScrollable(element) {
        if (!element) return;
        
        element.style.overflowY = 'auto';
        element.style.webkitOverflowScrolling = 'touch';
        
        // Fix specifico per iOS
        if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
            element.style.overflowY = 'scroll'; // Più affidabile su iOS
        }
        
        // Aggiungi classe per debug
        element.classList.add('force-scrollable');
    }
})();
