/**
 * Enhanced Mobile Interaction
 * Questo script migliora l'interazione su dispositivi mobili 
 * con animazioni più fluide e una migliore gestione degli eventi touch
 */
(function() {
    // Esegui quando il DOM è pronto
    document.addEventListener('DOMContentLoaded', function() {
        console.log('[MOBILE-ENHANCED] Inizializzando miglioramenti interattivi per mobile');
        
        // Elementi principali
        const sidebar = document.querySelector('.sidebar');
        const sidebarOverlay = document.getElementById('sidebar-overlay');
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const chatContainer = document.querySelector('.chat-container');
        const messageInput = document.getElementById('message-input');
        
        // Verifica se siamo su mobile
        const isMobile = window.innerWidth <= 768;
        
        if (!sidebar || !sidebarOverlay || !mobileMenuToggle) {
            console.error('[MOBILE-ENHANCED] Elementi principali non trovati');
            return;
        }
        
        // Miglioramento 1: Gesture per aprire/chiudere la sidebar
        let touchStartX = 0;
        let touchEndX = 0;
        let isSwiping = false;
        
        // Gestione swipe per aprire la sidebar
        document.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
            isSwiping = true;
        }, { passive: true });
        
        document.addEventListener('touchmove', function(e) {
            if (!isSwiping) return;
            
            const currentX = e.changedTouches[0].screenX;
            const diffX = currentX - touchStartX;
            
            // Se stiamo swipando da sinistra a destra vicino al bordo sinistro
            if (touchStartX < 30 && diffX > 30) {
                // Apertura progressiva della sidebar basata sul movimento
                const progress = Math.min(diffX / 200, 1); // Max 1
                sidebar.style.left = `${-280 + (280 * progress)}px`;
                sidebarOverlay.style.display = 'block';
                sidebarOverlay.style.opacity = progress * 0.5; // Max 0.5 opacity
            }
            
            // Se la sidebar è aperta e stiamo swipando da destra a sinistra
            if (sidebar.classList.contains('active') && diffX < -30) {
                const progress = Math.min(Math.abs(diffX) / 200, 1);
                sidebar.style.left = `${-280 * progress}px`;
                sidebarOverlay.style.opacity = 0.5 - progress * 0.5;
            }
        }, { passive: true });
        
        document.addEventListener('touchend', function(e) {
            if (!isSwiping) return;
            
            touchEndX = e.changedTouches[0].screenX;
            const diffX = touchEndX - touchStartX;
            
            // Se è uno swipe sufficiente da sinistra a destra vicino al bordo
            if (touchStartX < 30 && diffX > 80) {
                sidebar.style.left = '0px';
                sidebar.classList.add('active');
                sidebarOverlay.classList.add('active');
                sidebarOverlay.style.display = 'block';
                sidebarOverlay.style.opacity = '0.5';
            }
            
            // Se la sidebar è aperta e swipiamo abbastanza da destra a sinistra
            if (sidebar.classList.contains('active') && diffX < -80) {
                sidebar.style.left = '-280px';
                sidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
                setTimeout(() => {
                    sidebarOverlay.style.display = 'none';
                }, 300);
            }
            
            // Reset dello stato e ritorno alla posizione originale se lo swipe non è sufficiente
            if ((touchStartX < 30 && diffX > 0 && diffX <= 80) || 
                (sidebar.classList.contains('active') && diffX < 0 && diffX >= -80)) {
                if (sidebar.classList.contains('active')) {
                    sidebar.style.left = '0px';
                    sidebarOverlay.style.opacity = '0.5';
                } else {
                    sidebar.style.left = '-280px';
                    sidebarOverlay.style.opacity = '0';
                    setTimeout(() => {
                        sidebarOverlay.style.display = 'none';
                    }, 300);
                }
            }
            
            isSwiping = false;
        }, { passive: true });
        
        // Miglioramento 2: Tap feedback migliorato
        const addTapFeedback = function(elements) {
            if (!elements || !elements.length) return;
            
            elements.forEach(el => {
                el.addEventListener('touchstart', function() {
                    this.classList.add('touch-active');
                }, { passive: true });
                
                el.addEventListener('touchend', function() {
                    this.classList.remove('touch-active');
                }, { passive: true });
                
                el.addEventListener('touchcancel', function() {
                    this.classList.remove('touch-active');
                }, { passive: true });
            });
        };
        
        // Applica il feedback a tutti i pulsanti e elementi interattivi
        addTapFeedback(document.querySelectorAll('button, .action-btn, .chat-item'));
        
        // Miglioramento 3: Nascondi la tastiera quando si scorre la lista messaggi
        if (chatContainer && messageInput) {
            chatContainer.addEventListener('touchstart', function(e) {
                // Nascondi la tastiera solo se stiamo toccando la conversazione, non l'input
                if (e.target !== messageInput && !messageInput.contains(e.target)) {
                    messageInput.blur();
                }
            }, { passive: true });
        }
        
        // Miglioramento 4: Scorrimento elastico delle liste
        const addElasticScrolling = function(container) {
            if (!container) return;
            
            let startY = 0;
            let startScrollTop = 0;
            let momentum = 0;
            
            container.addEventListener('touchstart', function(e) {
                startY = e.touches[0].pageY;
                startScrollTop = container.scrollTop;
                momentum = 0;
            }, { passive: true });
            
            container.addEventListener('touchmove', function(e) {
                const currentY = e.touches[0].pageY;
                const diff = currentY - startY;
                momentum = diff * 0.1;
            }, { passive: true });
            
            container.addEventListener('touchend', function() {
                if (Math.abs(momentum) > 5) {
                    const scrollInterval = setInterval(() => {
                        container.scrollTop -= momentum;
                        momentum *= 0.9;
                        
                        if (Math.abs(momentum) < 0.5) {
                            clearInterval(scrollInterval);
                        }
                    }, 16);
                }
            }, { passive: true });
        };
        
        // Applica lo scorrimento elastico alle liste principali
        if (document.querySelector('.messages-container')) {
            addElasticScrolling(document.querySelector('.messages-container'));
        }
        
        if (document.querySelector('.chat-list')) {
            addElasticScrolling(document.querySelector('.chat-list'));
        }
        
        // Miglioramento 5: Animazione fluida apertura/chiusura sidebar
        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', function() {
                if (sidebar.classList.contains('active')) {
                    // Chiudi la sidebar con animazione
                    sidebar.style.transition = 'all 0.3s cubic-bezier(0.19, 1, 0.22, 1)';
                    sidebar.style.left = '-280px';
                    sidebarOverlay.style.opacity = '0';
                    
                    setTimeout(() => {
                        sidebar.classList.remove('active');
                        sidebarOverlay.classList.remove('active');
                        sidebarOverlay.style.display = 'none';
                    }, 300);
                } else {
                    // Apri la sidebar con animazione
                    sidebar.style.transition = 'all 0.3s cubic-bezier(0.19, 1, 0.22, 1)';
                    sidebar.style.left = '0';
                    sidebar.classList.add('active');
                    sidebarOverlay.classList.add('active');
                    sidebarOverlay.style.display = 'block';
                    
                    setTimeout(() => {
                        sidebarOverlay.style.opacity = '0.5';
                    }, 10);
                }
            });
        }
        
        console.log('[MOBILE-ENHANCED] Miglioramenti interattivi per mobile inizializzati');
    });
})();
