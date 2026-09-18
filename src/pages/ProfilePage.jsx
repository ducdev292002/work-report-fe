import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [profileError, setProfileError] = useState('');
  const [profileFeedback, setProfileFeedback] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordFeedback, setPasswordFeedback] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  async function handleSaveProfile(e) {
    e.preventDefault();
    setProfileError('');
    setProfileFeedback('');
    setSavingProfile(true);
    try {
      await api.patch('/auth/profile', { name, email });
      await refresh();
      setProfileFeedback('Đã cập nhật thông tin cá nhân');
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPasswordError('');
    setPasswordFeedback('');
    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp');
      return;
    }
    setSavingPassword(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordFeedback('Đã đổi mật khẩu thành công');
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Đổi mật khẩu thất bại');
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="page-title">Hồ sơ cá nhân</h1>

      <form onSubmit={handleSaveProfile} className="card space-y-3">
        <h2 className="card-title">Thông tin cơ bản</h2>
        <div>
          <label className="field-label">Họ tên</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="field-label">Email (dùng làm username)</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />
          <p className="text-xs text-gray-500 mt-1">Nếu đổi email, lần đăng nhập sau bạn cần dùng email mới.</p>
        </div>
        {profileError && <p className="alert-error">{profileError}</p>}
        {profileFeedback && <p className="alert-success">{profileFeedback}</p>}
        <button
          type="submit"
          disabled={savingProfile}
          className="btn-primary"
        >
          {savingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </form>

      <form onSubmit={handleChangePassword} className="card space-y-3">
        <h2 className="card-title">Đổi mật khẩu</h2>
        <div>
          <label className="field-label">Mật khẩu hiện tại</label>
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
        {passwordError && <p className="alert-error">{passwordError}</p>}
        {passwordFeedback && <p className="alert-success">{passwordFeedback}</p>}
        <button
          type="submit"
          disabled={savingPassword}
          className="btn-secondary"
        >
          {savingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}
        </button>
      </form>
    </div>
  );
}
