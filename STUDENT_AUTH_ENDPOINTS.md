# PeerConnect Student Mobile Auth Endpoints

## Base URL
```
http://localhost:4000/api/v1/mobile
```

---

## 1. REGISTER (Create Student Account)

### Request
```
POST /api/v1/mobile/auth/register
Content-Type: application/json

{
  "fullName": "John Doe",
  "email": "john.doe@st.university.edu.gh",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "university": "University of Ghana",
  "department": "Computer Science",
  "level": "Level 300"
}
```

### Success Response (201)
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Registration successful. Verify the email with the OTP sent.",
  "data": {
    "otp": "123456",  // Only in development mode (NODE_ENV=development)
    "user": {
      "id": "uuid-here",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@st.university.edu.gh",
      "role": "STUDENT",
      "accountStatus": "ACTIVE",
      "profileImage": null,
      "isEmailVerified": false,
      "studentVerified": false,
      "verificationStatus": "unverified",
      "setupProgress": "email",
      "createdAt": "2026-07-21T02:57:27.000Z",
      "updatedAt": "2026-07-21T02:57:27.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Error Responses
```json
// 400 - Invalid email domain
{
  "success": false,
  "statusCode": 400,
  "message": "Only university student emails are allowed"
}

// 409 - Email already registered
{
  "success": false,
  "statusCode": 409,
  "message": "Email is already registered."
}

// 422 - Validation failed
{
  "success": false,
  "statusCode": 422,
  "message": "Validation failed: field error message"
}
```

### Validation Rules
- **fullName**: 2-50 characters
- **email**: Valid university domain (configured in ALLOWED_UNIVERSITY_DOMAINS)
- **password**: Min 8 chars, must contain uppercase, lowercase, number, special char
- **confirmPassword**: Must match password
- **university**: Required, 2+ characters
- **department**: Optional
- **level**: Optional

---

## 2. VERIFY EMAIL OTP

### Request
```
POST /api/v1/mobile/auth/verify-email
Content-Type: application/json

{
  "email": "john.doe@st.university.edu.gh",
  "otp": "123456"
}
```

### Success Response (200)
```json
{
  "success": true,
  "message": "Email verified successfully.",
  "data": {
    "user": {
      "id": "uuid-here",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@st.university.edu.gh",
      "role": "STUDENT",
      "accountStatus": "ACTIVE",
      "profileImage": null,
      "isEmailVerified": true,
      "studentVerified": false,
      "verificationStatus": "unverified",
      "setupProgress": "profile",
      "createdAt": "2026-07-21T02:57:27.000Z",
      "updatedAt": "2026-07-21T02:57:27.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Error Responses
```json
// 400 - Invalid OTP
{
  "success": false,
  "statusCode": 400,
  "message": "Invalid or expired OTP."
}

// 429 - Too many attempts
{
  "success": false,
  "statusCode": 429,
  "message": "Too many failed OTP attempts. Please request a new OTP."
}

// 404 - User not found
{
  "success": false,
  "statusCode": 404,
  "message": "User not found."
}
```

### Notes
- OTP expires after 10 minutes (configurable via OTP_EXPIRES_MINUTES)
- Max 5 attempts per OTP (configurable via OTP_MAX_ATTEMPTS)
- Rate limited: 5 requests per 15 minutes per endpoint

---

## 3. RESEND OTP

### Request
```
POST /api/v1/mobile/auth/resend-otp
Content-Type: application/json

{
  "email": "john.doe@st.university.edu.gh"
}
```

### Success Response (200)
```json
{
  "success": true,
  "message": "If an account exists, an OTP has been sent.",
  "data": {
    "otp": "654321"  // Only in development mode
  }
}
```

### Error Responses
```json
// 404 - User not found (generic message for security)
{
  "success": false,
  "statusCode": 404,
  "message": "If an account exists, an OTP has been sent."
}

// 429 - Rate limited
{
  "success": false,
  "statusCode": 429,
  "message": "Too many requests. Please try again later."
}
```

### Notes
- Rate limited: 5 requests per 15 minutes
- Does not reveal if email exists (security)
- OTP sent via email in production

---

## 4. LOGIN

### Request
```
POST /api/v1/mobile/auth/login
Content-Type: application/json

{
  "email": "john.doe@st.university.edu.gh",
  "password": "SecurePass123!"
}
```

### Success Response (200)
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "user": {
      "id": "uuid-here",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@st.university.edu.gh",
      "role": "STUDENT",
      "accountStatus": "ACTIVE",
      "profileImage": null,
      "isEmailVerified": true,
      "studentVerified": true,
      "verificationStatus": "approved",
      "setupProgress": "complete",
      "createdAt": "2026-07-21T02:57:27.000Z",
      "updatedAt": "2026-07-21T02:57:27.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Error Responses
```json
// 401 - Invalid credentials
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid email or password."
}

// 403 - Account suspended
{
  "success": false,
  "statusCode": 403,
  "message": "Your account has been suspended. Please contact support."
}

// 403 - Email not verified
{
  "success": false,
  "statusCode": 403,
  "message": "Student account not fully verified. Complete email and ID verification before accessing the app."
}

// 429 - Rate limited (brute force protection)
{
  "success": false,
  "statusCode": 429,
  "message": "Too many login attempts. Please try again later."
}
```

### Notes
- Rate limited: 10 requests per 15 minutes per IP
- Student must have:
  - `isEmailVerified: true`
  - `studentVerified: true`
- setupProgress indicates onboarding stage

---

## 5. FORGOT PASSWORD

### Request
```
POST /api/v1/mobile/auth/forgot-password
Content-Type: application/json

{
  "email": "john.doe@st.university.edu.gh"
}
```

### Success Response (200)
```json
{
  "success": true,
  "message": "If an account with that email exists, a password reset token has been generated.",
  "data": {
    "resetToken": "token-here"
  }
}
```

### Error Response
```json
// Generic response (security - doesn't reveal if email exists)
{
  "success": true,
  "message": "If an account with that email exists, a password reset token has been generated."
}
```

### Notes
- Reset token sent via email
- Token expires after 1 hour
- Does not reveal if email exists

---

## 6. RESET PASSWORD

### Request
```
POST /api/v1/mobile/auth/reset-password
Content-Type: application/json

{
  "token": "reset-token-from-email",
  "password": "NewSecurePass123!",
  "confirmPassword": "NewSecurePass123!"
}
```

### Success Response (200)
```json
{
  "success": true,
  "message": "Password reset successfully. Please log in with your new password."
}
```

### Error Responses
```json
// 400 - Invalid or expired token
{
  "success": false,
  "statusCode": 400,
  "message": "Invalid or expired reset token."
}

// 422 - Validation failed
{
  "success": false,
  "statusCode": 422,
  "message": "Passwords do not match"
}
```

### Validation Rules
- Same as registration password rules
- Passwords must match

---

## 7. LOGOUT

### Request
```
POST /api/v1/mobile/auth/logout
Content-Type: application/json
Authorization: Bearer <access_token>

{
  "refreshToken": "refresh-token-optional"
}
```

### Success Response (200)
```json
{
  "success": true,
  "message": "Logged out successfully."
}
```

### Error Response
```json
// 401 - Not authenticated
{
  "success": false,
  "statusCode": 401,
  "message": "Authentication required."
}
```

### Notes
- Optional refreshToken in body (will invalidate that session)
- If refreshToken not provided, invalidates all sessions
- Access token is immediately invalidated

---

## 8. GET CURRENT USER

### Request
```
GET /api/v1/mobile/auth/me
Authorization: Bearer <access_token>
```

### Success Response (200)
```json
{
  "success": true,
  "message": "Current user retrieved successfully.",
  "data": {
    "user": {
      "id": "uuid-here",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@st.university.edu.gh",
      "role": "STUDENT",
      "accountStatus": "ACTIVE",
      "profileImage": "https://...",
      "isEmailVerified": true,
      "studentVerified": true,
      "verificationStatus": "approved",
      "setupProgress": "complete",
      "createdAt": "2026-07-21T02:57:27.000Z",
      "updatedAt": "2026-07-21T02:57:27.000Z"
    },
    "profile": {
      "id": "uuid-here",
      "userId": "uuid-here",
      "department": "Computer Science",
      "level": "Level 300",
      "skills": ["React Native", "Node.js", "TypeScript"],
      "learningInterests": ["Machine Learning", "Backend Development"],
      "bio": "CS student passionate about mobile development",
      "availability": "Weekdays after 5pm, weekends anytime",
      "isAvailable": true,
      "profilePhoto": "https://...",
      "studentId": "UG12345",
      "createdAt": "2026-07-21T02:57:27.000Z",
      "updatedAt": "2026-07-21T02:57:27.000Z"
    }
  }
}
```

### Error Response
```json
// 401 - Not authenticated
{
  "success": false,
  "statusCode": 401,
  "message": "Authentication required. Provide a ****** token."
}
```

---

## 9. SUBMIT ID VERIFICATION

### Request
```
POST /api/v1/mobile/auth/submit-id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "photoUrl": "https://cloudinary.com/image-url-from-upload"
}
```

### Success Response (200)
```json
{
  "success": true,
  "message": "ID submitted successfully. Your account is pending review."
}
```

### Error Responses
```json
// 401 - Not authenticated
{
  "success": false,
  "statusCode": 401,
  "message": "Authentication required."
}

// 422 - Invalid URL
{
  "success": false,
  "statusCode": 422,
  "message": "Must be a valid URL pointing to the uploaded ID photo"
}
```

### Notes
- photoUrl should come from image upload endpoint
- Sets account to "pending_approval" state
- Waiting for admin approval to set studentVerified=true

---

## 10. UPLOAD IMAGE (for chat/profile)

### Request
```
POST /api/v1/chat/upload-image
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

{
  "image": <binary image file>
}
```

### Success Response (200)
```json
{
  "success": true,
  "message": "Image uploaded successfully.",
  "data": {
    "imageUrl": "https://res.cloudinary.com/..."
  }
}
```

### Error Response
```json
// 400 - No file provided
{
  "success": false,
  "statusCode": 400,
  "message": "No image file provided. Attach one under the \"image\" field."
}
```

---

## STUDENT VERIFICATION LIFECYCLE & setupProgress

### Flow:
```
1. Register → setupProgress = "email"
2. Verify Email OTP → setupProgress = "profile"
3. Complete Profile (PATCH /api/v1/profile/me) → setupProgress = "id_verification"
4. Submit ID → setupProgress = "pending_approval"
5. Admin Approves → setupProgress = "complete"
```

### Flags During Flow:
```
State 1 (email):
- isEmailVerified: false
- studentVerified: false
- verificationStatus: "unverified"

State 2 (profile):
- isEmailVerified: true
- studentVerified: false
- verificationStatus: "unverified"

State 3 (id_verification):
- isEmailVerified: true
- studentVerified: false
- verificationStatus: "unverified"

State 4 (pending_approval):
- isEmailVerified: true
- studentVerified: false
- verificationStatus: "pending"

State 5 (complete):
- isEmailVerified: true
- studentVerified: true
- verificationStatus: "approved"
```

---

## Authentication Header

All protected endpoints require:
```
Authorization: Bearer <access_token>
```

### Token Refresh (if expired):
```
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh-token-value"
}
```

Response:
```json
{
  "success": true,
  "message": "Token refreshed successfully.",
  "data": {
    "accessToken": "new-access-token",
    "refreshToken": "new-refresh-token"
  }
}
```

---

## Response Format

### Success Response
```json
{
  "success": true,
  "statusCode": 200,  // May be 201, 202, etc.
  "message": "Descriptive message",
  "data": { /* endpoint-specific data */ }
}
```

### Error Response
```json
{
  "success": false,
  "statusCode": 400,  // 400, 401, 403, 404, 409, 422, 429, etc.
  "message": "Error description"
  // Note: No "data" field for errors
}
```

---

## Common Error Status Codes

- **400**: Bad Request (validation error, malformed request)
- **401**: Unauthorized (missing/invalid token, invalid credentials)
- **403**: Forbidden (not verified, account suspended)
- **404**: Not Found (user/resource doesn't exist)
- **409**: Conflict (duplicate email)
- **422**: Unprocessable Entity (validation failed)
- **429**: Too Many Requests (rate limited)
- **500**: Internal Server Error

---

## Environment Variables for Frontend Integration

```
REACT_APP_API_BASE_URL=http://localhost:4000/api/v1
REACT_APP_MOBILE_AUTH_BASE=/mobile
REACT_APP_SOCKET_URL=http://localhost:4000
REACT_APP_OTP_EXPIRY=600000  // 10 minutes in ms
```

---

## Frontend Integration Checklist

- [ ] Store access token in secure storage
- [ ] Store refresh token in secure storage
- [ ] Handle setupProgress states for navigation
- [ ] Check isEmailVerified & studentVerified before allowing app access
- [ ] Implement auto-token refresh before expiry
- [ ] Handle rate limiting (429 errors) with backoff
- [ ] Validate email domain on input
- [ ] Validate password strength before submit
- [ ] Show OTP to user (dev only) or send to email (production)
- [ ] Clear storage on logout
- [ ] Handle token expiration gracefully

---

## Rate Limiting Configuration

- **Login endpoint**: 10 requests per 15 minutes per IP
- **OTP endpoints** (verify/resend): 5 requests per 15 minutes per email
- **Forgot password**: 5 requests per 15 minutes per IP
- **Register**: 10 requests per 15 minutes per IP

---

## Notes

- In **development mode** (NODE_ENV=development): OTP returned in response for testing
- In **production**: OTP sent via email only, never returned in response
- Email domain validation: Configured via `ALLOWED_UNIVERSITY_DOMAINS` environment variable
- Tokens expire:
  - Access token: 15 minutes
  - Refresh token: 7 days
