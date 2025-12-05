// email-server.js
import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Create email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email configuration error:', error);
    console.log('\n⚠️  Vui lòng kiểm tra file .env với thông tin:');
    console.log('   EMAIL_USER=your-email@gmail.com');
    console.log('   EMAIL_PASS=your-app-password');
  } else {
    console.log('✅ Email server is ready to send emails');
  }
});

// Send OTP endpoint
app.post('/api/send-otp', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      error: 'Email và OTP là bắt buộc'
    });
  }

  // Check if email is configured
  const emailConfigured = process.env.EMAIL_USER && process.env.EMAIL_PASS;

  if (!emailConfigured) {
    // Fallback to console mode for testing
    console.log('\n' + '='.repeat(60));
    console.log('📧 OTP EMAIL (CONSOLE MODE - Email chưa được cấu hình)');
    console.log('='.repeat(60));
    console.log(`To: ${email}`);
    console.log(`Subject: 🔐 Mã OTP đặt lại mật khẩu - Money Tracker`);
    console.log(`\nMã OTP của bạn là: ${otp}`);
    console.log(`Mã này sẽ hết hạn sau 5 phút.`);
    console.log('='.repeat(60));
    console.log('⚠️  Để gửi email thật, vui lòng cấu hình EMAIL_USER và EMAIL_PASS trong file .env');
    console.log('='.repeat(60) + '\n');

    return res.json({
      success: true,
      message: 'OTP đã được hiển thị trong console (Email chưa cấu hình)'
    });
  }

  // Email options
  const mailOptions = {
    from: `"Money Tracker App" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🔐 Mã OTP đặt lại mật khẩu - Money Tracker',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: white;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .otp-box {
            background: #f0f4ff;
            border: 2px dashed #667eea;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
            border-radius: 8px;
          }
          .otp-code {
            font-size: 36px;
            font-weight: bold;
            color: #667eea;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
          }
          .warning {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 Money Tracker</h1>
            <p>Đặt lại mật khẩu</p>
          </div>
          <div class="content">
            <h2>Xin chào!</h2>
            <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản Money Tracker của mình.</p>
            
            <div class="otp-box">
              <p style="margin: 0; color: #666;">Mã OTP của bạn là:</p>
              <div class="otp-code">${otp}</div>
            </div>

            <div class="warning">
              <strong>⚠️ Lưu ý:</strong>
              <ul style="margin: 10px 0;">
                <li>Mã OTP này sẽ hết hạn sau <strong>5 phút</strong></li>
                <li>Không chia sẻ mã này với bất kỳ ai</li>
                <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này</li>
              </ul>
            </div>

            <p>Trân trọng,<br><strong>Money Tracker Team</strong></p>
          </div>
          <div class="footer">
            <p>Email này được gửi tự động, vui lòng không trả lời.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP sent successfully to ${email}`);
    res.json({ success: true, message: 'Email đã được gửi thành công' });
  } catch (error) {
    console.error('❌ Error sending email:', error);
    res.status(500).json({
      success: false,
      error: 'Không thể gửi email. Vui lòng kiểm tra cấu hình email hoặc thử lại sau.'
    });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 Email server running on http://localhost:${PORT}`);

  const emailConfigured = process.env.EMAIL_USER && process.env.EMAIL_PASS;

  if (emailConfigured) {
    console.log(`📧 Email Mode: Gửi email qua ${process.env.EMAIL_USER}`);
  } else {
    console.log(`📋 Console Mode: OTP sẽ hiển thị trong console (Email chưa cấu hình)`);
    console.log(`💡 Để gửi email thật, hãy cấu hình file .env`);
  }
  console.log('');
});
