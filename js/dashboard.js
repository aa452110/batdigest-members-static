// Dashboard handler
document.addEventListener('DOMContentLoaded', async function() {
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!user) {
        window.location.href = '/login.html';
        return;
    }
    
    // Update user info
    const usernameEl = document.getElementById('username') || 
                       document.querySelector('.username');
    const emailEl = document.getElementById('user-email') || 
                    document.querySelector('.user-email');
    
    if (usernameEl) usernameEl.textContent = user.username || user.email;
    if (emailEl) emailEl.textContent = user.email;
    
    // Display permissions
    displayPermissions(user.permissions || []);
});

function displayPermissions(permissions) {
    const container = document.getElementById('permission-list') || 
                     document.querySelector('.permissions-list');
    
    if (!container) return;
    
    if (permissions.length === 0) {
        container.innerHTML = '<p>No active permissions</p>';
        return;
    }
    
    const permissionNames = {
        'full_access': 'Full Data Access',
        'swing_weight_data': 'Swing Weight Data',
        'bbcor_data': 'BBCOR Data',
        'usssa_data': 'USSSA Data',
        'usa_data': 'USA Data',
        'fastpitch_data': 'Fastpitch Data'
    };
    
    permissions.forEach(perm => {
        const item = document.createElement('div');
        item.className = 'permission-item';
        item.textContent = permissionNames[perm] || perm;
        container.appendChild(item);
    });
}