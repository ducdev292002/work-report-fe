import { useEffect, useState, useCallback, useRef } from 'react';
import { Plus, Flag, Pencil, Trash2, Check, X, CalendarClock, LayoutList, Rows3 } from 'lucide-react';
import api from '../../api/client.js';
import { getVisibleRoots } from '../../utils/orgTree.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useConfirm } from '../../context/ConfirmContext.jsx';
import Pagination from '../../components/Pagination.jsx';
import AutoResizeTextarea from '../../components/AutoResizeTextarea.jsx';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function daysBetween(dateStr, todayStrVal) {
  const a = new Date(`${dateStr}T00:00:00`);
  const b = new Date(`${todayStrVal}T00:00:00`);
  return Math.round((a - b) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function CountdownBadge({ date, today }) {
  const diff = daysBetween(date, today);
  if (diff < 0) return <span className="badge-gray">Đã qua {Math.abs(diff)} ngày</span>;
  if (diff === 0) return <span className="badge-red">Hôm nay</span>;
  if (diff <= 3) return <span className="badge-amber">Còn {diff} ngày</span>;
  return <span className="badge-brand">Còn {diff} ngày</span>;
}

function MilestoneForm({ projects, initial, onSubmit, onCancel, busy }) {
  const [form, setForm] = useState(
    initial || { project: '', title: '', date: '', description: '' }
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.date || (!initial && !form.project)) return;
        onSubmit(form);
      }}
      className="card space-y-3 animate-fade-in"
    >
      {!initial && (
        <div>
          <label className="field-label">Dự án</label>
          <select
            required
            value={form.project}
            onChange={(e) => setForm((f) => ({ ...f, project: e.target.value }))}
            className="input"
          >
            <option value="">-- Chọn dự án --</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
        <div>
          <label className="field-label">Mốc / sự kiện</label>
          <input
            required
            autoFocus
            placeholder="VD: Demo sản phẩm cho khách hàng"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="input"
          />
        </div>
        <div>
          <label className="field-label">Ngày</label>
          <input
            required
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className="input"
          />
        </div>
      </div>
      <div>
        <label className="field-label">Ghi chú (tùy chọn)</label>
        <textarea
          rows={2}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className="input"
          placeholder="Yêu cầu cụ thể, người phụ trách, checklist..."
        />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="btn-primary">
          <Check size={14} /> Lưu
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          <X size={14} /> Hủy
        </button>
      </div>
    </form>
  );
}

function snapshotOf(m) {
  return JSON.stringify({
    project: m.project?._id ?? m.project ?? '',
    title: m.title || '',
    date: m.date || '',
    description: m.description || '',
  });
}

// A grid you can type straight into — much faster than opening the form
// repeatedly when adding several milestones in a row.
function MilestoneTable({ milestones, projects, today, onSave, onDelete, onAdd }) {
  const savedSnapshots = useRef({});
  const [rows, setRows] = useState(milestones);
  const [newRow, setNewRow] = useState({ project: '', title: '', date: '', description: '' });

  useEffect(() => {
    setRows(milestones);
    savedSnapshots.current = {};
    milestones.forEach((m) => {
      savedSnapshots.current[m._id] = snapshotOf(m);
    });
  }, [milestones]);

  function updateRow(id, field, value) {
    setRows((prev) => prev.map((r) => (r._id === id ? { ...r, [field]: value } : r)));
  }

  async function saveRow(row) {
    const next = snapshotOf(row);
    if (savedSnapshots.current[row._id] === next) return;
    savedSnapshots.current[row._id] = next;
    await onSave(row._id, {
      title: row.title,
      date: row.date,
      description: row.description,
    });
  }

  async function handleAddRow() {
    if (!newRow.project || !newRow.title.trim() || !newRow.date) return;
    await onAdd(newRow);
    setNewRow({ project: '', title: '', date: '', description: '' });
  }

  return (
    <div className="card-flat overflow-x-auto">
      <table className="table-modern table-fixed min-w-[820px] w-full">
        <colgroup>
          <col style={{ width: '16%' }} />
          <col style={{ width: '26%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '28%' }} />
          <col style={{ width: '8%' }} />
        </colgroup>
        <thead>
          <tr>
            <th className="px-3 py-2">Dự án</th>
            <th className="px-3 py-2">Mốc / sự kiện</th>
            <th className="px-3 py-2">Ngày</th>
            <th className="px-3 py-2">Trạng thái</th>
            <th className="px-3 py-2">Ghi chú</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => (
            <tr key={m._id}>
              <td className="px-3 py-2 text-gray-600 truncate">{m.project?.name}</td>
              <td className="px-3 py-1.5">
                <AutoResizeTextarea
                  value={m.title}
                  onChange={(e) => updateRow(m._id, 'title', e.target.value)}
                  onBlur={() => saveRow(m)}
                  className="input-sm w-full"
                />
              </td>
              <td className="px-3 py-1">
                <input
                  type="date"
                  value={m.date}
                  onChange={(e) => updateRow(m._id, 'date', e.target.value)}
                  onBlur={() => saveRow(m)}
                  className="input-sm w-full"
                />
              </td>
              <td className="px-3 py-2">
                <CountdownBadge date={m.date} today={today} />
              </td>
              <td className="px-3 py-1.5">
                <AutoResizeTextarea
                  value={m.description || ''}
                  onChange={(e) => updateRow(m._id, 'description', e.target.value)}
                  onBlur={() => saveRow(m)}
                  className="input-sm w-full"
                  placeholder="—"
                />
              </td>
              <td className="px-3 py-1 text-right">
                <button onClick={() => onDelete(m)} className="link-danger">
                  Xóa
                </button>
              </td>
            </tr>
          ))}

          <tr className="border-t bg-gray-50/60">
            <td className="px-3 py-1">
              <select
                value={newRow.project}
                onChange={(e) => setNewRow((r) => ({ ...r, project: e.target.value }))}
                className="input-sm w-full"
              >
                <option value="">-- Dự án --</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </td>
            <td className="px-3 py-1.5">
              <AutoResizeTextarea
                placeholder="Thêm mốc mới..."
                value={newRow.title}
                onChange={(e) => setNewRow((r) => ({ ...r, title: e.target.value }))}
                onEnter={handleAddRow}
                className="input-sm w-full"
              />
            </td>
            <td className="px-3 py-1">
              <input
                type="date"
                value={newRow.date}
                onChange={(e) => setNewRow((r) => ({ ...r, date: e.target.value }))}
                className="input-sm w-full"
              />
            </td>
            <td className="px-3 py-2 text-xs text-gray-400">—</td>
            <td className="px-3 py-1.5">
              <AutoResizeTextarea
                value={newRow.description}
                onChange={(e) => setNewRow((r) => ({ ...r, description: e.target.value }))}
                onEnter={handleAddRow}
                className="input-sm w-full"
                placeholder="Ghi chú (tùy chọn)"
              />
            </td>
            <td className="px-3 py-1 text-right">
              <button onClick={handleAddRow} className="link-action">
                Thêm
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function TimelinePage() {
  const { user } = useAuth();
  const confirm = useConfirm();
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' | 'table'
  const [projects, setProjects] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [projectFilter, setProjectFilter] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const today = todayStr();

  const load = useCallback(async () => {
    const params = { page, limit };
    if (projectFilter) params.project = projectFilter;
    if (!showAll) params.from = today;
    const [msRes, treeRes] = await Promise.all([
      api.get('/milestones', { params }),
      api.get('/org/tree'),
    ]);
    setMilestones(msRes.data.milestones);
    setPagination(msRes.data.pagination);

    const collected = [];
    (function walk(nodes) {
      for (const node of nodes) {
        node.projects?.forEach((p) => collected.push(p));
        if (node.children?.length) walk(node.children);
      }
    })(getVisibleRoots(treeRes.data.tree, user));
    setProjects(collected);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectFilter, showAll, page, limit]);

  useEffect(() => {
    load();
  }, [load]);

  function updateProjectFilter(value) {
    setProjectFilter(value);
    setPage(1);
  }

  function updateShowAll(value) {
    setShowAll(value);
    setPage(1);
  }

  async function handleCreate(form) {
    setBusy(true);
    try {
      await api.post('/milestones', form);
      setShowForm(false);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdate(id, form) {
    setBusy(true);
    try {
      await api.patch(`/milestones/${id}`, form);
      setEditingId(null);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setBusy(false);
    }
  }

  async function handleInlineSave(id, form) {
    try {
      await api.patch(`/milestones/${id}`, form);
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
      load();
    }
  }

  async function handleDelete(milestone) {
    const ok = await confirm({ title: 'Xóa mốc thời gian', message: `Xóa mốc "${milestone.title}"?`, danger: true });
    if (!ok) return;
    await api.delete(`/milestones/${milestone._id}`);
    load();
  }

  if (loading) return <p className="text-gray-500">Đang tải...</p>;

  const visibleMilestones = milestones;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="page-title flex items-center gap-2">
          <Flag size={20} className="text-brand-600" />
          Timeline dự án
        </h1>
        <div className="flex items-center gap-2">
          <div className="inline-flex gap-1 p-1 bg-gray-100 rounded-xl">
            <button
              onClick={() => setViewMode('timeline')}
              title="Xem dạng dòng thời gian"
              className={`px-2.5 py-1.5 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'timeline' ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LayoutList size={14} /> Timeline
            </button>
            <button
              onClick={() => setViewMode('table')}
              title="Xem dạng bảng — thêm nhanh nhiều mốc"
              className={`px-2.5 py-1.5 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'table' ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Rows3 size={14} /> Bảng
            </button>
          </div>
          {viewMode === 'timeline' && (
            <button onClick={() => setShowForm((v) => !v)} className="btn-primary-sm">
              {showForm ? <X size={14} /> : <Plus size={14} />}
              {showForm ? 'Đóng' : 'Thêm mốc'}
            </button>
          )}
        </div>
      </div>
      <p className="page-subtitle mb-4">
        Các mốc thời gian quan trọng, bắt buộc của từng dự án — demo, deadline, bàn giao... để nhìn tổng quan dự án đang tới hạn gì.
        {viewMode === 'table' && ' Ở dạng bảng bạn có thể gõ và thêm liên tục nhiều mốc cùng lúc.'}
      </p>

      {showForm && viewMode === 'timeline' && (
        <div className="mb-4">
          <MilestoneForm projects={projects} onSubmit={handleCreate} onCancel={() => setShowForm(false)} busy={busy} />
        </div>
      )}

      <div className="card flex flex-wrap gap-3 items-end mb-4">
        <div>
          <label className="field-label text-xs">Dự án</label>
          <select value={projectFilter} onChange={(e) => updateProjectFilter(e.target.value)} className="input-sm">
            <option value="">Tất cả</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none pb-1.5">
          <input type="checkbox" checked={showAll} onChange={(e) => updateShowAll(e.target.checked)} className="rounded" />
          Hiện cả mốc đã qua
        </label>
      </div>

      {visibleMilestones.length === 0 && viewMode === 'timeline' ? (
        <div className="empty-state">
          <CalendarClock size={32} className="text-gray-300 mb-1" />
          <p>Chưa có mốc thời gian nào{showAll ? '' : ' sắp tới'}.</p>
        </div>
      ) : viewMode === 'table' ? (
        <MilestoneTable
          milestones={visibleMilestones}
          projects={projects}
          today={today}
          onSave={handleInlineSave}
          onDelete={handleDelete}
          onAdd={handleCreate}
        />
      ) : (
        <div>
          {visibleMilestones.map((m, idx) => {
            const isLast = idx === visibleMilestones.length - 1;
            const isPast = daysBetween(m.date, today) < 0;
            const isEditing = editingId === m._id;
            return (
              <div key={m._id} className="flex gap-3">
                <div className="flex flex-col items-center shrink-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ring-4 ring-gray-50 ${
                      isPast ? 'bg-gray-100 text-gray-400' : 'bg-brand-100 text-brand-600'
                    }`}
                  >
                    <Flag size={14} />
                  </div>
                  {!isLast && <div className="flex-1 w-px bg-gray-200 my-1" />}
                </div>

                <div className="flex-1 mb-4">
                  {isEditing ? (
                    <MilestoneForm
                      initial={{ title: m.title, date: m.date, description: m.description }}
                      onSubmit={(form) => handleUpdate(m._id, form)}
                      onCancel={() => setEditingId(null)}
                      busy={busy}
                    />
                  ) : (
                    <div className={`card group py-3 ${isPast ? 'opacity-60' : ''}`}>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-gray-800">{m.title}</span>
                        <span className="badge-brand">{m.project?.name}</span>
                        <CountdownBadge date={m.date} today={today} />
                        <span className="ml-auto text-xs text-gray-400 shrink-0">{formatDate(m.date)}</span>
                        <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                          <button onClick={() => setEditingId(m._id)} title="Sửa" className="btn-ghost">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => handleDelete(m)} title="Xóa" className="btn-ghost hover:text-red-600">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      {m.description && <p className="text-sm text-gray-500 mt-1.5 whitespace-pre-wrap">{m.description}</p>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="card-flat mt-4">
        <Pagination pagination={pagination} onPageChange={setPage} onLimitChange={(n) => { setLimit(n); setPage(1); }} />
      </div>
    </div>
  );
}
