import { useState } from 'react';
import { sendOTPEmail, generateOTP, otpStorage } from '../services/emailService';
import { toast } from 'sonner';
import { Mail, Lock, Send, CheckCircle } from 'lucide-react';

interface OTPVerificationProps {
    onVerificationSuccess?: (email: string) => void;
    onVerificationFailed?: () => void;
    className?: string;
}

export function OTPVerification({
    onVerificationSuccess,
    onVerificationFailed,
    className = ''
}: OTPVerificationProps) {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [isOTPSent, setIsOTPSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);

    // Hàm gửi OTP
    const handleSendOTP = async () => {
        // Validate email
        if (!email) {
            toast.error('Vui lòng nhập email');
            return;
        }

        if (!email.includes('@')) {
            toast.error('Email không hợp lệ');
            return;
        }

        setLoading(true);

        try {
            // Tạo OTP
            const otpCode = generateOTP();

            // Gửi email
            const result = await sendOTPEmail(email, otpCode);

            if (result.success) {
                // Lưu OTP vào storage
                otpStorage.save(email, otpCode, 5); // Hết hạn sau 5 phút

                setIsOTPSent(true);
                toast.success(result.message);

                // Start countdown 60s trước khi cho phép gửi lại
                setCountdown(60);
                const interval = setInterval(() => {
                    setCountdown((prev) => {
                        if (prev <= 1) {
                            clearInterval(interval);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            } else {
                toast.error(result.message);
            }
        } catch (error: any) {
            console.error('Error:', error);
            toast.error('Có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    // Hàm xác thực OTP
    const handleVerifyOTP = () => {
        if (!otp) {
            toast.error('Vui lòng nhập mã OTP');
            return;
        }

        if (otp.length !== 6) {
            toast.error('Mã OTP phải có 6 chữ số');
            return;
        }

        // Verify OTP
        const result = otpStorage.verify(email, otp);

        if (result.valid) {
            toast.success(result.message);
            onVerificationSuccess?.(email);
            // Reset form
            setEmail('');
            setOtp('');
            setIsOTPSent(false);
        } else {
            toast.error(result.message);
            onVerificationFailed?.();
        }
    };

    // Hàm gửi lại OTP
    const handleResendOTP = () => {
        setOtp('');
        setIsOTPSent(false);
        handleSendOTP();
    };

    // Handle Enter key
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (!isOTPSent) {
                handleSendOTP();
            } else {
                handleVerifyOTP();
            }
        }
    };

    return (
        <div className={`max-w-md mx-auto p-6 bg-white rounded-lg shadow-md ${className}`}>
            <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                    <Mail className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Xác thực Email</h2>
                <p className="text-gray-600 mt-2">
                    {!isOTPSent
                        ? 'Nhập email để nhận mã OTP'
                        : 'Nhập mã OTP đã được gửi đến email của bạn'}
                </p>
            </div>

            <div className="space-y-4">
                {/* Email Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="example@gmail.com"
                            disabled={isOTPSent || loading}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                    </div>
                </div>

                {/* OTP Input (hiển thị khi đã gửi OTP) */}
                {isOTPSent && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mã OTP
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '');
                                    if (value.length <= 6) {
                                        setOtp(value);
                                    }
                                }}
                                onKeyPress={handleKeyPress}
                                placeholder="Nhập 6 chữ số"
                                maxLength={6}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest font-bold"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                            Mã OTP có hiệu lực trong 5 phút
                        </p>
                    </div>
                )}

                {/* Buttons */}
                <div className="space-y-3">
                    {!isOTPSent ? (
                        <button
                            onClick={handleSendOTP}
                            disabled={loading || !email}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Đang gửi...
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    Gửi mã OTP
                                </>
                            )}
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={handleVerifyOTP}
                                disabled={!otp || otp.length !== 6}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                <CheckCircle className="w-5 h-5" />
                                Xác thực
                            </button>

                            <button
                                onClick={handleResendOTP}
                                disabled={countdown > 0 || loading}
                                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                            >
                                {countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại mã OTP'}
                            </button>

                            <button
                                onClick={() => {
                                    setIsOTPSent(false);
                                    setOtp('');
                                }}
                                className="w-full text-blue-600 hover:text-blue-700 font-medium py-2 transition-colors"
                            >
                                Thay đổi email
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default OTPVerification;
