import { useState } from 'react';
import { Link } from 'react-router-dom';
import { checkEmailExists } from '../services/api';
import { sendOTPEmail, generateOTP, otpStorage } from '../services/emailService';
import { toast } from 'sonner';
import { Mail, ArrowLeft, Send, Lock, Loader2 } from 'lucide-react';

export default function ForgotPassword() {
    const [step, setStep] = useState<'email' | 'otp'>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);

    // Step 1: Gửi OTP
    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();

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
            // Kiểm tra email có tồn tại không
            const emailExists = await checkEmailExists(email);

            if (!emailExists) {
                toast.error('Email không tồn tại trong hệ thống');
                setLoading(false);
                return;
            }

            // Tạo và gửi OTP
            const otpCode = generateOTP();
            const result = await sendOTPEmail(email, otpCode);

            if (result.success) {
                // Lưu OTP
                otpStorage.save(email, otpCode, 5);

                // Chuyển sang step OTP
                setStep('otp');
                toast.success('Mã OTP đã được gửi đến email của bạn');

                // Start countdown
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
        } catch (error) {
            console.error('Error:', error);
            toast.error('Có lỗi xảy ra. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP và chuyển sang ResetPassword
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
            // Chuyển sang trang reset password với email đã verify
            window.location.href = `/reset-password?email=${encodeURIComponent(email)}&verified=true`;
        } else {
            toast.error(result.message);
        }
    };

    // Gửi lại OTP
    const handleResendOTP = async () => {
        setOtp('');
        setLoading(true);

        const otpCode = generateOTP();
        const result = await sendOTPEmail(email, otpCode);

        if (result.success) {
            otpStorage.save(email, otpCode, 5);
            toast.success('Mã OTP mới đã được gửi');

            // Restart countdown
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

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <div className="bg-indigo-600 rounded-2xl p-4 shadow-lg">
                        <span className="text-white text-4xl font-bold">₫</span>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 border border-gray-200 dark:border-slate-800">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-foreground mb-2">
                            Quên mật khẩu?
                        </h1>
                        <p className="text-muted-foreground">
                            {step === 'email'
                                ? 'Nhập email để nhận mã xác thực'
                                : 'Nhập mã OTP đã được gửi đến email'}
                        </p>
                    </div>

                    {/* Step 1: Email Input */}
                    {step === 'email' && (
                        <form onSubmit={handleSendOTP} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="example@gmail.com"
                                        className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-white dark:bg-slate-900 text-foreground"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-xl transition flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Đang gửi...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-5 w-5" />
                                        Gửi mã OTP
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    {/* Step 2: OTP Verification */}
                    {step === 'otp' && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Mã OTP
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '');
                                            if (value.length <= 6) {
                                                setOtp(value);
                                            }
                                        }}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                handleVerifyOTP();
                                            }
                                        }}
                                        placeholder="Nhập 6 chữ số"
                                        maxLength={6}
                                        className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-center text-2xl tracking-widest font-bold bg-white dark:bg-slate-900 text-foreground"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground mt-2 text-center">
                                    Mã OTP có hiệu lực trong 5 phút
                                </p>
                            </div>

                            <button
                                onClick={handleVerifyOTP}
                                disabled={!otp || otp.length !== 6}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 rounded-xl transition flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                <Lock className="h-5 w-5" />
                                Xác thực OTP
                            </button>

                            <button
                                onClick={handleResendOTP}
                                disabled={countdown > 0 || loading}
                                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-xl transition disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                            >
                                {countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại mã OTP'}
                            </button>


                        </div>
                    )}

                    {/* Back to Login */}
                    <div className="mt-8 text-center">
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Quay lại đăng nhập
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
