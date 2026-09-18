import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { getHomePath } from '../../utils/roleHome.js';

export default function ChangePasswordPage() {
  const { user, changePassword } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!user) return <Navigate to="/login" replace />;
  if (!user.mustChangePassword) {
    return <Navigate to={getHomePath(user.role)} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    setSubmitting(true);
    try {
      const updatedUser = await changePassword(currentPassword, newPassword);
      navigate(getHomePath(updatedUser.role), { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Đổi mật khẩu thất bại');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-gray-950">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-900 via-gray-950 to-gray-950" />
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-600/30 rounded-full blur-3xl" />

      <div className="relative w-full max-w-sm animate-fade-in">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xl shadow-popover mb-3">
            🔒
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight text-center">Đổi mật khẩu lần đầu</h1>
          <p className="text-sm text-gray-400 mt-1 text-center max-w-xs">
            Mật khẩu hiện tại của bạn là email đăng nhập. Vui lòng đặt mật khẩu mới trước khi tiếp tục.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-popover p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="field-label">Mật khẩu hiện tại (email)</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="field-label">Mật khẩu mới</label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="field-label">Xác nhận mật khẩu mới</label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input"
            />
          </div>
          {error && <p className="alert-error animate-fade-in">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full"
          >
            {submitting ? 'Đang lưu...' : 'Đổi mật khẩu'}
          </button>
        </form>
        </div>
      </div>
    </div>
  );
}
