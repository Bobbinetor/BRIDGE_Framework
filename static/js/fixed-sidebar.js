/**
 * Controller unificato per la sidebar
 * Versione completamente riscritta per risolvere i problemi di apertura/chiusura su mobile e desktop
 * Supporta sia la vista mobile (sidebar a schermo intero) che desktop (collassa/espandi)
 */
(function() {
    'use strict';
    
    // Log iniziale per tracciamento
    console.log('[FIXED-SIDEBAR] Script caricato: ' + new Date().toISOString());
    
    // Attendi il caricamento del DOM
    document.addEventListener('DOMContentLoaded', function() {
        console.log('[FIXED-SIDEBAR] DOM caricato, inizio inizializzazione');
        
        // Ritardo minimo per assicurarsi che tutti gli elementi esistano
        setTimeout(initFixedSidebar, 200);
    });
    
    /**
     * Inizializza il controller della sidebar
     */
    function initFixedSidebar() {
        // Elementi principali
        const elements = {
            sidebar: document.querySelector('.sidebar'),
            overlay: document.getElementById('sidebar-overlay'),
            toggleButton: document.getElementById('mobile-menu-toggle'),
            desktopToggle: document.getElementById('toggle-sidebar-btn'),
            chatContainer: document.querySelector('.chat-container')
        };
        
        // Verifica elementi richiesti
        if (!elements.sidebar || !elements.overlay || !elements.toggleButton) {
            console.error('[FIXED-SIDEBAR] Elementi richiesti non trovati');
            return false;
        }
        
        console.log('[FIXED-SIDEBAR] Elementi sidebar trovati, inizializzazione');
        
        // Rimuovi event listener esistenti sostituendo gli elementi
        function cleanElement(element) {
            if (!element || !element.parentNode) return element;
            const clone = element.cloneNode(true);
            element.parentNode.replaceChild(clone, element);
            return clone;
        }
        
        // Pulisci elementi dai vecchi event listener
        elements.toggleButton = cleanElement(elements.toggleButton);
        elements.overlay = cleanElement(elements.overlay);
        if (elements.desktopToggle) elements.desktopToggle = cleanElement(elements.desktopToggle);
        
        // Forza stato iniziale corretto in base al dispositivo
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            // Inizializza stato chiuso su mobile
            elements.sidebar.classList.remove('active', 'sidebar-collapsed');
            elements.sidebar.style.left = '-280px';
            elements.overlay.classList.remove('active');
            elements.overlay.style.display = 'none';
            elements.toggleButton.style.display = 'flex';
            
            // Assicurati che l'icona sia corretta
            const toggleIcon = elements.toggleButton.querySelector('i');
            if (toggleIcon) {
                toggleIcon.className = 'fas fa-bars';
            }
        } else {
            // Inizializza stato espanso su desktop (default)
            elements.sidebar.style.left = '';
            elements.sidebar.classList.remove('active', 'sidebar-collapsed');
            elements.toggleButton.style.display = 'none';
            
            // Assicurati che l'icona desktop sia corretta
            if (elements.desktopToggle) {
                const desktopIcon = elements.desktopToggle.querySelector('i');
                if (desktopIcon) {
                    desktopIcon.className = 'fas fa-bars';
                }
            }
        }
        
        /**
         * Apre la sidebar (funzionalità mobile)
         */
        function openSidebar() {
            console.log('[FIXED-SIDEBAR] Apertura sidebar (mobile)');
            
            // Applica le classi CSS
            elements.sidebar.classList.add('active');
            elements.overlay.classList.add('active');
            document.body.classList.add('sidebar-open');
            
            // Forza con stili diretti (più affidabile)
            elements.sidebar.style.left = '0';
            elements.overlay.style.display = 'block';
            
            // Aggiorna icona mobile
            const toggleIcon = elements.toggleButton.querySelector('i');
            if (toggleIcon) {
                toggleIcon.className = 'fas fa-times';
            }
            
            // Aggiorna icona desktop
            if (elements.desktopToggle) {
                const desktopIcon = elements.desktopToggle.querySelector('i');
                if (desktopIcon) {
                    desktopIcon.className = 'fas fa-times';
                }
            }
        }
        
        /**
         * Chiude la sidebar (funzionalità mobile)
         */
        function closeSidebar() {
            console.log('[FIXED-SIDEBAR] Chiusura sidebar (mobile)');
            
            // Rimuovi classi CSS
            elements.sidebar.classList.remove('active');
            elements.overlay.classList.remove('active');
            document.body.classList.remove('sidebar-open');
            
            // Assicurati che la sidebar non sia collassata in modalità mobile
            elements.sidebar.classList.remove('sidebar-collapsed');
            
            // Forza con stili diretti (più affidabile)
            elements.sidebar.style.left = '-280px';
            elements.overlay.style.display = 'none';
            
            // Aggiorna icona mobile
            const toggleIcon = elements.toggleButton.querySelector('i');
            if (toggleIcon) {
                toggleIcon.className = 'fas fa-bars';
            }
            
            // Aggiorna icona desktop
            if (elements.desktopToggle) {
                const desktopIcon = elements.desktopToggle.querySelector('i');
                if (desktopIcon) {
                    desktopIcon.className = 'fas fa-bars';
                }
            }
        }
        
        /**
         * Toggle della sidebar (funzionalità mobile)
         */
        function toggleMobileSidebar() {
            if (elements.sidebar.classList.contains('active')) {
                closeSidebar();
            } else {
                openSidebar();
            }
        }
        
        /**
         * Collassa/espandi la sidebar (funzionalità desktop)
         */
        function toggleDesktopSidebar() {
            console.log('[FIXED-SIDEBAR] Toggle desktop sidebar');
            
            // Solo su desktop
            if (window.innerWidth <= 768) {
                return toggleMobileSidebar();
            }
            
            // Toggle della classe sidebar-collapsed
            elements.sidebar.classList.toggle('sidebar-collapsed');
            
            // Aggiorna icona desktop
            if (elements.desktopToggle) {
                const desktopIcon = elements.desktopToggle.querySelector('i');
                if (desktopIcon) {
                    if (elements.sidebar.classList.contains('sidebar-collapsed')) {
                        desktopIcon.className = 'fas fa-expand';
                    } else {
                        desktopIcon.className = 'fas fa-bars';
                    }
                }
            }
            
            // Aggiusta il container principale se necessario
            if (elements.chatContainer) {
                if (elements.sidebar.classList.contains('sidebar-collapsed')) {
                    elements.chatContainer.style.marginLeft = '60px';
                    elements.chatContainer.style.width = 'calc(100% - 60px)';
                } else {
                    elements.chatContainer.style.marginLeft = '';
                    elements.chatContainer.style.width = '';
                }
            }
        }
        
        // Aggiungi event listeners per il pulsante mobile
        elements.toggleButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('[FIXED-SIDEBAR] Click sul pulsante mobile');
            toggleMobileSidebar();
        });
        
        // Aggiungi event listeners per il pulsante desktop
        if (elements.desktopToggle) {
            elements.desktopToggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('[FIXED-SIDEBAR] Click sul pulsante desktop');
                toggleDesktopSidebar();
            });
        }
        
        // Click sull'overlay chiude la sidebar
        elements.overlay.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('[FIXED-SIDEBAR] Click sull\'overlay');
            closeSidebar();
        });
        
        // Gestisci chiusura con Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && elements.sidebar.classList.contains('active')) {
                closeSidebar();
            }
        });
        
        // Gestisci resize della finestra
        window.addEventListener('resize', function() {
            const isMobileView = window.innerWidth <= 768;
            
            // Aggiorna visibilità pulsante mobile
            elements.toggleButton.style.display = isMobileView ? 'flex' : 'none';
            
            // Se passiamo da mobile a desktop
            if (!isMobileView) {
                // Rimuovi stile inline forzato
                elements.sidebar.style.left = '';
                elements.overlay.style.display = 'none';
                elements.sidebar.classList.remove('active');
                document.body.classList.remove('sidebar-open');
                
                // Mantieni lo stato di collasso se precedentemente impostato
                if (elements.chatContainer) {
                    if (elements.sidebar.classList.contains('sidebar-collapsed')) {
                        elements.chatContainer.style.marginLeft = '60px';
                        elements.chatContainer.style.width = 'calc(100% - 60px)';
                    }
                }
            } else {
                // Su mobile rimuovi sempre lo stato collasso
                elements.sidebar.classList.remove('sidebar-collapsed');
                
                // Ripristina i margini normali per il container
                if (elements.chatContainer) {
                    elements.chatContainer.style.marginLeft = '';
                    elements.chatContainer.style.width = '';
                }
            }
        });
        
        // Aggiungi gesture support per swipe
        let touchStartX = 0;
        let touchEndX = 0;
        const SWIPE_THRESHOLD = 70;
        
        document.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        document.addEventListener('touchend', function(e) {
            touchEndX = e.changedTouches[0].screenX;
            
            const swipeDiff = touchEndX - touchStartX;
            const isMobileView = window.innerWidth <= 768;
            
            if (isMobileView) {
                // Swipe da sinistra a destra (apertura)
                if (swipeDiff > SWIPE_THRESHOLD && !elements.sidebar.classList.contains('active')) {
                    openSidebar();
                }
                
                // Swipe da destra a sinistra (chiusura)
                if (swipeDiff < -SWIPE_THRESHOLD && elements.sidebar.classList.contains('active')) {
                    closeSidebar();
                }
            }
        }, { passive: true });
        
        // Esponi funzioni per debug
        window.fixedSidebar = {
            open: openSidebar,
            close: closeSidebar,
            toggle: toggleSidebar,
            elements: elements
        };
        
        console.log('[FIXED-SIDEBAR] Inizializzazione completata con successo');
        return true;
    }
})();
