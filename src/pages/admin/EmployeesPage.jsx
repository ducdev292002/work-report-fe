import { useEffect, useState, useCallback, useMemo } from 'react';
import { Plus, Lock, Unlock, KeyRound, Trash2, X } from 'lucide-react';
import api from '../../api/client.js';
import { flattenOrgTree, getVisibleRoots, collectProjects } from '../../utils/orgTree.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useConfirm } from '../../context/ConfirmContext.jsx';
import Pagination from '../../components/Pagination.jsx';
import MultiSelectDropdown from '../../components/MultiSelectDropdown.jsx';

function initials(name = '') {
  return name.trim().split(/\s+/).slice(-2).map((w) => w[0]).join('').toUpperCase();
}

const ROLE_BADGE = { manager: 'badge-brand', employee: 'badge-gray' };
const ROLE_LABEL = { manager: 'Quản lý', employee: 'Nhân viên' };

export default function EmployeesPage() {
  const { user } = useAuth();
  const confirm = useConfirm();
  const isAdmin = user.role === 'admin';
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [scopedProjects, setScopedProjects] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', orgUnit: '', projects: [], role: 'employee' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const [empRes, treeRes] = await Promise.all([
      api.get('/employees', { params: { page, limit } }),
      api.get('/org/tree'),
    ]);
    setEmployees(empRes.data.employees);
    setPagination(empRes.data.pagination);
    const visibleRoots = getVisibleRoots(treeRes.data.tree, user);
    setUnits(flattenOrgTree(visibleRoots));
    setScopedProjects(collectProjects(visibleRoots));
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  useEffect(() => {
    load();
  }, [load]);

  const projectOptions = useMemo(
    () => scopedProjects.map((p) => ({ value: p._id, label: p.name })),
    [scopedProjects]
  );

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/employees', form);
      setForm({ name: '', email: '', orgUnit: '', projects: [], role: 'employee' });
      setShowForm(false);
      setPage(1);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAssignProjects(emp, projectIds) {
    try {
      await api.patch(`/employees/${emp.id}`, { projects: projectIds });
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  }

  async function toggleActive(emp) {
    const action = emp.isActive ? 'Khóa' : 'Mở khóa';
    const ok = await confirm({ title: `${action} tài khoản`, message: `${action} tài khoản "${emp.name}"?`, danger: emp.isActive });
    if (!ok) return;
    await api.patch(`/employees/${emp.id}/active`, { isActive: !emp.isActive });
    load();
  }

  async function resetPassword(emp) {
    const ok = await confirm({
      title: 'Đặt lại mật khẩu',
      message: `Đặt lại mật khẩu của ${emp.name} về mặc định (= email)?`,
    });
    if (!ok) return;
    await api.post(`/employees/${emp.id}/reset-password`);
    alert('Đã đặt lại mật khẩu. Tài khoản sẽ phải đổi mật khẩu ở lần đăng nhập tiếp theo.');
  }

  async function handleDelete(emp) {
    const ok = await confirm({ title: 'Xóa tài khoản', message: `Xóa tài khoản "${emp.name}"?`, danger: true });
    if (!ok) return;
    await api.delete(`/employees/${emp.id}`);
    load();
  }

  if (loading) return <p className="text-gray-500">Đang tải...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="page-title">Nhân viên</h1>
          <p className="page-subtitle">{pagination?.total ?? 0} tài khoản {isAdmin ? 'trong hệ thống' : 'thuộc đơn vị của bạn'}</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary-sm">
          {showForm ? <X size={14} /> : <Plus size={14} />}
          {showForm ? 'Đóng' : 'Tạo tài khoản'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card space-y-3 max-w-md mb-4 animate-fade-in">
          <div>
            <label className="field-label">Họ tên</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="input"
            />
          </div>
          <div>
            <label className="field-label">Email (dùng làm username)</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="input"
            />
          </div>
          <div>
            <label className="field-label">Đơn vị</label>
            <select
              required
              value={form.orgUnit}
              onChange={(e) => setForm((f) => ({ ...f, orgUnit: e.target.value }))}
              className="input"
            >
              <option value="">-- Chọn đơn vị --</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {'—'.repeat(u.depth)} {u.name} ({u.type === 'department' ? 'Phòng ban' : 'Nhóm'})
                </option>
              ))}
            </select>
          </div>
          {projectOptions.length > 0 && (
            <div>
              <label className="field-label">Dự án (tùy chọn, chọn được nhiều)</label>
              <MultiSelectDropdown
                options={projectOptions}
                selected={form.projects}
                onChange={(ids) => setForm((f) => ({ ...f, projects: ids }))}
                placeholder="-- Không gán dự án cụ thể --"
              />
              <p className="text-xs text-gray-500 mt-1">Nếu chọn, tài khoản chỉ báo cáo/lên kế hoạch cho đúng (các) dự án này.</p>
            </div>
          )}
          {isAdmin && (
            <div>
              <label className="field-label">Vai trò</label>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className="input"
              >
                <option value="employee">Nhân viên</option>
                <option value="manager">Quản lý (quản lý đơn vị đã chọn ở trên)</option>
              </select>
            </div>
          )}
          <p className="text-xs text-gray-500">Mật khẩu mặc định = email. Tài khoản phải đổi mật khẩu ở lần đăng nhập đầu tiên.</p>
          {error && <p className="alert-error">{error}</p>}
          <button type="submit" disabled={submitting} className="btn-primary">
            Tạo tài khoản
          </button>
        </form>
      )}

      <div className="card-flat">
        <table className="table-modern">
          <thead>
            <tr>
              <th className="px-4 py-2">Nhân viên</th>
              <th className="px-4 py-2">Đơn vị</th>
              <th className="px-4 py-2">Dự án phụ trách</th>
              <th className="px-4 py-2">Trạng thái</th>
              <th className="px-4 py-2 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id}>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center text-xs font-semibold shrink-0">
                      {initials(emp.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-gray-800 truncate">{emp.name}</div>
                      <div className="text-xs text-gray-400 truncate">{emp.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2 text-gray-600">{emp.orgUnit?.name || '—'}</td>
                <td className="px-4 py-2 min-w-[180px]">
                  {projectOptions.length > 0 ? (
                    <MultiSelectDropdown
                      options={projectOptions}
                      selected={(emp.projects || []).map((p) => p._id || p)}
                      onChange={(ids) => handleAssignProjects(emp, ids)}
                      placeholder="Chưa gán"
                    />
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  <div className="flex flex-wrap gap-1.5">
                    {isAdmin && emp.role === 'manager' && <span className={ROLE_BADGE.manager}>{ROLE_LABEL.manager}</span>}
                    <span className={emp.isActive ? 'badge-green' : 'badge-red'}>
                      {emp.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                    </span>
                    {emp.mustChangePassword && <span className="badge-amber">Chưa đổi mật khẩu</span>}
                  </div>
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => toggleActive(emp)}
                      title={emp.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                      className="btn-ghost"
                    >
                      {emp.isActive ? <Lock size={15} /> : <Unlock size={15} />}
                    </button>
                    <button
                      onClick={() => resetPassword(emp)}
                      title="Đặt lại mật khẩu"
                      className="btn-ghost hover:text-amber-600"
                    >
                      <KeyRound size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(emp)}
                      title="Xóa tài khoản"
                      className="btn-ghost hover:text-red-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-center text-gray-500">
                  Chưa có tài khoản nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <Pagination
          pagination={pagination}
          onPageChange={setPage}
          onLimitChange={(n) => { setLimit(n); setPage(1); }}
        />
      </div>
    </div>
  );
}
