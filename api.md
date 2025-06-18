

```simple-chat/BACKEND_API_SPECIFICATION.md#L1-450
# 🔥➡️🏗️ Firebase to Custom Backend Migration Guide

## Overview
This document provides the complete API specification for replacing Firebase Authentication and Firestore with a custom backend using JWT tokens. Your backend should implement all these endpoints to ensure seamless migration from Firebase.

## 🔑 Authentication & JWT Setup

### JWT Token Structure
```json
{
  "userId": "user_unique_id",
  "email": "user@example.com",
  "name": "User Name",
  "iat": 1609459200,
  "exp": 1609545600,
  "jti": "unique_token_id"
}
```

### Token Management
- **Access Token Expiration:** 24 hours
- **Refresh Token Expiration:** 30 days
- **Token Blacklist:** Required for logout functionality
- **Automatic Refresh:** Implement sliding session approach

### Security Headers
All protected endpoints require:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

---

## 📋 Required Database Schema

### Users Table
```sql
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Refresh Tokens Table
```sql
CREATE TABLE refresh_tokens (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP,
    is_revoked BOOLEAN DEFAULT FALSE,
    device_info TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Blacklisted Tokens Table
```sql
CREATE TABLE blacklisted_tokens (
    id VARCHAR(255) PRIMARY KEY,
    jti VARCHAR(255) UNIQUE NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    blacklisted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason VARCHAR(100) DEFAULT 'logout',
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Chats Table
```sql
CREATE TABLE chats (
    id VARCHAR(255) PRIMARY KEY,
    user1_id VARCHAR(255) NOT NULL,
    user2_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_for JSON DEFAULT '[]',
    FOREIGN KEY (user1_id) REFERENCES users(id),
    FOREIGN KEY (user2_id) REFERENCES users(id)
);
```

### Messages Table
```sql
CREATE TABLE messages (
    id VARCHAR(255) PRIMARY KEY,
    chat_id VARCHAR(255) NOT NULL,
    sender_id VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_by JSON DEFAULT '[]',
    FOREIGN KEY (chat_id) REFERENCES chats(id),
    FOREIGN KEY (sender_id) REFERENCES users(id)
);
```

### Password Reset Tokens Table
```sql
CREATE TABLE password_reset_tokens (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 🚪 Authentication Endpoints

### 1. User Registration
**POST** `/api/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Error Responses:**
- **409 Conflict** - Email already exists
- **400 Bad Request** - Invalid email format or weak password
- **422 Unprocessable Entity** - Username already taken

### 2. User Login
**POST** `/api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Error Responses:**
- **401 Unauthorized** - Invalid credentials
- **429 Too Many Requests** - Rate limiting

### 3. User Logout
**POST** `/api/auth/logout`
**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Backend Actions:**
1. Add access token's `jti` to blacklist table
2. Mark refresh token as revoked in database
3. Clean up expired blacklisted tokens (housekeeping)

**Error Responses:**
- **401 Unauthorized** - Invalid access token
- **400 Bad Request** - Missing refresh token

### 4. Token Refresh
**POST** `/api/auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400
}
```

**Backend Logic:**
1. Validate refresh token from database
2. Check if refresh token is not revoked and not expired
3. Generate new access token and refresh token
4. Update `last_used` timestamp for refresh token
5. Return new tokens

**Error Responses:**
- **401 Unauthorized** - Invalid, expired, or revoked refresh token
- **403 Forbidden** - Refresh token not found

### 5. Password Reset Request
**POST** `/api/auth/forgot-password`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

**Important:** Send email with reset link: `https://mylovelyserver.fun/chatapp/reset-password?oobCode={reset_token}`

### 6. Password Reset Confirmation
**POST** `/api/auth/reset-password`

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "newPassword": "newSecurePassword456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password has been reset successfully"
}
```

**Backend Actions:**
1. Reset password
2. Revoke ALL refresh tokens for this user (force logout from all devices)
3. Add ALL active access tokens to blacklist

**Error Responses:**
- **400 Bad Request** - Invalid or expired token
- **422 Unprocessable Entity** - Weak password

---

## 🛡️ Token Validation Middleware

### JWT Validation Process
For every protected endpoint, validate tokens in this order:

1. **Extract Token:** Get JWT from `Authorization: Bearer <token>` header
2. **Verify Signature:** Validate JWT signature and structure
3. **Check Expiration:** Ensure token is not expired
4. **Check Blacklist:** Verify token's `jti` is not in blacklist table
5. **Load User:** Fetch user data and attach to request context

### Automatic Token Refresh Logic (Frontend)
```javascript
// Pseudo-code for frontend token management
const API_REQUEST_INTERCEPTOR = async (request) => {
  const accessToken = getStoredAccessToken();
  const refreshToken = getStoredRefreshToken();

  // Check if access token expires in next 5 minutes
  if (isTokenExpiringSoon(accessToken)) {
    try {
      const response = await refreshTokens(refreshToken);
      setStoredTokens(response.accessToken, response.refreshToken);
      request.headers.Authorization = `Bearer ${response.accessToken}`;
    } catch (error) {
      // Refresh failed, redirect to login
      redirectToLogin();
      return;
    }
  }

  request.headers.Authorization = `Bearer ${accessToken}`;
  return request;
};

const API_RESPONSE_INTERCEPTOR = async (error) => {
  if (error.status === 401 && error.data.error.code === 'TOKEN_EXPIRED') {
    // Try to refresh token automatically
    const refreshToken = getStoredRefreshToken();
    try {
      const response = await refreshTokens(refreshToken);
      setStoredTokens(response.accessToken, response.refreshToken);
      // Retry original request with new token
      return retryRequest(error.config, response.accessToken);
    } catch (refreshError) {
      redirectToLogin();
    }
  }
  throw error;
};
```

---

## 👥 User Management Endpoints

### 7. Get Current User Profile
**GET** `/api/users/me`
**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### 8. Search Users
**GET** `/api/users/search?q={search_query}`
**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "success": true,
  "users": [
    {
      "id": "user_456",
      "email": "jane@example.com",
      "name": "Jane Smith"
    },
    {
      "id": "user_789",
      "email": "bob@example.com",
      "name": "Bob Johnson"
    }
  ]
}
```

**Notes:** Search should match against both `name` and `email` fields (case-insensitive)

---

## 💬 Chat Management Endpoints

### 9. Get Chat List
**GET** `/api/chats`
**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "success": true,
  "chats": [
    {
      "id": "chat_abc123",
      "partner": {
        "id": "user_456",
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      "lastMessage": {
        "id": "msg_xyz789",
        "text": "See you tomorrow!",
        "senderId": "user_456",
        "timestamp": "2024-01-15T10:30:00Z"
      },
      "unreadCount": 3,
      "createdAt": "2024-01-10T08:00:00Z"
    }
  ]
}
```

**Notes:**
- Only return chats where current user is NOT in the `deleted_for` array
- Sort by most recent message timestamp
- Calculate unread count based on messages where current user is NOT in `read_by` array

### 10. Create or Get Existing Chat
**POST** `/api/chats`
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "partnerId": "user_456"
}
```

**Success Response (200 or 201):**
```json
{
  "success": true,
  "chat": {
    "id": "chat_abc123",
    "users": ["user_123", "user_456"],
    "createdAt": "2024-01-10T08:00:00Z"
  }
}
```

**Chat ID Generation Logic:**
```javascript
// Always generate deterministic chat ID by sorting user IDs
const chatId = [currentUserId, partnerId].sort().join('_');
```

**Special Cases:**
- If chat exists but current user is in `deleted_for`, remove user from `deleted_for` array
- Return existing chat if already exists

### 11. Soft Delete Chat
**DELETE** `/api/chats/{chatId}`
**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Chat deleted successfully"
}
```

**Logic:**
1. Add current user ID to `deleted_for` array
2. If BOTH users are in `deleted_for`, permanently delete:
   - All messages in the chat
   - The chat record itself
3. Otherwise, just soft delete for current user

---

## 📨 Message Endpoints

### 12. Get Messages (with Pagination)
**GET** `/api/chats/{chatId}/messages?limit=20&before={timestamp}`
**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `limit`: Number of messages to return (default: 20, max: 50)
- `before`: ISO timestamp for pagination (get messages before this time)

**Success Response (200):**
```json
{
  "success": true,
  "messages": [
    {
      "id": "msg_abc123",
      "text": "Hello there!",
      "senderId": "user_456",
      "timestamp": "2024-01-15T10:25:00Z",
      "readBy": ["user_456"]
    },
    {
      "id": "msg_def456",
      "text": "How are you?",
      "senderId": "user_123",
      "timestamp": "2024-01-15T10:26:00Z",
      "readBy": ["user_123", "user_456"]
    }
  ],
  "hasMore": true
}
```

**Auto-Mark as Read:**
- Automatically add current user ID to `readBy` array for all returned messages
- This happens when messages are fetched (similar to Firebase onSnapshot behavior)

### 13. Send Message
**POST** `/api/chats/{chatId}/messages`
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "text": "Hello! How are you doing?"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": {
    "id": "msg_new123",
    "text": "Hello! How are you doing?",
    "senderId": "user_123",
    "timestamp": "2024-01-15T10:30:00Z",
    "readBy": ["user_123"]
  }
}
```

**Notes:**
- Sender is automatically added to `readBy` array
- Trim whitespace from message text
- Reject empty messages

### 14. Delete Message
**DELETE** `/api/chats/{chatId}/messages/{messageId}`
**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Message deleted successfully"
}
```

**Authorization:** Only message sender can delete their own messages

---

## 🔄 Real-time Updates (WebSocket)

### WebSocket Connection
**URL:** `wss://yourdomain.com/ws`
**Query Parameters:** `?token=<jwt_access_token>`

### Connection Flow
1. Client connects with JWT token in query parameter
2. Server validates token (including blacklist check)
3. Server associates connection with user ID
4. Server subscribes user to relevant chat rooms

### WebSocket Token Expiration Handling
When access token expires during WebSocket connection:

**Server → Client:**
```json
{
  "type": "token_expired",
  "message": "Access token expired, please refresh and reconnect"
}
```

**Client Response:**
1. Close WebSocket connection
2. Refresh access token using refresh token
3. Reconnect with new access token

### Message Types

#### Incoming Messages (Client → Server)
```json
{
  "type": "join_chat",
  "chatId": "chat_abc123"
}
```

```json
{
  "type": "leave_chat",
  "chatId": "chat_abc123"
}
```

```json
{
  "type": "ping"
}
```

#### Outgoing Messages (Server → Client)

**Connection Established:**
```json
{
  "type": "connected",
  "userId": "user_123"
}
```

**New Message:**
```json
{
  "type": "new_message",
  "chatId": "chat_abc123",
  "message": {
    "id": "msg_new456",
    "text": "Hello!",
    "senderId": "user_456",
    "timestamp": "2024-01-15T10:30:00Z",
    "readBy": ["user_456"]
  }
}
```

**Message Deleted:**
```json
{
  "type": "message_deleted",
  "chatId": "chat_abc123",
  "messageId": "msg_xyz789"
}
```

**Message Read:**
```json
{
  "type": "message_read",
  "chatId": "chat_abc123",
  "messageId": "msg_abc123",
  "readBy": ["user_123", "user_456"]
}
```

**Chat Deleted:**
```json
{
  "type": "chat_deleted",
  "chatId": "chat_abc123"
}
```

**Token Expired:**
```json
{
  "type": "token_expired",
  "message": "Access token expired, please refresh and reconnect"
}
```

**Pong Response:**
```json
{
  "type": "pong"
}
```

---

## 🚨 Error Response Format

All error responses should follow this format:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email or password is incorrect",
    "details": {}
  }
}
```

### Token-Related Error Codes
- `TOKEN_EXPIRED` - JWT access token has expired
- `TOKEN_INVALID` - JWT token is malformed or invalid signature
- `TOKEN_BLACKLISTED` - Token has been logged out/blacklisted
- `REFRESH_TOKEN_EXPIRED` - Refresh token has expired
- `REFRESH_TOKEN_REVOKED` - Refresh token has been revoked
- `REFRESH_TOKEN_INVALID` - Refresh token is invalid or not found

### Other Common Error Codes
- `INVALID_CREDENTIALS` - Wrong email/password
- `USER_NOT_FOUND` - User doesn't exist
- `EMAIL_ALREADY_EXISTS` - Registration with existing email
- `USERNAME_TAKEN` - Username already in use
- `CHAT_NOT_FOUND` - Chat doesn't exist or user not participant
- `MESSAGE_NOT_FOUND` - Message doesn't exist
- `UNAUTHORIZED` - User not authorized for action
- `VALIDATION_ERROR` - Request data validation failed
- `RATE_LIMITED` - Too many requests

---

## 🔧 Implementation Notes

### Security Requirements
1. **Password Hashing:** Use bcrypt with minimum 12 rounds
2. **JWT Security:**
   - Use strong secret key (minimum 256 bits)
   - Include `jti` (JWT ID) for blacklisting
   - Set appropriate expiration times
3. **Refresh Token Security:**
   - Store hashed version in database
   - Generate cryptographically secure random tokens
   - Implement token rotation on refresh
4. **Rate Limiting:** Implement on auth endpoints (especially login/refresh)
5. **Input Validation:** Sanitize all user inputs
6. **CORS:** Configure for your frontend domain

### Token Cleanup Jobs
Implement scheduled jobs to clean up expired data:

```sql
-- Clean up expired blacklisted tokens (run daily)
DELETE FROM blacklisted_tokens WHERE expires_at < NOW();

-- Clean up expired refresh tokens (run daily)
DELETE FROM refresh_tokens WHERE expires_at < NOW() OR is_revoked = TRUE;

-- Clean up expired password reset tokens (run daily)
DELETE FROM password_reset_tokens WHERE expires_at < NOW() OR used = TRUE;
```

### Performance Considerations
1. **Database Indexing:**
   - Index on `users.email`
   - Index on `blacklisted_tokens.jti`
   - Index on `refresh_tokens.token_hash`
   - Index on `chats.user1_id` and `chats.user2_id`
   - Index on `messages.chat_id` and `messages.timestamp`
2. **WebSocket Scaling:** Use Redis for multi-server deployments
3. **Message Pagination:** Implement efficient cursor-based pagination
4. **Token Blacklist:** Consider using Redis for faster blacklist lookups

### Frontend Token Management
```javascript
// Store tokens securely
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);

// Automatic logout on page load if refresh token is expired
const initAuth = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken || isTokenExpired(refreshToken)) {
    // Redirect to login
    redirectToLogin();
    return;
  }

  // Try to refresh access token on app start
  try {
    await refreshAccessToken();
  } catch (error) {
    redirectToLogin();
  }
};

// Logout function
const logout = async () => {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');

  try {
    // Call logout API
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken })
    });
  } catch (error) {
    // Even if API call fails, clear local tokens
    console.error('Logout API call failed:', error);
  } finally {
    // Always clear local storage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    redirectToLogin();
  }
};
```

### Email Configuration
Set up SMTP for password reset emails:
- From: `noreply@yourdomain.com`
- Subject: `Reset your SweetChat password`
- Reset link format: `https://mylovelyserver.fun/chatapp/reset-password?oobCode={token}`

### WebSocket Room Management
- Subscribe users to rooms: `chat_{chatId}`
- Only send updates to active participants
- Handle disconnections gracefully
- Implement token validation for WebSocket connections

---

## 🧪 Testing Checklist

### Authentication Tests
- [ ] User registration with duplicate email fails
- [ ] Login with wrong credentials fails
- [ ] JWT token expiration handled correctly
- [ ] Refresh token flow works properly
- [ ] Logout blacklists tokens correctly
- [ ] Blacklisted tokens are rejected
- [ ] Password reset email delivery
- [ ] Token cleanup jobs run successfully

### API Tests
- [ ] Chat creation between same users returns existing chat
- [ ] Message pagination works correctly
- [ ] Message read receipts update correctly
- [ ] Soft delete removes user from chat list
- [ ] Hard delete removes chat and messages permanently
- [ ] User search is case-insensitive
- [ ] Rate limiting prevents abuse
- [ ] CORS configured correctly

### WebSocket Tests
- [ ] Real-time message delivery via WebSocket
- [ ] WebSocket authentication works
- [ ] Token expiration during WebSocket connection handled
- [ ] WebSocket reconnection after token refresh
- [ ] Room management works correctly

---

## 📞 Support

If you need clarification on any endpoint or have questions about the implementation, feel free to ask! This specification covers all the functionality currently used by the Firebase implementation, plus proper logout and token expiration handling.

The key improvements in this version include:
- **Proper logout functionality** with token blacklisting
- **Refresh token system** for seamless user experience
- **Token expiration handling** in both REST API and WebSocket
- **Automatic token refresh** logic for frontend
- **Security best practices** for token management
- **Database cleanup jobs** for expired tokens
```

Perfect! Now the specification includes comprehensive logout and token expiration handling:

## Key Additions:

### 🔐 **Logout System:**
- **Logout endpoint** that blacklists access tokens
- **Token blacklist table** to track revoked tokens
- **Refresh token revocation** on logout
- **Frontend logout logic** with proper cleanup

### ⏰ **Token Expiration Management:**
- **Refresh token system** (30-day expiration)
- **Access token refresh endpoint**
- **Automatic token refresh** logic for frontend
- **WebSocket token expiration** handling
- **Sliding session** approach for better UX

### 🛡️ **Enhanced Security:**
- **JWT ID (jti)** for blacklisting specific tokens
- **Token rotation** on refresh for added security
- **Forced logout** from all devices on password reset
- **Database cleanup jobs** for expired tokens
- **Secure token storage** recommendations

### 🔄 **Real-time Considerations:**
- **WebSocket authentication** with token validation
- **Token expiration** during WebSocket connections
- **Automatic reconnection** after token refresh
- **Graceful handling** of authentication failures

The specification now provides a complete, production-ready authentication system that handles all edge cases your friends might encounter when implementing the backend. Users will have a seamless experience with automatic token refresh, and proper security with logout functionality.
