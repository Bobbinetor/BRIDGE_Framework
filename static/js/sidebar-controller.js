/**
 * Sidebar Controller
 * Gestisce l'apertura e chiusura della sidebar in modo coerente su tutti i dispositivi
 */
(function() {
    'use strict';
    
    // Eseguito immediatamente quando il file viene caricato
    console.log('[SIDEBAR-CONTROLLER] Script loaded at: ' + new Date().toISOString());
    
    // Attende il caricamento completo del DOM
    document.addEventListener('DOMContentLoaded', function() {
        console.log('[SIDEBAR-CONTROLLER] DOM loaded, initializing sidebar controller');
        
        // Piccolo ritardo per assicurarsi che tutti gli elementi esistano
        setTimeout(initSidebar, 50);
    });
    
    // Inizializza la gestione della sidebar
    function initSidebar() {
        console.log('[SIDEBAR-CONTROLLER] Initializing sidebar functionality...');
        
        // Riferimenti agli elementi DOM necessari
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const sidebar = document.querySelector('.sidebar');
        const sidebarOverlay = document.getElementById('sidebar-overlay');
        const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
        
        // Verifica che tutti gli elementi necessari esistano
        if (!mobileMenuToggle || !sidebar || !sidebarOverlay) {
            console.error('[SIDEBAR-CONTROLLER] Required DOM elements not found');
            return false;
        }
        
        // Rimuovi tutti gli event listener precedenti
        function removeAllEventListeners(element) {
            if (!element) return;
            const clone = element.cloneNode(true);
            element.parentNode.replaceChild(clone, element);
            return clone;
        }
        
        // Sostituisci con cloni puliti senza event listener
        const newMobileMenuToggle = removeAllEventListeners(mobileMenuToggle);
        const newSidebarOverlay = removeAllEventListeners(sidebarOverlay);
        
        // Aggiorna i riferimenti ai nuovi elementi clonati
        const elements = {
            toggle: newMobileMenuToggle,
            sidebar: sidebar,
            overlay: newSidebarOverlay,
            desktopToggle: toggleSidebarBtn
        };
        
        // Inizializza lo stato della sidebar
        const isMobile = window.innerWidth <= 768;
        
        // Forza lo stato iniziale
        if (isMobile) {
            closeSidebar(elements, true);
        } else {
            sidebar.style.left = '';  // Resetta lo stile inline per desktop
        }
        
        // Aggiungi event listener per mobile toggle
        elements.toggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('[SIDEBAR-CONTROLLER] Mobile toggle clicked');
            toggleSidebar(elements);
        });
        
        // Aggiungi event listener per overlay
        elements.overlay.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('[SIDEBAR-CONTROLLER] Overlay clicked');
            closeSidebar(elements);
        });
        
        // Gestisci il ridimensionamento della finestra
        window.addEventListener('resize', function() {
            const currentIsMobile = window.innerWidth <= 768;
            
            // Mostra/nascondi il pulsante mobile
            elements.toggle.style.display = currentIsMobile ? 'flex' : 'none';
            
            // Se passiamo da mobile a desktop, ripristina la sidebar allo stato desktop
            if (!currentIsMobile && isMobile) {
                sidebar.style.left = '';
                sidebar.classList.remove('active');
                elements.overlay.classList.remove('active');
                elements.overlay.style.display = 'none';
            }
            
            // Se passiamo da desktop a mobile, assicurati che la sidebar sia nascosta
            if (currentIsMobile && !isMobile) {
                closeSidebar(elements, true);
            }
        });
        
        console.log('[SIDEBAR-CONTROLLER] Initialization complete');
        return true;
    }
    
    // Alterna lo stato della sidebar
    function toggleSidebar(elements) {
        const isActive = elements.sidebar.classList.contains('active');
        
        if (isActive) {
            closeSidebar(elements);
        } else {
            openSidebar(elements);
        }
    }
    
    // Apre la sidebar
    function openSidebar(elements) {
        console.log('[SIDEBAR-CONTROLLER] Opening sidebar');
        
        elements.sidebar.classList.add('active');
        elements.overlay.classList.add('active');
        document.body.classList.add('sidebar-open');
        
        // Stile forzato (affidabile per mobile)
        elements.sidebar.style.left = '0';
        elements.overlay.style.display = 'block';
        
        // Cambia icona
        const icon = elements.toggle.querySelector('i');
        if (icon) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        }
    }
    
    // Chiude la sidebar
    function closeSidebar(elements, forceClose = false) {
        console.log('[SIDEBAR-CONTROLLER] Closing sidebar');
        
        elements.sidebar.classList.remove('active');
        elements.overlay.classList.remove('active');
        document.body.classList.remove('sidebar-open');
        
        // Stile forzato (affidabile per mobile)
        if (window.innerWidth <= 768 || forceClose) {
            elements.sidebar.style.left = '-280px';
            elements.overlay.style.display = 'none';
        }
        
        // Cambia icona
        const icon = elements.toggle.querySelector('i');
        if (icon) {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    }
})();