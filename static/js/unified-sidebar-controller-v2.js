/**
 * Unified Sidebar Controller for both Mobile and Desktop
 * This script consolidates all sidebar functionality into one controller,
 * fixing the desktop toggle functionality while maintaining mobile compatibility
 * 
 * Version: 2.0 - Desktop Toggling Fix
 */
(function() {
    'use strict';
    
    // Debug log
    console.log('[UNIFIED-SIDEBAR] Loading unified sidebar controller v2.0');
    
    // Wait for DOM to be fully loaded
    document.addEventListener('DOMContentLoaded', function() {
        console.log('[UNIFIED-SIDEBAR] DOM loaded, initializing sidebar controller');
        
        // Small delay to ensure all elements exist
        setTimeout(initUnifiedSidebarController, 200);
    });
    
    /**
     * Initialize the unified sidebar controller
     */
    function initUnifiedSidebarController() {
        // Core elements
        const elements = {
            sidebar: document.querySelector('.sidebar'),
            overlay: document.getElementById('sidebar-overlay'),
            mobileToggle: document.getElementById('mobile-menu-toggle'),
            desktopToggle: document.getElementById('toggle-sidebar-btn'),
            chatContainer: document.querySelector('.chat-container')
        };
        
        // Check if required elements exist
        if (!elements.sidebar || !elements.overlay || !elements.mobileToggle || !elements.desktopToggle) {
            console.error('[UNIFIED-SIDEBAR] Required elements not found');
            return false;
        }
        
        console.log('[UNIFIED-SIDEBAR] All elements found, initializing controller');
        
        // Remove existing event listeners by cloning elements
        function cleanElement(element) {
            if (!element || !element.parentNode) return element;
            const clone = element.cloneNode(true);
            element.parentNode.replaceChild(clone, element);
            return clone;
        }
        
        // Clean all elements
        elements.mobileToggle = cleanElement(elements.mobileToggle);
        elements.overlay = cleanElement(elements.overlay);
        elements.desktopToggle = cleanElement(elements.desktopToggle); 
        
        // Determine device type
        const isMobile = window.innerWidth <= 768;
        
        /**
         * Set initial state based on device type
         */
        function setInitialState() {
            if (isMobile) {
                // On mobile: hide sidebar, show mobile toggle
                elements.sidebar.classList.remove('active', 'sidebar-collapsed');
                elements.sidebar.style.left = '-280px';
                elements.overlay.classList.remove('active');
                elements.overlay.style.display = 'none';
                elements.mobileToggle.style.display = 'flex';
                
                // Ensure mobile toggle icon is correct
                const mobileIcon = elements.mobileToggle.querySelector('i');
                if (mobileIcon) {
                    mobileIcon.className = 'fas fa-bars';
                }
            } else {
                // On desktop: sidebar visible, hide mobile toggle, keep sidebar state
                elements.sidebar.style.left = '';
                elements.overlay.style.display = 'none';
                elements.mobileToggle.style.display = 'none';
                
                // Update desktop toggle icon based on sidebar state
                updateDesktopToggleIcon();
            }
        }
        
        /**
         * Toggle sidebar on mobile (open/close)
         */
        function toggleMobileSidebar() {
            console.log('[UNIFIED-SIDEBAR] Toggle mobile sidebar');
            
            if (elements.sidebar.classList.contains('active')) {
                closeMobileSidebar();
            } else {
                openMobileSidebar();
            }
        }
        
        /**
         * Open sidebar on mobile
         */
        function openMobileSidebar() {
            console.log('[UNIFIED-SIDEBAR] Opening mobile sidebar');
            
            // Add active classes
            elements.sidebar.classList.add('active');
            elements.overlay.classList.add('active');
            document.body.classList.add('sidebar-open');
            
            // Force proper positioning with inline styles
            elements.sidebar.style.left = '0';
            elements.overlay.style.display = 'block';
            
            // Update mobile toggle icon
            const mobileIcon = elements.mobileToggle.querySelector('i');
            if (mobileIcon) {
                mobileIcon.className = 'fas fa-times';
            }
            
            // Also update desktop toggle icon
            const desktopIcon = elements.desktopToggle.querySelector('i');
            if (desktopIcon) {
                desktopIcon.className = 'fas fa-times';
            }
        }
        
        /**
         * Close sidebar on mobile
         */
        function closeMobileSidebar() {
            console.log('[UNIFIED-SIDEBAR] Closing mobile sidebar');
            
            // Remove active classes
            elements.sidebar.classList.remove('active');
            elements.overlay.classList.remove('active');
            document.body.classList.remove('sidebar-open');
            
            // Force proper positioning with inline styles
            elements.sidebar.style.left = '-280px';
            elements.overlay.style.display = 'none';
            
            // Update mobile toggle icon
            const mobileIcon = elements.mobileToggle.querySelector('i');
            if (mobileIcon) {
                mobileIcon.className = 'fas fa-bars';
            }
            
            // Also update desktop toggle icon
            const desktopIcon = elements.desktopToggle.querySelector('i');
            if (desktopIcon) {
                desktopIcon.className = 'fas fa-bars';
            }
        }
        
        /**
         * Toggle sidebar on desktop (collapse/expand)
         */
        function toggleDesktopSidebar() {
            console.log('[UNIFIED-SIDEBAR] Toggle desktop sidebar');
            
            // On mobile, delegate to mobile toggle
            if (window.innerWidth <= 768) {
                return toggleMobileSidebar();
            }
            
            // Toggle collapsed state
            elements.sidebar.classList.toggle('sidebar-collapsed');
            
            // Update desktop toggle icon
            updateDesktopToggleIcon();
            
            // Adjust chat container margins
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
        
        /**
         * Update desktop toggle icon based on sidebar state
         */
        function updateDesktopToggleIcon() {
            const desktopIcon = elements.desktopToggle.querySelector('i');
            if (!desktopIcon) return;
            
            // On mobile view
            if (window.innerWidth <= 768) {
                if (elements.sidebar.classList.contains('active')) {
                    desktopIcon.className = 'fas fa-times';
                } else {
                    desktopIcon.className = 'fas fa-bars';
                }
                return;
            }
            
            // On desktop view
            if (elements.sidebar.classList.contains('sidebar-collapsed')) {
                desktopIcon.className = 'fas fa-expand';
            } else {
                desktopIcon.className = 'fas fa-bars';
            }
        }
        
        // Add event listeners
        elements.mobileToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('[UNIFIED-SIDEBAR] Mobile toggle clicked');
            toggleMobileSidebar();
        });
        
        elements.desktopToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('[UNIFIED-SIDEBAR] Desktop toggle clicked');
            toggleDesktopSidebar();
        });
        
        // Click on overlay closes sidebar
        elements.overlay.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('[UNIFIED-SIDEBAR] Overlay clicked');
            closeMobileSidebar();
        });
        
        // Close sidebar with Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && elements.sidebar.classList.contains('active')) {
                closeMobileSidebar();
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', function() {
            const isMobileNow = window.innerWidth <= 768;
            
            // Update mobile toggle visibility
            elements.mobileToggle.style.display = isMobileNow ? 'flex' : 'none';
            
            // If transitioning from mobile to desktop
            if (!isMobileNow) {
                // Remove mobile-specific styles
                elements.sidebar.style.left = '';
                elements.overlay.style.display = 'none';
                elements.sidebar.classList.remove('active');
                document.body.classList.remove('sidebar-open');
                
                // Keep desktop collapsed state
                updateDesktopToggleIcon();
            } else {
                // On mobile, reset the collapsed state
                elements.sidebar.classList.remove('sidebar-collapsed');
                
                // Reset chat container margins
                if (elements.chatContainer) {
                    elements.chatContainer.style.marginLeft = '';
                    elements.chatContainer.style.width = '';
                }
            }
        });
        
        // Add swipe gestures for mobile
        if ('ontouchstart' in window) {
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
                    // Swipe right to open
                    if (swipeDiff > SWIPE_THRESHOLD && !elements.sidebar.classList.contains('active')) {
                        openMobileSidebar();
                    }
                    
                    // Swipe left to close
                    if (swipeDiff < -SWIPE_THRESHOLD && elements.sidebar.classList.contains('active')) {
                        closeMobileSidebar();
                    }
                }
            }, { passive: true });
        }
        
        // Set initial state
        setInitialState();
        
        // Expose functions for debugging
        window.unifiedSidebar = {
            toggle: {
                mobile: toggleMobileSidebar,
                desktop: toggleDesktopSidebar
            },
            open: openMobileSidebar,
            close: closeMobileSidebar,
            elements: elements
        };
        
        console.log('[UNIFIED-SIDEBAR] Initialization complete');
        return true;
    }
})();
