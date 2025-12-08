import OTPVerification from '../components/OTPVerification';

function OTPTestPage() {
    const handleVerificationSuccess = (email: string) => {
        console.log('✅ Xác thực thành công cho email:', email);
        alert(`Xác thực thành công!\nEmail: ${email}`);
        // Ở đây bạn có thể:
        // - Chuyển hướng đến trang khác
        // - Cập nhật trạng thái user
        // - Gọi API để xác nhận
    };

    const handleVerificationFailed = () => {
        console.log('❌ Xác thực thất bại');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <OTPVerification
                onVerificationSuccess={handleVerificationSuccess}
                onVerificationFailed={handleVerificationFailed}
            />
        </div>
    );
}

export default OTPTestPage;
