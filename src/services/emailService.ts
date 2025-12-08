import emailjs from '@emailjs/browser';

// EmailJS Configuration
const EMAILJS_SERVICE_ID = 'service_w9ronqd';
const EMAILJS_TEMPLATE_ID = 'template_2mvwzdc';
const EMAILJS_PUBLIC_KEY = 'I8lRlPDMRDf6q6RU3';

/**
 * Tạo mã OTP ngẫu nhiên 6 chữ số
 */
export function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Gửi OTP qua email sử dụng EmailJS
 * @param recipientEmail - Email người nhận
 * @param otp - Mã OTP cần gửi
 * @returns Promise với kết quả gửi email
 */
export async function sendOTPEmail(
    recipientEmail: string,
    otp: string
): Promise<{ success: boolean; message: string }> {
    try {
        // Validate email
        if (!recipientEmail || !recipientEmail.includes('@')) {
            return {
                success: false,
                message: 'Email không hợp lệ',
            };
        }

        // Template parameters - SIMPLIFIED để tránh lỗi 422
        // Chỉ gửi những field cần thiết nhất
        const templateParams = {
            to_email: recipientEmail,
            to_name: recipientEmail.split('@')[0], // Lấy phần trước @
            from_name: 'Money Tracker',
            message: `Mã OTP của bạn là: ${otp}\n\nMã này có hiệu lực trong 5 phút.\n\nNếu bạn không yêu cầu mã này, vui lòng bỏ qua email.`,
            otp_code: otp,
        };

        console.log('Đang gửi OTP đến:', recipientEmail);
        console.log('Template params:', templateParams);

        const response = await emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_TEMPLATE_ID,
            templateParams,
            EMAILJS_PUBLIC_KEY
        );

        if (response.status === 200) {
            console.log('✅ Email gửi thành công:', response);
            return {
                success: true,
                message: 'OTP đã được gửi đến email của bạn',
            };
        }

        return {
            success: false,
            message: 'Không thể gửi email. Vui lòng thử lại.',
        };
    } catch (error: any) {
        console.error('❌ Lỗi khi gửi email:', error);

        // Xử lý các lỗi cụ thể
        if (error.text) {
            return {
                success: false,
                message: `Lỗi: ${error.text}`,
            };
        }

        return {
            success: false,
            message: 'Không thể gửi email. Vui lòng kiểm tra kết nối mạng.',
        };
    }
}

/**
 * Interface cho OTP Store
 */
interface OTPData {
    otp: string;
    expiresAt: number;
}

/**
 * Lưu trữ OTP tạm thời (chỉ dùng trong môi trường development)
 * Trong production nên lưu ở backend hoặc sử dụng sessionStorage với mã hóa
 */
class OTPStorage {
    private storage: Map<string, OTPData> = new Map();

    /**
     * Lưu OTP với thời gian hết hạn
     */
    save(email: string, otp: string, expiryMinutes: number = 5): void {
        const expiresAt = Date.now() + expiryMinutes * 60 * 1000;
        this.storage.set(email, { otp, expiresAt });

        // Auto cleanup sau khi hết hạn
        setTimeout(() => {
            this.delete(email);
        }, expiryMinutes * 60 * 1000);
    }

    /**
     * Xác thực OTP
     */
    verify(email: string, otp: string): { valid: boolean; message: string } {
        const data = this.storage.get(email);

        if (!data) {
            return {
                valid: false,
                message: 'OTP không tồn tại hoặc đã hết hạn',
            };
        }

        if (Date.now() > data.expiresAt) {
            this.delete(email);
            return {
                valid: false,
                message: 'OTP đã hết hạn. Vui lòng gửi lại mã mới.',
            };
        }

        if (data.otp !== otp) {
            return {
                valid: false,
                message: 'Mã OTP không chính xác',
            };
        }

        this.delete(email);
        return {
            valid: true,
            message: 'Xác thực OTP thành công',
        };
    }

    /**
     * Xóa OTP
     */
    delete(email: string): void {
        this.storage.delete(email);
    }

    /**
     * Kiểm tra OTP còn tồn tại không
     */
    exists(email: string): boolean {
        return this.storage.has(email);
    }
}

// Export instance để sử dụng toàn ứng dụng
export const otpStorage = new OTPStorage();
