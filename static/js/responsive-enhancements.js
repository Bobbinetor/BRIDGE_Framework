/**
 * Miglioramenti responsivi generali per BRIDGE Framework
 * Ottimizza elementi dell'interfaccia per diverse dimensioni dello schermo
 */
(function() {
    // Attendere il caricamento completo del DOM
    document.addEventListener('DOMContentLoaded', function() {
        console.log('[RESPONSIVE] Script di miglioramento responsive caricato');
        
        // Ottimizza la dimensione dei modali dinamicamente
        adjustModalSizes();
        
        // Si adatta ai cambiamenti della finestra
        window.addEventListener('resize', function() {
            adjustModalSizes();
            adjustFormLayouts();
        });
        
        // Applica miglioramenti ai form
        adjustFormLayouts();
        
        // Aggiunge gesture touch per la sidebar su dispositivi mobili
        enableTouchGestures();
        
        // Correzioni per l'input di messaggi
        optimizeMessageInput();
    });
    
    /**
     * Aggiusta le dimensioni dei modali in base alle dimensioni dello schermo
     */
    function adjustModalSizes() {
        const modals = document.querySelectorAll('.modal-content');
        const windowWidth = window.innerWidth;
        
        modals.forEach(modal => {
            if (windowWidth <= 480) {
                modal.style.width = '95%';
                modal.style.maxWidth = 'none';
                modal.style.padding = '15px';
            } else if (windowWidth <= 768) {
                modal.style.width = '85%';
                modal.style.maxWidth = '450px';
                modal.style.padding = '20px';
            } else {
                // Ripristina i valori di default per schermi più grandi
                modal.style.width = '';
                modal.style.maxWidth = '';
                modal.style.padding = '';
            }
        });
    }
    
    /**
     * Adatta i layout dei form per ottimizzare lo spazio su schermi piccoli
     */
    function adjustFormLayouts() {
        const windowWidth = window.innerWidth;
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            const gridElements = form.querySelectorAll('[style*="grid-template-columns"]');
            
            gridElements.forEach(gridEl => {
                if (windowWidth <= 480) {
                    // Converti layout griglia in colonna singola
                    if (!gridEl.dataset.originalStyle) {
                        gridEl.dataset.originalStyle = gridEl.getAttribute('style');
                    }
                    gridEl.style.display = 'flex';
                    gridEl.style.flexDirection = 'column';
                } else if (gridEl.dataset.originalStyle) {
                    // Ripristina lo stile originale quando lo schermo è più grande
                    gridEl.setAttribute('style', gridEl.dataset.originalStyle);
                }
            });
        });
    }
    
    /**
     * Abilita le gesture touch per la navigazione della sidebar
     */
    function enableTouchGestures() {
        const sidebar = document.querySelector('.sidebar');
        const sidebarOverlay = document.getElementById('sidebar-overlay');
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        
        if (!sidebar || !sidebarOverlay) return;
        
        let touchStartX = 0;
        let touchEndX = 0;
        
        // Rileva swipe per aprire la sidebar (da sinistra a destra)
        document.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        document.addEventListener('touchend', function(e) {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });
        
        function handleSwipe() {
            const swipeDistance = touchEndX - touchStartX;
            const windowWidth = window.innerWidth;
            
            // Solo per mobile
            if (windowWidth > 768) return;
            
            // Gesture da sinistra a destra (vicino al bordo) per aprire la sidebar
            if (touchStartX < 30 && swipeDistance > 100) {
                openSidebar();
            }
            
            // Gesture da destra a sinistra quando la sidebar è aperta
            if (sidebar.classList.contains('active') && swipeDistance < -50) {
                closeSidebar();
            }
        }
        
        function openSidebar() {
            sidebar.classList.add('active');
            sidebar.style.left = '0';
            sidebarOverlay.classList.add('active');
            sidebarOverlay.style.display = 'block';
            document.body.classList.add('sidebar-open');
            
            const icon = mobileMenuToggle?.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            }
        }
        
        function closeSidebar() {
            sidebar.classList.remove('active');
            sidebar.style.left = '-280px';
            sidebarOverlay.classList.remove('active');
            sidebarOverlay.style.display = 'none';
            document.body.classList.remove('sidebar-open');
            
            const icon = mobileMenuToggle?.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        }
    }
    
    /**
     * Ottimizza l'input dei messaggi per dispositivi mobili
     */
    function optimizeMessageInput() {
        const messageInput = document.getElementById('message-input');
        const messageForm = document.getElementById('message-form');
        
        if (messageInput && messageForm) {
            // Su schermi piccoli, ridimensiona l'area di input durante la digitazione
            messageInput.addEventListener('focus', function() {
                if (window.innerWidth <= 480) {
                    messageInput.style.minHeight = '80px';
                }
            });
            
            messageInput.addEventListener('blur', function() {
                if (window.innerWidth <= 480) {
                    messageInput.style.minHeight = '';
                }
            });
            
            // Aggiungi padding alla fine dei messaggi quando la tastiera è aperta
            messageInput.addEventListener('focus', function() {
                if (window.innerWidth <= 768) {
                    const messagesContainer = document.getElementById('messages-container');
                    if (messagesContainer) {
                        messagesContainer.style.paddingBottom = '250px';
                        setTimeout(() => {
                            messagesContainer.scrollTop = messagesContainer.scrollHeight;
                        }, 100);
                    }
                }
            });
            
            messageInput.addEventListener('blur', function() {
                if (window.innerWidth <= 768) {
                    const messagesContainer = document.getElementById('messages-container');
                    if (messagesContainer) {
                        messagesContainer.style.paddingBottom = '';
                    }
                }
            });
        }
    }
})();
