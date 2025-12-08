# 🔧 Hướng dẫn Setup EmailJS Template

## ⚠️ Lỗi 422 - Template Configuration Issue

Nếu bạn nhận lỗi **422 (Unprocessable Entity)** khi gửi OTP, có nghĩa là template trong EmailJS dashboard chưa được setup đúng.

---

## 📋 Bước 1: Truy cập EmailJS Dashboard

1. Đăng nhập vào: https://dashboard.emailjs.com/
2. Navigate đến **Email Templates**
3. Tìm template có ID: `template_2mvwzdc`
4. Click **Edit**

---

## 📝 Bước 2: Update Template Content

### **Subject (Tiêu đề email):**
```
🔐 Mã OTP xác thực - Money Tracker
```

### **Content (Nội dung email):**

Chọn **HTML Content** và paste code sau:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f5f5f5;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 30px;
      text-align: center;
      color: white;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 16px;
      color: #333;
      margin-bottom: 20px;
    }
    .otp-container {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 25px;
      border-radius: 10px;
      text-align: center;
      margin: 30px 0;
    }
    .otp {
      font-size: 36px;
      font-weight: bold;
      color: white;
      letter-spacing: 8px;
      margin: 0;
      font-family: 'Courier New', monospace;
    }
    .info {
      background-color: #f8f9fa;
      padding: 15px;
      border-left: 4px solid #667eea;
      border-radius: 4px;
      margin: 20px 0;
    }
    .info p {
      margin: 5px 0;
      font-size: 14px;
      color: #666;
    }
    .warning {
      background-color: #fff3cd;
      padding: 15px;
      border-left: 4px solid #ffc107;
      border-radius: 4px;
      margin: 20px 0;
    }
    .warning p {
      margin: 5px 0;
      font-size: 14px;
      color: #856404;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #999;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>💰 Money Tracker</h1>
    </div>

    <!-- Content -->
    <div class="content">
      <p class="greeting">Xin chào <strong>{{to_name}}</strong>,</p>
      
      <p>Bạn đã yêu cầu mã OTP để đặt lại mật khẩu cho tài khoản Money Tracker của bạn.</p>
      
      <!-- OTP Box -->
      <div class="otp-container">
        <p style="color:white; margin:0 0 10px 0; font-size:14px;">MÃ OTP CỦA BẠN</p>
        <p class="otp">{{otp_code}}</p>
      </div>

      <!-- Info Box -->
      <div class="info">
        <p><strong>⏰ Thời gian hết hạn:</strong> 5 phút kể từ khi nhận email này</p>
        <p><strong>📧 Email:</strong> {{to_email}}</p>
      </div>

      <!-- Warning Box -->
      <div class="warning">
        <p><strong>⚠️ Lưu ý bảo mật:</strong></p>
        <p>• Không chia sẻ mã OTP này với bất kỳ ai</p>
        <p>• Money Tracker sẽ không bao giờ hỏi mã OTP qua điện thoại hoặc email</p>
        <p>• Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email và thay đổi mật khẩu ngay</p>
      </div>

      <p>Trân trọng,<br><strong>{{from_name}} Team</strong></p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>© 2025 Money Tracker. All rights reserved.</p>
      <p>Email được gửi tự động, vui lòng không trả lời email này.</p>
    </div>
  </div>
</body>
</html>
```

**HOẶC** nếu muốn đơn giản (Plain Text):
```
Xin chào {{to_name}},

Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản Money Tracker.

Mã OTP của bạn là: {{otp_code}}

⏰ Mã này có hiệu lực trong 5 phút.

⚠️ Lưu ý:
- Không chia sẻ mã này với bất kỳ ai
- Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email

Trân trọng,
{{from_name}} Team

---
© 2025 Money Tracker
```

---

## 🔑 Bước 3: Template Variables Required

**Đảm bảo template của bạn có các biến sau:**

| Variable | Description | Example |
|----------|-------------|---------|
| `{{to_email}}` | Email người nhận | patu3074@gmail.com |
| `{{to_name}}` | Tên người nhận | patu3074 |
| `{{from_name}}` | Tên người gửi | Money Tracker |
| `{{otp_code}}` | Mã OTP 6 chữ số | 123456 |
| `{{message}}` | (Optional) Message content | - |

> **Important:** Tên biến phải chính xác, có dấu `{{  }}` và không có khoảng trắng thừa.

---

## 🧪 Bước 4: Test Template

1. Trong EmailJS dashboard, click **Test It**
2. Nhập test values:
   ```
   to_email: your-email@gmail.com
   to_name: YourName
   from_name: Money Tracker
   otp_code: 123456
   message: Test message
   ```
3. Click **Send Test Email**
4. Kiểm tra inbox

**Expected result:** Email được gửi thành công với OTP hiển thị đẹp.

---

## ✅ Bước 5: Save & Publish

1. Click **Save**
2. Đảm bảo template đang ở trạng thái **Active**
3. Test lại trong ứng dụng

---

## 🔍 Troubleshooting

### Lỗi vẫn còn sau khi update template?

**Kiểm tra các bước sau:**

#### 1. **Verify Template ID**
```typescript
// Trong emailService.ts
const EMAILJS_TEMPLATE_ID = 'template_2mvwzdc'; // ✓ Đúng không?
```

Cách check:
- Vào EmailJS Dashboard → Email Templates
- Copy Template ID chính xác
- Update lại trong code

#### 2. **Verify Service ID**
```typescript
const EMAILJS_SERVICE_ID = 'service_w9ronqd'; // ✓ Đúng không?
```

Cách check:
- Vào EmailJS Dashboard → Email Services
- Copy Service ID
- Update lại trong code

#### 3. **Verify Public Key**
```typescript
const EMAILJS_PUBLIC_KEY = 'I8lRlPDMRDf6q6RU3'; // ✓ Đúng không?
```

Cách check:
- Vào EmailJS Dashboard → Account → General
- Copy Public Key (User ID)
- Update lại trong code

#### 4. **Check Service Connection**
- EmailJS Dashboard → Email Services
- Click vào service `service_w9ronqd`
- Verify Gmail account đã được connect
- Check "Test Connection" → Should show success

#### 5. **Check Template Status**
- Template phải ở trạng thái **Active**
- Không được Draft
- Click **Publish** nếu cần

#### 6. **Check Email Quota**
- EmailJS Free: 200 emails/month
- Vào Dashboard → Usage
- Nếu hết quota → Upgrade hoặc đợi reset

---

## 🎨 Alternative: Simple Template (Recommended)

Nếu template phức tạp gây lỗi, dùng template đơn giản này:

### Subject:
```
Money Tracker - OTP Code
```

### Body:
```
Hello {{to_name}},

Your OTP code is: {{otp_code}}

This code expires in 5 minutes.

Best regards,
{{from_name}}
```

**Variables needed:**
- `to_name`
- `to_email` 
- `from_name`
- `otp_code`

---

## 📊 Common Error Codes

| Error Code | Meaning | Solution |
|------------|---------|----------|
| **422** | Template variable mismatch | Check template variables |
| **400** | Invalid request format | Verify Service/Template ID |
| **401** | Unauthorized | Check Public Key |
| **404** | Template/Service not found | Verify IDs are correct |
| **429** | Rate limit exceeded | Wait or upgrade plan |

---

## 💡 Tips

### Development Mode
Thêm console.log để debug:
```typescript
console.log('Template params:', templateParams);
console.log('Service ID:', EMAILJS_SERVICE_ID);
console.log('Template ID:', EMAILJS_TEMPLATE_ID);
```

### Production Mode
Xóa console.log và thêm error tracking:
```typescript
try {
  await emailjs.send(...);
} catch (error) {
  // Send to error tracking service (Sentry, etc.)
  console.error('EmailJS Error:', error);
}
```

---

## 🔗 Useful Links

- EmailJS Dashboard: https://dashboard.emailjs.com/
- EmailJS Documentation: https://www.emailjs.com/docs/
- Support: https://www.emailjs.com/support/

---

## ✅ Checklist

Trước khi test lại, đảm bảo:

- [ ] Template đã được tạo trong EmailJS Dashboard
- [ ] Template ID chính xác: `template_2mvwzdc`
- [ ] Service ID chính xác: `service_w9ronqd`
- [ ] Public Key chính xác: `I8lRlPDMRDf6q6RU3`
- [ ] Template có đủ variables: `to_name`, `to_email`, `from_name`, `otp_code`
- [ ] Template đã Save và Active
- [ ] Test email thành công trong dashboard
- [ ] Gmail account đã connect với service
- [ ] Chưa vượt quá 200 emails/month

---

**Sau khi hoàn thành checklist, test lại ứng dụng!** 🚀
