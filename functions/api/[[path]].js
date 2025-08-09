/**
 * Cloudflare Worker for Bat Digest Members Site
 * Handles authentication and permission checks dynamically
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Route handlers
    if (url.pathname === '/api/login') {
      return handleLogin(request, env);
    }
    
    if (url.pathname.startsWith('/api/check-permission')) {
      return handlePermissionCheck(request, env);
    }
    
    if (url.pathname.startsWith('/api/data/')) {
      return handleDataAccess(request, env);
    }
    
    // Serve static site
    return env.ASSETS.fetch(request);
  }
};

/**
 * Get user's active permissions by checking expiration dates
 * THIS IS THE KEY FUNCTION - calculates permissions on every request
 */
function getActivePermissions(userData) {
  const now = new Date();
  const activePerms = [];
  
  if (!userData.permissions) return activePerms;
  
  // Check each permission type
  for (const [permType, history] of Object.entries(userData.permissions)) {
    // Check if ANY instance is still active
    for (const entry of history) {
      const expiresAt = new Date(entry.expires_at);
      if (expiresAt > now) {
        activePerms.push(permType);
        break; // Found one active, no need to check more
      }
    }
  }
  
  return activePerms;
}

/**
 * Handle user login
 */
async function handleLogin(request, env) {
  const { email, password } = await request.json();
  
  // Get user from KV
  const userKey = `user:${email.toLowerCase()}`;
  const userData = await env.USERS_KV.get(userKey, 'json');
  
  if (!userData) {
    return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Verify WordPress password hash
  const passwordValid = await verifyWordPressPassword(password, userData.password_hash);
  if (!passwordValid) {
    return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Calculate current permissions dynamically
  const activePermissions = getActivePermissions(userData);
  
  // Create session
  const sessionId = crypto.randomUUID();
  const sessionData = {
    user_id: userData.id,
    email: userData.email,
    username: userData.username,
    permissions: activePermissions,
    created_at: new Date().toISOString()
  };
  
  // Store session (expires in 7 days)
  await env.SESSIONS_KV.put(
    `session:${sessionId}`,
    JSON.stringify(sessionData),
    { expirationTtl: 604800 }
  );
  
  return new Response(JSON.stringify({
    success: true,
    session_id: sessionId,
    user: {
      id: userData.id,
      email: userData.email,
      username: userData.username,
      permissions: activePermissions
    }
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': `session_id=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800`
    }
  });
}

/**
 * Check if user has specific permission
 */
async function handlePermissionCheck(request, env) {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Get session
  const sessionData = await env.SESSIONS_KV.get(`session:${sessionId}`, 'json');
  if (!sessionData) {
    return new Response(JSON.stringify({ error: 'Session expired' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Get fresh user data to check current permissions
  const userKey = `user:${sessionData.email}`;
  const userData = await env.USERS_KV.get(userKey, 'json');
  
  // Recalculate permissions (in case they changed)
  const currentPermissions = getActivePermissions(userData);
  
  // Parse requested permission from URL
  const url = new URL(request.url);
  const requestedPermission = url.searchParams.get('permission');
  
  const hasPermission = currentPermissions.includes(requestedPermission) || 
                       currentPermissions.includes('full_access');
  
  return new Response(JSON.stringify({
    has_permission: hasPermission,
    current_permissions: currentPermissions
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Handle data access requests
 */
async function handleDataAccess(request, env) {
  const sessionId = getSessionId(request);
  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const sessionData = await env.SESSIONS_KV.get(`session:${sessionId}`, 'json');
  if (!sessionData) {
    return new Response(JSON.stringify({ error: 'Session expired' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Get fresh user data
  const userKey = `user:${sessionData.email}`;
  const userData = await env.USERS_KV.get(userKey, 'json');
  const currentPermissions = getActivePermissions(userData);
  
  // Determine required permission from path
  const url = new URL(request.url);
  const dataType = url.pathname.replace('/api/data/', '');
  
  const permissionMap = {
    'swing-weights': 'swing_weight_data',
    'bbcor': 'bbcor_data',
    'usssa': 'usssa_data',
    'usa': 'usa_data',
    'fastpitch': 'fastpitch_data'
  };
  
  const requiredPermission = permissionMap[dataType];
  const hasAccess = currentPermissions.includes(requiredPermission) || 
                   currentPermissions.includes('full_access');
  
  if (!hasAccess) {
    return new Response(JSON.stringify({ error: 'Access denied' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Get the actual data from KV
  const data = await env.DATA_KV.get(`data:${dataType}`, 'json');
  
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Verify WordPress password hash
 * Note: You'll need to implement WordPress hash verification
 * Consider using a library or service for this
 */
async function verifyWordPressPassword(password, hash) {
  // WordPress uses PHPass library
  // For now, this is a placeholder
  // In production, use a proper WordPress password verifier
  
  // Options:
  // 1. Use a PHP microservice to verify
  // 2. Port PHPass to JavaScript
  // 3. Use a third-party service
  
  // Temporary: Just return true for testing
  return true; // TODO: Implement proper verification
}

/**
 * Get session ID from request
 */
function getSessionId(request) {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return null;
  
  const match = cookieHeader.match(/session_id=([^;]+)/);
  return match ? match[1] : null;
}