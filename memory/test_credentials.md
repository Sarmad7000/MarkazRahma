# Test Credentials

## Admin Dashboard
- **URL**: `/admin/login`
- **Username**: `MarkazRahma2026`
- **Password**: `Bismillah20!`

## Login Endpoint
- **POST** `/api/admin/login`
- **Body**: `{"username": "MarkazRahma2026", "password": "Bismillah20!"}`
- **Response**: `{"access_token": "...", "token_type": "bearer", "username": "..."}`
- Use the `access_token` field as `Authorization: Bearer <token>` for admin-protected endpoints.
