/**
 * Notification Icon Fix
 * This script ensures the notification icon displays correctly and is clickable on all devices
 */
(function() {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('[NOTIFICATION-FIX] Loading notification icon fixes');
        
        // Get key DOM elements
        const notificationBell = document.getElementById('notification-bell');
        const notificationMenu = document.getElementById('notification-menu');
        let notificationOverlay = document.getElementById('notification-overlay');
        
        // Validate essential elements
        if (!notificationBell) {
            console.error('[NOTIFICATION-FIX] Notification bell not found');
            return;
        }
        
        if (!notificationMenu) {
            console.error('[NOTIFICATION-FIX] Notification menu not found');
            return;
        }
        
        // Create overlay if it doesn't exist
        if (!notificationOverlay) {
            notificationOverlay = document.createElement('div');
            notificationOverlay.id = 'notification-overlay';
            notificationOverlay.className = 'notification-overlay';
            document.body.appendChild(notificationOverlay);
        }
        
        // Reset any existing event handlers to prevent conflicts
        const newBell = notificationBell.cloneNode(true);
        if (notificationBell.parentNode) {
            notificationBell.parentNode.replaceChild(newBell, notificationBell);
        }
        
        // Fix for notification bell icon display
        const bellIcon = newBell.querySelector('i');
        if (bellIcon) {
            bellIcon.style.display = 'inline-block';
            bellIcon.style.pointerEvents = 'none'; // Ensure icon doesn't capture clicks
        }
        
        // Enhance notification bell click handler
        newBell.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('[NOTIFICATION-FIX] Notification bell clicked');
            
            const isMenuActive = notificationMenu.classList.contains('active');
            
            if (isMenuActive) {
                // Close menu
                notificationMenu.classList.remove('active');
                notificationOverlay.style.display = 'none';
                console.log('[NOTIFICATION-FIX] Notification menu closed');
            } else {
                // Open menu
                notificationMenu.classList.add('active');
                notificationMenu.style.display = 'block';
                
                // Adjust position based on device
                if (window.innerWidth <= 768) {
                    const headerHeight = document.querySelector('.chat-header')?.offsetHeight || 60;
                    notificationMenu.style.top = headerHeight + 'px';
                    notificationOverlay.style.display = 'block';
                }
                
                console.log('[NOTIFICATION-FIX] Notification menu opened');
            }
        });
        
        // Close menu when clicking outside
        notificationOverlay.addEventListener('click', function() {
            notificationMenu.classList.remove('active');
            notificationOverlay.style.display = 'none';
        });
        
        // Close menu when clicking outside (desktop)
        document.addEventListener('click', function(e) {
            if (notificationMenu.classList.contains('active') &&
                !notificationMenu.contains(e.target) &&
                e.target !== newBell) {
                
                notificationMenu.classList.remove('active');
                notificationOverlay.style.display = 'none';
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', function() {
            if (notificationMenu.classList.contains('active')) {
                if (window.innerWidth <= 768) {
                    const headerHeight = document.querySelector('.chat-header')?.offsetHeight || 60;
                    notificationMenu.style.top = headerHeight + 'px';
                    notificationOverlay.style.display = 'block';
                } else {
                    notificationOverlay.style.display = 'none';
                }
            }
        });
        
        console.log('[NOTIFICATION-FIX] Notification fixes initialized');
    });
})();
