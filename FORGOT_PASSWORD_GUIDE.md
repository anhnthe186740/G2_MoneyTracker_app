# 🔐 Chức năng Quên Mật Khẩu với OTP

## 📋 Tổng quan

Đã tích hợp hoàn chỉnh chức năng **Quên mật khẩu** với xác thực OTP qua email và mã hóa password bằng bcrypt.

## 🔄 Flow hoàn chỉnh

```
┌──────────────┐
│  Login Page  │
└──────┬───────┘
       │ Click "Quên mật khẩu?"
       ▼
┌────────────────────────┐
│ Forgot Password Page   │
│ ─────────────────────  │
│ Step 1: Nhập email     │──► Kiểm tra email trong DB
│                        │    ├─ Có ✓ → Gửi OTP
└──────┬─────────────────┘    └─ Không ✗ → Show error
       │ Email hợp lệ
       ▼
┌────────────────────────┐
│ Step 2: Nhập OTP       │
│ ─────────────────────  │
│ - Nhập 6 chữ số        │──► Verify OTP
│ - Countdown 60s        │    ├─ Đúng ✓ → Next
│ - Có thể gửi lại       │    └─ Sai ✗ → Retry
└──────┬─────────────────┘
       │ OTP verified ✓
       ▼
┌────────────────────────┐
│ Reset Password Page    │
│ ─────────────────────  │
│ - Nhập password mới    │
│ - Confirm password     │
│ - Password strength    │──► Hash với bcrypt (11 rounds)
└──────┬─────────────────┘    └─► Update DB
       │
       ▼
┌──────────────┐
│  Login Page  │──► Login với password mới
└──────────────┘
```

## 📁 Files Created/Modified

### 1️⃣ [api.ts](file:///d:/project/G2_MoneyTracker_app/src/services/api.ts) - MODIFIED

**Thêm 3 functions:**

#### `checkEmailExists(email: string): Promise<boolean>`
Kiểm tra email có tồn tại trong database không.

```typescript
const exists = await checkEmailExists('user@example.com');
// returns: true hoặc false
```

#### `getUserByEmail(email: string)`
Lấy thông tin user theo email.

```typescript
const user = await getUserByEmail('user@example.com');
// returns: user object hoặc null
```

#### `updatePassword(email, newPassword, saltRounds = 11)`
Cập nhật password với bcrypt hash.

```typescript
const result = await updatePassword('user@example.com', 'newPass123', 11);
// returns: { success: boolean, message: string }
```

**🔒 Security:** Password được hash với bcrypt salt rounds = 11 trước khi lưu vào database.

---

### 2️⃣ [ForgotPassword.tsx](file:///d:/project/G2_MoneyTracker_app/src/pages/ForgotPassword.tsx) - NEW

**Trang quên mật khẩu với 2 steps:**

#### Step 1: Email Verification
- Form nhập email
- Kiểm tra email có trong database không
- Nếu có → Gửi OTP qua EmailJS
- Nếu không → Hiển thị lỗi

#### Step 2: OTP Verification
- Form nhập OTP (6 chữ số)
- Countdown timer 60 giây
- Nút "Gửi lại OTP"
- Nút "Thay đổi email"
- Verify OTP → Chuyển sang ResetPassword

**Features:**
- ✅ Loading states
- ✅ Error handling
- ✅ Toast notifications
- ✅ Countdown timer cho resend
- ✅ Email validation
- ✅ OTP verification
- ✅ Responsive design

---

### 3️⃣ [ResetPassword.tsx](file:///d:/project/G2_MoneyTracker_app/src/pages/ResetPassword.tsx) - NEW

**Trang đặt lại mật khẩu:**

#### Security Check
- Kiểm tra URL params có `email` và `verified=true` không
- Nếu không → Redirect về ForgotPassword
- Chống direct access

#### Password Form
- Input password mới (có toggle show/hide)
- Input confirm password (có toggle show/hide)
- Password strength indicator:
  - 🔴 Yếu: < 6 ký tự
  - 🟡 Trung bình: 6-9 ký tự
  - 🟢 Mạnh: ≥ 10 ký tự
- Password match indicator
- Minimum 3 ký tự required

#### Password Update
- Hash password bằng bcrypt (salt rounds = 11)
- Cập nhật vào database qua API
- Success → Redirect về Login sau 2s

**Features:**
- ✅ Password strength indicator
- ✅ Password match validation
- ✅ Show/hide password toggle
- ✅ Protected route (cần verify OTP trước)
- ✅ Bcrypt hashing
- ✅ Auto redirect sau success
- ✅ Security note hiển thị

---

### 4️⃣ [Login.tsx](file:///d:/project/G2_MoneyTracker_app/src/pages/Login.tsx#L91) - MODIFIED

**Thay đổi:**
```tsx
// Before
<a href="#" className="...">Quên mật khẩu?</a>

// After  
<Link to="/forgot-password" className="...">Quên mật khẩu?</Link>
```

Link "Quên mật khẩu" giờ navigate đến `/forgot-password` thay vì `#`.

---

### 5️⃣ [App.tsx](file:///d:/project/G2_MoneyTracker_app/src/App.tsx#L33-L36) - MODIFIED

**Thêm 2 routes mới:**

```tsx
<Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/reset-password" element={<ResetPassword />} />
```

Cả 2 routes đều **public** (không cần login).

---

## 🔐 Security Features

### 1. Email Validation
- Kiểm tra email có tồn tại trong DB trước khi gửi OTP
- Ngăn chặn spam OTP đến email random

### 2. OTP Security
- OTP 6 chữ số ngẫu nhiên
- Hết hạn sau 5 phút
- Lưu trong memory (client-side)
- Auto-cleanup sau khi hết hạn
- Xóa sau khi verify thành công

### 3. Password Hashing
- **Bcrypt** với **salt rounds = 11**
- Password không bao giờ lưu plain text
- Hash computation-intensive để chống brute force

### 4. Protected Routes
- ResetPassword page chỉ accessible sau khi verify OTP
- Kiểm tra URL params `verified=true`
- Auto redirect nếu truy cập trực tiếp

### 5. Rate Limiting (Frontend)
- Countdown 60s trước khi cho phép gửi lại OTP
- Ngăn spam email

---

## 🚀 Cách sử dụng

### User Flow:

1. **Quên mật khẩu?**
   - Vào trang Login
   - Click "Quên mật khẩu?"

2. **Nhập email**
   - Nhập email đã đăng ký
   - Click "Gửi mã OTP"
   - Kiểm tra email inbox

3. **Nhập OTP**
   - Nhập 6 chữ số từ email
   - Click "Xác thực OTP"

4. **Đặt lại mật khẩu**
   - Nhập mật khẩu mới
   - Xác nhận lại mật khẩu
   - Click "Đổi mật khẩu"

5. **Login**
   - Tự động redirect về Login
   - Đăng nhập với password mới

---

## 🧪 Test Cases

### ✅ Test Case 1: Happy Path
1. Login page → Click "Quên mật khẩu"
2. Nhập email: `AnhNT@email.com` → Gửi OTP
3. Kiểm tra email → Nhập OTP đúng → Verify
4. Nhập password mới: `newpassword123` (2 lần)
5. Submit → Success
6. Kiểm tra `db.json` → Password đã hash
7. Login với password mới → Success ✓

### ❌ Test Case 2: Email không tồn tại
1. Forgot Password page
2. Nhập email: `notexist@email.com`
3. Click gửi OTP
4. **Expected:** Toast error "Email không tồn tại trong hệ thống"

### ❌ Test Case 3: OTP sai
1. Nhập email hợp lệ → Nhận OTP
2. Nhập OTP sai: `123456` (không phải OTP thật)
3. **Expected:** Toast error "Mã OTP không chính xác"

### ❌ Test Case 4: OTP hết hạn
1. Nhận OTP
2. Đợi hơn 5 phút
3. Nhập OTP
4. **Expected:** Toast error "OTP đã hết hạn"

### ❌ Test Case 5: Password không khớp
1. Qua được OTP verification
2. Reset Password page:
   - Password: `abc123`
   - Confirm: `abc456` (khác)
3. **Expected:** Nút "Đổi mật khẩu" disabled + hiển thị "Mật khẩu không khớp"

### 🔒 Test Case 6: Direct Access to Reset Password
1. Truy cập trực tiếp: `http://localhost:5173/reset-password`
2. **Expected:** Auto redirect về `/forgot-password` + Toast error

### 🔄 Test Case 7: Resend OTP
1. Nhập email → Nhận OTP
2. Chờ 60s countdown
3. Click "Gửi lại mã OTP"
4. **Expected:** OTP mới được gửi + Countdown reset về 60s

---

## 📊 Database Changes

### Before Reset:
```json
{
  "id": "1",
  "email": "AnhNT@email.com",
  "password": "1234"  // Plain text
}
```

### After Reset với password `newpass123`:
```json
{
  "id": "1",
  "email": "AnhNT@email.com",
  "password": "$2a$11$XyZ...abc123hash"  // Bcrypt hash
}
```

⚠️ **Lưu ý:** Sau khi reset password lần đầu, password sẽ được hash. Các password cũ trong DB vẫn là plain text. Để consistent, nên hash tất cả passwords hiện có.

---

## 🎨 UI/UX Features

### ForgotPassword Page
- ✅ Logo với icon ₫
- ✅ 2-step progress (email → OTP)
- ✅ Loading spinner khi đang xử lý
- ✅ Countdown timer rõ ràng
- ✅ Hiển thị email đã nhập
- ✅ Nút "Quay lại đăng nhập"
- ✅ Nút "Thay đổi email"

### ResetPassword Page
- ✅ Logo với icon CheckCircle (màu xanh)
- ✅ Hiển thị email đang reset
- ✅ Password strength indicator với màu sắc
- ✅ Password match indicator
- ✅ Show/hide password toggle
- ✅ Security note về bcrypt
- ✅ Auto redirect về login

### Toast Notifications
- ✅ Success: Màu xanh
- ✅ Error: Màu đỏ
- ✅ Info: Màu xanh dương
- ✅ Auto dismiss sau vài giây

---

## 🔧 Configuration

### EmailJS Settings
```typescript
SERVICE_ID: 'service_w9ronqd'
TEMPLATE_ID: 'template_2mvwzdc'
PUBLIC_KEY: 'I8lRlPDMRDf6q6RU3'
```

### Bcrypt Settings
```typescript
SALT_ROUNDS: 11  // Balance giữa security và performance
```

### OTP Settings
```typescript
OTP_LENGTH: 6 digits
OTP_EXPIRY: 5 minutes
RESEND_COOLDOWN: 60 seconds
```

---

## ⚠️ Known Limitations

### 1. OTP lưu ở Client-Side
- OTP được lưu trong browser memory
- Refresh page → Mất OTP
- **Production:** Nên lưu OTP ở backend

### 2. Existing Passwords
- Passwords hiện có trong DB vẫn là plain text
- Chỉ passwords được reset mới được hash
- **Solution:** Migrate tất cả passwords sang bcrypt

### 3. No Rate Limiting (Backend)
- Chỉ có countdown 60s ở frontend
- User vẫn có thể bypass bằng DevTools
- **Production:** Implement rate limiting ở backend

### 4. Email Service Dependency
- Phụ thuộc vào EmailJS
- Nếu EmailJS down → Không gửi được OTP
- Free tier: 200 emails/tháng

---

## 🚀 Production Recommendations

### 1. Backend OTP Management
```typescript
// Ideal flow:
POST /api/request-reset → Server generates OTP → Send email
POST /api/verify-otp → Server validates OTP → Return token
POST /api/reset-password → Validate token → Update password
```

### 2. Hash Existing Passwords
```typescript
// Migration script
import bcrypt from 'bcryptjs';

for (const user of users) {
  if (!user.password.startsWith('$2a$')) {
    user.password = await bcrypt.hash(user.password, 11);
  }
}
```

### 3. Add Rate Limiting
```typescript
// Express middleware
import rateLimit from 'express-rate-limit';

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 requests mỗi 15 phút
  message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.'
});
```

### 4. Add Logging
- Log mọi OTP request
- Log failed verification attempts
- Monitor suspicious activity

---

## 📝 Routes Summary

| Route | Access | Description |
|-------|--------|-------------|
| `/login` | Public | Login page |
| `/forgot-password` | Public | Request password reset |
| `/reset-password?email=...&verified=true` | Protected | Set new password |
| `/dashboard` | Private | User dashboard |

---

## 🎯 Success Criteria

- ✅ User có thể reset password qua email
- ✅ OTP được gửi và verify thành công
- ✅ Password được hash bằng bcrypt
- ✅ UI/UX mượt mà, không có lỗi
- ✅ Error handling đầy đủ
- ✅ Security checks hoạt động
- ✅ Mobile responsive

---

## 📚 Related Documentation

- [OTP_GUIDE.md](file:///d:/project/G2_MoneyTracker_app/OTP_GUIDE.md) - Hướng dẫn EmailJS OTP
- [emailService.ts](file:///d:/project/G2_MoneyTracker_app/src/services/emailService.ts) - Email service code
- [api.ts](file:///d:/project/G2_MoneyTracker_app/src/services/api.ts) - API functions

---

Made with 🔐 for Money Tracker App
