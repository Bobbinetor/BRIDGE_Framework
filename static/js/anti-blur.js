/**
 * Anti-Blur Fix per dispositivi mobili
 * Questo script rimuove qualsiasi effetto blur che potrebbe causare problemi su dispositivi mobili
 * ed è eseguito il prima possibile per evitare effetti indesiderati
 */
(function() {
    // Esegui immediatamente
    console.log('[ANTI-BLUR] Applicazione immediata del fix anti-blur');
    
    // Funzione che rimuove effetti di blur su mobile
    function removeBlur() {
        if (window.innerWidth <= 768) {
            // CSS inserito direttamente per avere precedenza massima
            const style = document.createElement('style');
            style.textContent = `
                @media (max-width: 768px) {
                    /* Rimuovi qualsiasi filtro blur da tutti gli elementi */
                    * {
                        -webkit-backdrop-filter: none !important;
                        backdrop-filter: none !important;
                        -webkit-filter: none !important;
                        filter: none !important;
                    }
                    
                    /* Fix specifico per menu notifiche */
                    #notification-menu,
                    .notification-menu {
                        -webkit-backdrop-filter: none !important;
                        backdrop-filter: none !important;
                        -webkit-filter: none !important;
                        filter: none !important;
                        background-color: white !important;
                        z-index: 2000 !important;
                    }
                    
                    /* Fix specifico per overlay */
                    #notification-overlay,
                    .notification-overlay {
                        -webkit-backdrop-filter: none !important;
                        backdrop-filter: none !important;
                        -webkit-filter: none !important;
                        filter: none !important;
                        background-color: rgba(0, 0, 0, 0.6) !important;
                        z-index: 1999 !important;
                    }
                    
                    /* Assicura che il contenuto principale non abbia effetti */
                    body, 
                    .app-container,
                    .chat-container,
                    .sidebar {
                        -webkit-backdrop-filter: none !important;
                        backdrop-filter: none !important;
                        -webkit-filter: none !important;
                        filter: none !important;
                    }
                }
            `;
            document.head.appendChild(style);
            console.log('[ANTI-BLUR] Fix CSS iniettato');
        }
    }
    
    // Esegui immediatamente
    removeBlur();
    
    // Riesegui in diversi momenti per essere sicuri
    window.addEventListener('DOMContentLoaded', removeBlur);
    window.addEventListener('load', removeBlur);
    
    // In caso di cambio orientamento
    window.addEventListener('resize', function() {
        if (window.innerWidth <= 768) {
            removeBlur();
        }
    });
})();
