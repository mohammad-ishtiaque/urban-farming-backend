# Urban Farming Platform — API Documentation

Base URL: `http://localhost:3000`

**Authentication:** Protected routes need a Bearer token in the header:
```
Authorization: Bearer <your_token_here>
```

---

## How Roles Work

| Role | কী করতে পারে |
|---|---|
| `CUSTOMER` | Register, browse produce, place orders, community posts, plant tracking |
| `VENDOR` | Register, set up farm profile, add produce, manage orders, certifications |
| `ADMIN` | Manage all users, approve produce & vendors, view dashboard |

---

## Auth Flow (Step by Step)

```
1. Register           → POST /api/auth/register
2. Verify Email OTP   → POST /api/auth/verify-email   (token পাবে)
3. Login করো         → POST /api/auth/login
```

---

## 1. AUTH — `/api/auth`

> Rate limited: 10 requests per 15 minutes on all auth routes

---

### POST `/api/auth/register`

নতুন account তৈরি। Email verify না করা পর্যন্ত `PENDING` থাকে।

**Request Body:**
```json
{
  "name": "Rahim Uddin",
  "email": "rahim@example.com",
  "password": "secret123",
  "role": "VENDOR"
}
```
> `role` optional — default `CUSTOMER`. Allowed: `CUSTOMER`, `VENDOR`

**Success (201):**
```json
{
  "success": true,
  "message": "Registration successful. Please check your email for the OTP to verify your account.",
  "data": { "userId": "uuid-here" }
}
```

**Errors:**
| Status | Message |
|---|---|
| 400 | Name, email and password are required |
| 400 | Invalid email format |
| 400 | Password must be at least 6 characters |
| 409 | Email already registered |
| 409 (re-sends OTP) | Account already registered but not verified. A new OTP has been sent. |

---

### POST `/api/auth/verify-email`

Email-এ আসা 6-digit OTP দিয়ে account activate করো। সফল হলে সাথে সাথে token পাবে।

**Request Body:**
```json
{
  "email": "rahim@example.com",
  "otp": "482910"
}
```

**Success (200):**
```json
{
  "success": true,
  "message": "Email verified successfully. You are now logged in.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "name": "Rahim Uddin",
      "email": "rahim@example.com",
      "role": "VENDOR"
    }
  }
}
```

**Errors:**
| Status | Message |
|---|---|
| 400 | Email and OTP are required |
| 400 | Invalid OTP |
| 400 | OTP has expired. Please request a new one. |
| 400 | No active OTP found. Please request a new one. |
| 400 | Email is already verified |
| 403 | Account has been deactivated |
| 404 | User not found |

---

### POST `/api/auth/resend-otp`

OTP expire হলে বা না পেলে নতুন OTP পাঠাও।

**Request Body:**
```json
{
  "email": "rahim@example.com"
}
```

**Success (200):**
```json
{
  "success": true,
  "message": "A new OTP has been sent to your email."
}
```

---

### POST `/api/auth/login`

**Request Body:**
```json
{
  "email": "rahim@example.com",
  "password": "secret123"
}
```

**Success (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "name": "Rahim Uddin",
      "email": "rahim@example.com",
      "role": "VENDOR"
    }
  }
}
```

**Errors:**
| Status | Message |
|---|---|
| 400 | Email and password are required |
| 401 | Invalid credentials |
| 403 | Please verify your email first. Check your inbox for the OTP. |
| 403 | Account has been deactivated |

---

### GET `/api/auth/my-profile` 🔒

নিজের profile দেখো।

**Headers:** `Authorization: Bearer <token>`

**Success (200):**
```json
{
  "success": true,
  "message": "Profile fetched",
  "data": {
    "id": "uuid",
    "name": "Rahim Uddin",
    "email": "rahim@example.com",
    "role": "VENDOR",
    "status": "ACTIVE",
    "createdAt": "2026-04-17T10:00:00.000Z",
    "vendorProfile": null
  }
}
```

---

### POST `/api/auth/forgot-password`

Password reset-এর জন্য OTP পাঠাও।

**Request Body:**
```json
{
  "email": "rahim@example.com"
}
```

**Success (200):**
```json
{
  "success": true,
  "message": "If this email is registered, you will receive an OTP shortly."
}
```
> Security: email না থাকলেও same message দেয় (email enumeration prevent করতে)

**Errors:**
| Status | Message |
|---|---|
| 403 | Please verify your email first before resetting your password. |
| 403 | Account has been deactivated |

---

### POST `/api/auth/reset-password`

OTP দিয়ে নতুন password set করো।

**Request Body:**
```json
{
  "email": "rahim@example.com",
  "otp": "738291",
  "newPassword": "newSecret123"
}
```

**Success (200):**
```json
{
  "success": true,
  "message": "Password reset successful. You can now log in."
}
```

**Errors:**
| Status | Message |
|---|---|
| 400 | Email, OTP and new password are required |
| 400 | Password must be at least 6 characters |
| 400 | Invalid OTP |
| 400 | OTP has expired. Please request a new one. |
| 400 | No active OTP found. Please request a new one. |

---

### POST `/api/auth/change-password` 🔒

Login থাকা অবস্থায় password change করো।

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "currentPassword": "secret123",
  "newPassword": "newSecret456"
}
```

**Success (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Errors:**
| Status | Message |
|---|---|
| 400 | Current and new password are required |
| 400 | New password must be at least 6 characters |
| 400 | New password must be different from current password |
| 400 | Current password is incorrect |

---

## 2. PROFILE — `/api/profile`

---

### POST `/api/profile/setup` 🔒 VENDOR only

Vendor account-এর জন্য farm profile তৈরি করো। (Register-এর পর একবারই করতে হয়)

**Headers:** `Authorization: Bearer <vendor_token>`

**Request Body:**
```json
{
  "farmName": "Green Valley Farm",
  "farmLocation": "Gazipur, Dhaka"
}
```

**Success (201):**
```json
{
  "success": true,
  "message": "Vendor profile created successfully",
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "farmName": "Green Valley Farm",
    "farmLocation": "Gazipur, Dhaka",
    "certificationStatus": "PENDING",
    "user": {
      "name": "Rahim Uddin",
      "email": "rahim@example.com",
      "createdAt": "2026-04-17T10:00:00.000Z"
    }
  }
}
```

**Errors:**
| Status | Message |
|---|---|
| 400 | Farm name and farm location are required |
| 403 | Access denied (CUSTOMER বা ADMIN হলে) |
| 409 | Vendor profile already exists. Use PUT to update it. |

---

### GET `/api/profile` 🔒

নিজের role অনুযায়ী profile দেখো।

**Headers:** `Authorization: Bearer <token>`

**Success (200) — VENDOR:**
```json
{
  "success": true,
  "message": "Profile fetched",
  "data": {
    "id": "uuid",
    "farmName": "Green Valley Farm",
    "farmLocation": "Gazipur, Dhaka",
    "certificationStatus": "PENDING",
    "user": { "name": "Rahim Uddin", "email": "rahim@example.com" },
    "certifications": [],
    "produce": []
  }
}
```

**Success (200) — CUSTOMER:**
```json
{
  "success": true,
  "message": "Profile fetched",
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "phone": null,
    "address": null,
    "bio": null,
    "avatarUrl": null,
    "user": { "name": "Karim", "email": "karim@example.com", "role": "CUSTOMER" }
  }
}
```

---

### PUT `/api/profile` 🔒

Profile update করো।

**Headers:** `Authorization: Bearer <token>`

**VENDOR body:**
```json
{
  "name": "Rahim Updated",
  "farmName": "Green Valley Premium Farm",
  "farmLocation": "Savar, Dhaka"
}
```

**CUSTOMER body:**
```json
{
  "name": "Karim Updated",
  "phone": "01712345678",
  "address": "Mirpur, Dhaka",
  "bio": "Organic food lover",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

---

## 3. PRODUCE — `/api/produce`

---

### GET `/api/produce` (Public)

সব approved produce দেখো। Filter ও pagination সহ।

**Query Params:**
| Param | Example | Description |
|---|---|---|
| `page` | `?page=2` | Page number (default: 1) |
| `limit` | `?limit=20` | Per page (default: 10, max: 100) |
| `category` | `?category=Vegetables` | Category filter |
| `search` | `?search=tomato` | Name search |

**Success (200):**
```json
{
  "success": true,
  "message": "Produce fetched",
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "Organic Tomato",
        "description": "Fresh organic tomatoes",
        "price": "120.00",
        "category": "Vegetables",
        "certificationStatus": "APPROVED",
        "availableQuantity": 50,
        "vendor": {
          "farmName": "Green Valley Farm",
          "farmLocation": "Gazipur, Dhaka"
        }
      }
    ],
    "meta": {
      "total": 45,
      "page": 1,
      "limit": 10,
      "totalPages": 5
    }
  }
}
```

---

### GET `/api/produce/:id` (Public)

একটি produce-এর বিস্তারিত।

---

### POST `/api/produce` 🔒 VENDOR only

নতুন produce যোগ করো। (Admin approve করলে তবেই বিক্রি হবে)

**Request Body:**
```json
{
  "name": "Organic Tomato",
  "description": "Fresh farm-grown organic tomatoes",
  "price": 120,
  "category": "Vegetables",
  "availableQuantity": 50
}
```

**Success (201):**
```json
{
  "success": true,
  "message": "Produce created",
  "data": {
    "id": "uuid",
    "name": "Organic Tomato",
    "price": "120.00",
    "certificationStatus": "PENDING",
    "availableQuantity": 50
  }
}
```

**Errors:**
| Status | Message |
|---|---|
| 400 | All fields are required |
| 400 | Price must be a positive number |
| 400 | Available quantity must be at least 1 |
| 404 | Vendor profile not found. Please set up your farm profile first. |

---

### GET `/api/produce/vendor/my` 🔒 VENDOR only

নিজের সব produce দেখো (pending, approved, rejected সব)।

---

### PUT `/api/produce/:id` 🔒 VENDOR only

নিজের produce update করো।

**Request Body:** (সব optional)
```json
{
  "name": "Premium Organic Tomato",
  "price": 150,
  "availableQuantity": 30
}
```

---

### DELETE `/api/produce/:id` 🔒 VENDOR only

নিজের produce delete করো।

---

## 4. ORDERS — `/api/orders`

---

### POST `/api/orders` 🔒 CUSTOMER only

Order দাও।

**Request Body:**
```json
{
  "produceId": "uuid-of-produce"
}
```

**Success (201):**
```json
{
  "success": true,
  "message": "Order placed",
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "produceId": "uuid",
    "vendorId": "uuid",
    "status": "PENDING",
    "orderDate": "2026-04-17T10:00:00.000Z"
  }
}
```

**Errors:**
| Status | Message |
|---|---|
| 400 | produceId is required |
| 400 | This produce is out of stock |
| 400 | This produce is not yet approved for sale |
| 400 | You cannot order your own produce |
| 404 | Produce not found |

---

### GET `/api/orders/my` 🔒 CUSTOMER only

নিজের সব orders দেখো।

**Query Params:** `page`, `limit`

---

### GET `/api/orders/vendor` 🔒 VENDOR only

নিজের farm-এর সব orders দেখো।

**Query Params:** `page`, `limit`

---

### PUT `/api/orders/:id/status` 🔒 VENDOR only

Order-এর status update করো।

**Request Body:**
```json
{
  "status": "CONFIRMED"
}
```

**Order Status Flow:**
```
PENDING → CONFIRMED → DELIVERED
PENDING → CANCELLED  (stock restore হয়)
CONFIRMED → CANCELLED  (stock restore হয়)
DELIVERED → (final, আর change হবে না)
CANCELLED → (final, আর change হবে না)
```

**Errors:**
| Status | Message |
|---|---|
| 400 | Status is required |
| 400 | Cannot change status from DELIVERED to PENDING. Allowed: none (final state) |
| 403 | You can only update orders for your own produce |
| 404 | Order not found |

---

## 5. FARMS (Rental Spaces) — `/api/farms`

---

### GET `/api/farms` (Public)

সব available rental farm দেখো।

**Query Params:**
| Param | Example |
|---|---|
| `page` | `?page=1` |
| `limit` | `?limit=10` |
| `location` | `?location=dhaka` |

---

### GET `/api/farms/:id` (Public)

একটি farm-এর বিস্তারিত।

---

### POST `/api/farms` 🔒 VENDOR only

নিজের rental space যোগ করো।

**Request Body:**
```json
{
  "location": "Savar, Dhaka",
  "size": "500 sqft",
  "price": 5000
}
```

**Errors:**
| Status | Message |
|---|---|
| 400 | Location, size, and price are required |
| 400 | Price must be a positive number |
| 404 | Vendor profile not found |

---

### PUT `/api/farms/:id` 🔒 VENDOR only

নিজের farm update করো।

**Request Body:** (সব optional)
```json
{
  "location": "Ashulia, Dhaka",
  "size": "800 sqft",
  "price": 7000,
  "availability": false
}
```

---

### DELETE `/api/farms/:id` 🔒 VENDOR only

নিজের farm delete করো।

---

## 6. COMMUNITY POSTS — `/api/community`

---

### GET `/api/community` (Public)

সব posts দেখো।

**Query Params:** `page`, `limit`

---

### POST `/api/community` 🔒

নতুন post করো।

**Request Body:**
```json
{
  "postContent": "আমার টমেটো বাগানে এই সপ্তাহে প্রথম ফুল এসেছে!"
}
```

---

### DELETE `/api/community/:id` 🔒

নিজের post delete করো। (Admin যেকোনো post delete করতে পারে)

---

## 7. CERTIFICATIONS — `/api/certifications`

---

### POST `/api/certifications` 🔒 VENDOR only

Sustainability certificate submit করো।

**Request Body:**
```json
{
  "certifyingAgency": "Bangladesh Standards and Testing Institution",
  "certificationDate": "2026-01-15"
}
```

---

### GET `/api/certifications` 🔒 VENDOR only

নিজের সব certifications দেখো।

---

## 8. PLANT TRACKING — `/api/plants`

---

### GET `/api/plants` 🔒

নিজের সব plants দেখো।

---

### POST `/api/plants` 🔒

নতুন plant track করো।

**Request Body:**
```json
{
  "plantName": "Tomato",
  "species": "Solanum lycopersicum",
  "notes": "Planted in pot #3",
  "harvestDate": "2026-07-01"
}
```

---

### PUT `/api/plants/:id` 🔒

Plant info update করো।

**Request Body:** (সব optional)
```json
{
  "healthStatus": "HEALTHY",
  "growthStage": "FLOWERING",
  "notes": "First flowers appeared"
}
```

---

### DELETE `/api/plants/:id` 🔒

Plant tracking থেকে remove করো।

---

## 9. ADMIN — `/api/admin`

> সব routes-এ ADMIN token লাগবে

---

### GET `/api/admin/dashboard`

Platform-এর overview দেখো।

**Success (200):**
```json
{
  "success": true,
  "message": "Dashboard data",
  "data": {
    "totalUsers": 142,
    "totalVendors": 28,
    "totalProduce": 310,
    "totalOrders": 87
  }
}
```

---

### GET `/api/admin/users`

সব users-এর list।

---

### PUT `/api/admin/users/:id/status`

User activate বা deactivate করো।

**Request Body:**
```json
{
  "status": "INACTIVE"
}
```

**Errors:**
| Status | Message |
|---|---|
| 400 | Status must be ACTIVE or INACTIVE |
| 400 | You cannot change your own account status |
| 404 | User not found |

---

### PUT `/api/admin/produce/:id/approve`

Produce approve বা reject করো।

**Request Body:**
```json
{
  "certificationStatus": "APPROVED"
}
```

> Approve হলেই customer এই produce কিনতে পারবে।

**Errors:**
| Status | Message |
|---|---|
| 400 | certificationStatus must be APPROVED or REJECTED |
| 404 | Produce not found |

---

### PUT `/api/admin/vendors/:id/approve`

Vendor profile approve বা reject করো।

**Request Body:**
```json
{
  "certificationStatus": "APPROVED"
}
```

**Errors:**
| Status | Message |
|---|---|
| 400 | certificationStatus must be APPROVED or REJECTED |
| 404 | Vendor profile not found |

---

## Complete Workflow Examples

### নতুন Vendor-এর পুরো flow:

```
1. POST /api/auth/register          → OTP যাবে email-এ
2. POST /api/auth/verify-email      → Account active, token পাবে
3. POST /api/profile/setup          → Farm profile বানাও
4. POST /api/produce                → Produce যোগ করো
5. Admin: PUT /api/admin/produce/:id/approve → Admin approve করবে
6. Customer: POST /api/orders       → Customer order দেবে
7. PUT /api/orders/:id/status       → CONFIRMED বা CANCELLED করো
```

### নতুন Customer-এর পুরো flow:

```
1. POST /api/auth/register          → OTP যাবে email-এ
2. POST /api/auth/verify-email      → Account active, token পাবে
3. GET  /api/produce                → Produce browse করো
4. POST /api/orders                 → Order দাও
5. GET  /api/orders/my              → নিজের orders দেখো
```

### Password ভুলে গেলে:

```
1. POST /api/auth/forgot-password   → OTP যাবে email-এ
2. POST /api/auth/reset-password    → OTP + নতুন password দাও
3. POST /api/auth/login             → নতুন password দিয়ে login
```

---

## Error Response Format

সব errors-এর format একই:

```json
{
  "success": false,
  "message": "Error description here"
}
```

## Success Response Format

```json
{
  "success": true,
  "message": "Operation description",
  "data": { ... },
  "meta": { "total": 45, "page": 1, "limit": 10, "totalPages": 5 }
}
```
> `data` এবং `meta` শুধু থাকে যখন relevant।
