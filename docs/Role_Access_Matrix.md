# Role Access Matrix (RBAC Design)

## Overview

This document defines role-based access control (RBAC) for the application.

Roles:
- Admin (A)
- Staff (S)
- Donor (D)
- Public User (U) – unauthenticated or general visitor

All access decisions MUST be enforced on the backend using role-based authorization.

---

# Role Definitions

## Admin
- Full system access
- Can create, update, and delete all data
- Oversees system operations and reporting

## Staff
- Operational access
- Manages residents, case data, and logs
- Cannot perform high-level administrative actions (e.g., managing donors at system level)

## Donor
- Authenticated supporter
- Can view personal donation history
- Can submit donations (simulated)

## Public User
- Unauthenticated visitor
- Can only view public-facing content

---

# Page Access Matrix

| Page / Feature | Admin | Staff | Donor | Public |
|----------------|------|------|------|--------|
| Admin Dashboard (Command Center) | ✅ | ❌ | ❌ | ❌ |
| Caseload Inventory | ✅ | ✅ | ❌ | ❌ |
| Process Recordings | ✅ | ✅ | ❌ | ❌ |
| Visitation Logs | ✅ | ✅ | ❌ | ❌ |
| Donor Contributions (Management) | ✅ | ❌ | ❌ | ❌ |
| Public Impact Dashboard | ✅ | ✅ | ✅ | ✅ |
| Donor Personal Dashboard | ❌ | ❌ | ✅ | ❌ |
| Login / Register | ✅ | ✅ | ✅ | ✅ |
| Landing Page | ✅ | ✅ | ✅ | ✅ |
| Reports / Analytics | ✅ | ✅ | ❌ | ❌ |
| Privacy Policy / Cookies | ✅ | ✅ | ✅ | ✅ |
| Social Media Posts Page| ✅ | ❌ | ❌ | ❌ |

---

# API Authorization Rules

## Public Endpoints (AllowAnonymous)
- GET /api/impact
- POST /api/auth/login
- POST /api/auth/register
- GET /api/privacy

## Admin Only
- ALL create/update/delete operations on:
  - Residents
  - Donations (management)
  - Reports
  - Safehouses

Example:
- POST /api/residents
- PUT /api/residents/{id}
- DELETE /api/residents/{id}

## Admin + Staff
- Operational data access:
  - Residents
  - Case management
  - Process recordings
  - Visitation logs

Example:
- GET /api/residents
- POST /api/process-recordings
- GET /api/visits

## Donor Only
- Personal donation data

Example:
- GET /api/donor/history
- POST /api/donor/donate

---

# Backend Enforcement (REQUIRED)

All authorization MUST be enforced using role-based attributes.

Examples:

```csharp
[Authorize(Roles = "Admin")]
public class AdminController : Controller {}

[Authorize(Roles = "Admin,Staff")]
public class CaseloadController : Controller {}

[Authorize(Roles = "Donor")]
public class DonorController : Controller {}

[AllowAnonymous]
public class PublicController : Controller {}
