import axios from 'axios';
import bcrypt from 'bcryptjs';


const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL,
});

export default api;

// ===== FORGOT PASSWORD API FUNCTIONS =====

/**
 * Kiểm tra xem email có tồn tại trong hệ thống không
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const response = await api.get(`/users?email=${email}`);
    return response.data && response.data.length > 0;
  } catch (error) {
    console.error('Error checking email:', error);
    return false;
  }
}

/**
 * Lấy thông tin user theo email
 */
export async function getUserByEmail(email: string) {
  try {
    const response = await api.get(`/users?email=${email}`);
    if (response.data && response.data.length > 0) {
      return response.data[0];
    }
    return null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}

/**
 * Cập nhật password cho user (với bcrypt hash)
 * @param email - Email của user
 * @param newPassword - Password mới (plain text)
 * @param saltRounds - Số rounds cho bcrypt (mặc định 11)
 */
export async function updatePassword(
  email: string,
  newPassword: string,
  saltRounds: number = 11
): Promise<{ success: boolean; message: string }> {
  try {
    // Lấy user
    const user = await getUserByEmail(email);
    if (!user) {
      return {
        success: false,
        message: 'Email không tồn tại trong hệ thống',
      };
    }

    // Hash password mới
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Cập nhật password
    await api.patch(`/users/${user.id}`, {
      password: hashedPassword,
    });

    return {
      success: true,
      message: 'Cập nhật mật khẩu thành công',
    };
  } catch (error: any) {
    console.error('Error updating password:', error);
    return {
      success: false,
      message: error.message || 'Có lỗi xảy ra khi cập nhật mật khẩu',
    };
  }
}