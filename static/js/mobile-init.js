/**
 * Mobile initialization script - ensures mobile elements are properly initialized
 * This runs before main.js to set up crucial mobile functionality
 */
(function() {
    // Function to initialize when DOM is loaded
    function setupMobileElements() {
        console.log('Mobile initialization script running');
        
        // Key elements for mobile UI
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const sidebar = document.querySelector('.sidebar');
        const sidebarOverlay = document.getElementById('sidebar-overlay');
        
        if (!mobileMenuToggle || !sidebar || !sidebarOverlay) {
            console.error('Mobile initialization: Required elements not found');
            return;
        }
        
        // Force correct display style on mobile
        if (window.innerWidth <= 768) {
            mobileMenuToggle.style.display = 'flex';
            
            // Make sure sidebar starts hidden on mobile
            sidebar.classList.remove('active');
            sidebar.style.left = '-280px';
            
            // Ensure the overlay starts hidden
            sidebarOverlay.classList.remove('active');
            sidebarOverlay.style.display = 'none';
        }
        
        // Add direct event listener (in addition to the one in mobile-fix.js)
        mobileMenuToggle.addEventListener('click', function(e) {
            console.log('Mobile menu toggle button clicked (from mobile-init.js)');
            e.stopPropagation();
            
            if (sidebar.classList.contains('active')) {
                // Close sidebar
                sidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
                sidebar.style.left = '-280px';
                sidebarOverlay.style.display = 'none';
                
                // Update icon
                const icon = this.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            } else {
                // Open sidebar
                sidebar.classList.add('active');
                sidebarOverlay.classList.add('active');
                sidebar.style.left = '0';
                sidebarOverlay.style.display = 'block';
                
                // Update icon
                const icon = this.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                }
            }
        });
    }
    
    // Set up when DOM content is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupMobileElements);
    } else {
        // DOM already loaded, run now
        setupMobileElements();
    }
    
    // Also set up resize handler
    window.addEventListener('resize', function() {
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        const sidebar = document.querySelector('.sidebar');
        
        if (window.innerWidth <= 768) {
            if (mobileMenuToggle) mobileMenuToggle.style.display = 'flex';
        } else {
            if (mobileMenuToggle) mobileMenuToggle.style.display = 'none';
            if (sidebar) sidebar.classList.remove('active');
        }
    });
})();
