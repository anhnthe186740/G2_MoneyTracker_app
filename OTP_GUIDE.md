# 📧 Hướng dẫn sử dụng EmailJS OTP

## ✅ Đã hoàn thành

Đã cài đặt và cấu hình EmailJS để gửi OTP qua email với các thông tin sau:
- **Service ID**: `service_w9ronqd`
- **Template ID**: `template_2mvwzdc`
- **Public Key**: `I8lRlPDMRDf6q6RU3`

## 📁 Files đã tạo

### 1. `src/services/emailService.ts`
Service xử lý:
- ✅ Tạo mã OTP ngẫu nhiên 6 chữ số
- ✅ Gửi OTP qua email bằng EmailJS
- ✅ Lưu trữ và xác thực OTP
- ✅ Quản lý thời gian hết hạn (5 phút)

### 2. `src/components/OTPVerification.tsx`
Component UI hoàn chỉnh với:
- ✅ Form nhập email
- ✅ Form nhập OTP
- ✅ Nút gửi/gửi lại OTP
- ✅ Countdown timer (60s)
- ✅ Loading states
- ✅ Error handling
- ✅ Responsive design

### 3. `src/pages/OTPTestPage.tsx`
Trang test chức năng OTP

## 🚀 Cách sử dụng

### Bước 1: Cấu hình EmailJS Template

Vào dashboard EmailJS của bạn và đảm bảo template có các biến sau:

```
{{to_email}}     - Email người nhận
{{otp_code}}     - Mã OTP
{{app_name}}     - Tên ứng dụng (Money Tracker)
{{expiry_time}}  - Thời gian hết hạn (5 phút)
```

**Ví dụ template:**
```
Subject: Mã OTP xác thực - {{app_name}}

Xin chào,

Mã OTP của bạn là: {{otp_code}}

Mã này có hiệu lực trong {{expiry_time}}.

Trân trọng,
{{app_name}} Team
```

### Bước 2: Test chức năng

Chạy ứng dụng:
```bash
npm run dev
```

Truy cập: `http://localhost:5173/otp-test`

### Bước 3: Sử dụng trong code của bạn

#### Cách 1: Sử dụng Component có sẵn

```tsx
import OTPVerification from '../components/OTPVerification';

function YourPage() {
  const handleSuccess = (email: string) => {
    console.log('Xác thực thành công:', email);
    // Tiếp tục logic của bạn
  };

  return (
    <OTPVerification onVerificationSuccess={handleSuccess} />
  );
}
```

#### Cách 2: Tự custom logic

```tsx
import { sendOTPEmail, generateOTP, otpStorage } from './services/emailService';
import { toast } from 'sonner';

function YourComponent() {
  const handleSendOTP = async (email: string) => {
    const otp = generateOTP();
    const result = await sendOTPEmail(email, otp);
    
    if (result.success) {
      otpStorage.save(email, otp, 5); // Lưu 5 phút
      toast.success('OTP đã gửi!');
    } else {
      toast.error(result.message);
    }
  };

  const handleVerifyOTP = (email: string, otp: string) => {
    const result = otpStorage.verify(email, otp);
    
    if (result.valid) {
      toast.success('Xác thực thành công!');
    } else {
      toast.error(result.message);
    }
  };
}
```

## 🔧 API Reference

### `generateOTP()`
Tạo mã OTP ngẫu nhiên 6 chữ số
```ts
const otp = generateOTP(); // "123456"
```

### `sendOTPEmail(email, otp)`
Gửi OTP qua email
```ts
const result = await sendOTPEmail('user@example.com', '123456');
// { success: true, message: "OTP đã được gửi..." }
```

### `otpStorage.save(email, otp, minutes)`
Lưu OTP với thời gian hết hạn
```ts
otpStorage.save('user@example.com', '123456', 5); // 5 phút
```

### `otpStorage.verify(email, otp)`
Xác thực OTP
```ts
const result = otpStorage.verify('user@example.com', '123456');
// { valid: true, message: "Xác thực OTP thành công" }
```

### `otpStorage.delete(email)`
Xóa OTP
```ts
otpStorage.delete('user@example.com');
```

## 📝 Lưu ý quan trọng

### ⚠️ Bảo mật
- OTP được lưu trong memory (Map), sẽ mất khi refresh trang
- Trong production, nên lưu OTP ở backend hoặc dùng Redis
- Không nên lưu OTP trong localStorage (dễ bị đánh cắp)

### 🔒 Best Practices
1. **Giới hạn số lần gửi**: Thêm rate limiting để tránh spam
2. **Giới hạn số lần thử**: Khóa sau 3-5 lần nhập sai
3. **Log activity**: Ghi log các hoạt động gửi/xác thực OTP
4. **Backend validation**: Luôn xác thực lại ở backend

## 🎨 Tùy chỉnh UI

Component `OTPVerification` hỗ trợ props:

```tsx
interface OTPVerificationProps {
  onVerificationSuccess?: (email: string) => void;
  onVerificationFailed?: () => void;
  className?: string; // Custom CSS classes
}
```

## 🐛 Troubleshooting

### Email không được gửi?
1. Kiểm tra Service ID, Template ID, Public Key
2. Kiểm tra console log có lỗi gì không
3. Vào EmailJS dashboard xem email history
4. Kiểm tra kết nối internet

### OTP không đúng?
1. Đảm bảo nhập đúng 6 chữ số
2. Kiểm tra OTP chưa hết hạn (5 phút)
3. Không refresh trang (OTP sẽ mất)

### Template variables không hoạt động?
1. Kiểm tra tên biến trong template khớp với code
2. Tên biến phải chính xác: `{{to_email}}`, `{{otp_code}}`, etc.

## 📊 Giới hạn EmailJS Free Tier
- 200 emails/tháng miễn phí
- Nếu vượt quá, cần nâng cấp lên paid plan

## 🚀 Next Steps

Bạn có thể tích hợp OTP vào:
- **Đăng ký tài khoản**: Xác thực email khi đăng ký
- **Quên mật khẩu**: Reset password bằng OTP
- **2FA**: Xác thực 2 yếu tố
- **Xác nhận giao dịch**: Confirm các giao dịch quan trọng

---

Made with ❤️ using EmailJS
