import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { getHomePath } from '../../utils/roleHome.js';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    const from = location.state?.from?.pathname || getHomePath(user.role);
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const loggedInUser = await login(email, password);
      navigate(getHomePath(loggedInUser.role), { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-gray-950">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-900 via-gray-950 to-gray-950" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-600/30 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-brand-400/20 rounded-full blur-3xl" />

      <div className="relative w-full max-w-sm animate-fade-in">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xl font-bold shadow-popover mb-3">
            W
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Quản lý & Báo cáo công việc</h1>
          <p className="text-sm text-gray-400 mt-1">Đăng nhập để tiếp tục</p>
        </div>

        <div className="bg-white rounded-2xl shadow-popover p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="field-label">Email</label>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="ban@congty.com"
              />
            </div>
            <div>
              <label className="field-label">Mật khẩu</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
              />
            </div>
            {error && <p className="alert-error animate-fade-in">{error}</p>}
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-gray-500 mt-5">
          Tài khoản do quản trị viên cấp. Liên hệ admin nếu bạn chưa có tài khoản.
        </p>
      </div>
    </div>
  );
}
