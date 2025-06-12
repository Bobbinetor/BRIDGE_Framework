/**
 * Mobile sidebar fix - ensures the mobile sidebar toggle works correctly
 */
(function() {
    // Log debug info immediately
    console.log('[MOBILE-FIX] Script loaded at: ' + new Date().toISOString());
    
    // Execute after a short delay to ensure it runs after main.js
    document.addEventListener('DOMContentLoaded', function() {
        console.log('[MOBILE-FIX] DOM loaded, initializing mobile sidebar fix');
        
        // Forza un piccolo ritardo per assicurarci che tutti gli handler siano configurati
        setTimeout(function() {
        // Get required elements
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const sidebar = document.querySelector('.sidebar');
        const sidebarOverlay = document.getElementById('sidebar-overlay');
    
    if (!mobileMenuToggle || !sidebar || !sidebarOverlay) {
        console.error('Mobile menu elements not found in DOM');
        return;
    }

    console.log('Mobile sidebar fix script loaded');
    
    // Toggle sidebar function
    function toggleMobileSidebar() {
        console.log('Mobile sidebar toggle triggered');
        
        if (!sidebar.classList.contains('active')) {
            // Open sidebar
            sidebar.classList.add('active');
            sidebarOverlay.classList.add('active');
            document.body.classList.add('sidebar-open');
            
            // Forza la posizione con stile inline (più affidabile)
            sidebar.style.left = '0';
            sidebarOverlay.style.display = 'block';
            
            // Change icon to X
            const icon = mobileMenuToggle.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            }
        } else {
            // Close sidebar
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            document.body.classList.remove('sidebar-open');
            
            // Forza la posizione con stile inline (più affidabile)
            sidebar.style.left = '-280px';
            sidebarOverlay.style.display = 'none';
            
            // Change icon back to bars
            const icon = mobileMenuToggle.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        }
    }
    
    // Add event listeners
    mobileMenuToggle.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        toggleMobileSidebar();
    });
    
    sidebarOverlay.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        document.body.classList.remove('sidebar-open');
        
        const icon = mobileMenuToggle.querySelector('i');
        if (icon) {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });
    
    // Initialize mobile detection
    function checkMobile() {
        if (window.innerWidth <= 768) {
            mobileMenuToggle.style.display = 'flex';
        } else {
            mobileMenuToggle.style.display = 'none';
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        }
    }
    
    // Check on load
    checkMobile();
    
    // Check on resize
    window.addEventListener('resize', checkMobile);
    
    // Initial call to make sure it's set up properly
    checkMobile();
        }, 100); // 100ms delay ensures main.js has run
    });
})();
