// Authentication handler
const API_BASE = '/api';

async function login(email, password) {
    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = '/dashboard/';
        } else {
            throw new Error(data.error || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError(error.message);
    }
}

function logout() {
    localStorage.removeItem('user');
    document.cookie = 'session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    window.location.href = '/';
}

function showError(message) {
    const errorDiv = document.getElementById('error-message') || 
                    document.querySelector('.alert-danger');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
}

// Setup login form
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm') || 
                     document.querySelector('form[action*="login"]');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginForm.querySelector('input[name="email"]').value;
            const password = loginForm.querySelector('input[name="password"]').value;
            await login(email, password);
        });
    }
    
    // Setup logout buttons
    const logoutBtns = document.querySelectorAll('[data-logout], #logout-btn, .logout-btn');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    });
});