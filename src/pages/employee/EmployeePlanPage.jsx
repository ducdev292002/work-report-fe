import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Flag, ArrowRight } from 'lucide-react';
import api from '../../api/client.js';
import AutoResizeTextarea from '../../components/AutoResizeTextarea.jsx';
import { useConfirm } from '../../context/ConfirmContext.jsx';

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

function CountdownBadge({ date }) {
  const diff = daysBetween(date, todayStr());
  if (diff === 0) return <span className="badge-red">Hôm nay</span>;
  if (diff <= 3) return <span className="badge-amber">Còn {diff} ngày</span>;
  return <span className="badge-brand">Còn {diff} ngày</span>;
}

function UpcomingMilestones() {
  const [milestones, setMilestones] = useState(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    api.get('/milestones/mine', { params: { limit: 3 } }).then(({ data }) => {
      setMilestones(data.milestones);
      setTotal(data.pagination?.total ?? data.milestones.length);
    });
  }, []);

  if (!milestones || milestones.length === 0) return null;

  return (
    <div className="card mb-4 border-brand-100 bg-brand-50/30">
      <div className="flex items-center justify-between mb-2">
        <h2 className="card-title flex items-center gap-1.5"><Flag size={14} className="text-brand-600" /> Mốc quan trọng sắp tới</h2>
        {total > milestones.length && (
          <Link to="/milestones" className="link-action flex items-center gap-1 text-xs">
            Xem tất cả ({total}) <ArrowRight size={12} />
          </Link>
        )}
      </div>
      <div className="space-y-1.5">
        {milestones.map((m) => (
          <div key={m._id} className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium text-gray-800">{m.title}</span>
            <span className="badge-gray">{m.project?.name}</span>
            <CountdownBadge date={m.date} />
            <span className="text-xs text-gray-400 ml-auto">{formatDate(m.date)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const PRIORITIES = [
  { value: 'low', label: 'Thấp' },
  { value: 'medium', label: 'Trung bình' },
  { value: 'high', label: 'Cao' },
];

function snapshotOf(item) {
  return JSON.stringify({
    task: item.task || '',
    project: item.project?._id ?? item.project ?? null,
    priority: item.priority,
    estimatedHours: item.estimatedHours === '' ? null : item.estimatedHours ?? null,
    note: item.note || '',
  });
}

export default function EmployeePlanPage() {
  const confirm = useConfirm();
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [forDate, setForDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [newRow, setNewRow] = useState({ task: '', project: '', priority: 'medium', estimatedHours: '', note: '' });

  // Last-saved snapshot per row, so a click-then-blur with no real edit never
  // fires a PATCH — only an actual change to a field does.
  const savedSnapshots = useRef({});

  const load = useCallback(async () => {
    const [planRes, projectsRes] = await Promise.all([
      api.get('/plans/mine'),
      api.get('/org/my-projects'),
    ]);
    setItems(planRes.data.items);
    setForDate(planRes.data.forDate);
    setProjects(projectsRes.data.projects);
    savedSnapshots.current = {};
    planRes.data.items.forEach((it) => {
      savedSnapshots.current[it._id] = snapshotOf(it);
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAddRow(e) {
    e.preventDefault();
    if (!newRow.task.trim()) return;
    await api.post('/plans/mine', {
      task: newRow.task.trim(),
      project: newRow.project || null,
      priority: newRow.priority,
      estimatedHours: newRow.estimatedHours === '' ? null : Number(newRow.estimatedHours),
      note: newRow.note,
    });
    setNewRow({ task: '', project: '', priority: 'medium', estimatedHours: '', note: '' });
    setFeedback(`Đã thêm công việc lúc ${new Date().toLocaleTimeString('vi-VN')}`);
    load();
  }

  function handleUpdateRow(id, field, value) {
    setItems((prev) => prev.map((it) => (it._id === id ? { ...it, [field]: value } : it)));
  }

  async function handleBlurSave(item) {
    const nextSnapshot = snapshotOf(item);
    if (savedSnapshots.current[item._id] === nextSnapshot) return; // nothing actually changed

    await api.patch(`/plans/mine/${item._id}`, {
      task: item.task,
      project: (item.project?._id ?? item.project) || null,
      priority: item.priority,
      estimatedHours: item.estimatedHours === '' ? null : Number(item.estimatedHours),
      note: item.note,
    });
    savedSnapshots.current[item._id] = nextSnapshot;
    setFeedback(`Đã lưu lúc ${new Date().toLocaleTimeString('vi-VN')}`);
  }

  async function handleDeleteRow(item) {
    const ok = await confirm({ title: 'Xóa công việc', message: `Xóa công việc "${item.task}"?`, danger: true });
    if (!ok) return;
    await api.delete(`/plans/mine/${item._id}`);
    delete savedSnapshots.current[item._id];
    load();
  }

  if (loading) return <p className="text-gray-500">Đang tải...</p>;

  return (
    <div>
      <UpcomingMilestones />
      <h1 className="page-title mb-1">Kế hoạch cho ngày {forDate}</h1>
      <p className="page-subtitle mb-2">
        Điền các đầu việc dự kiến cho ngày mai trước khi hết giờ làm hôm nay. Có thể thêm/sửa/xóa dòng trực tiếp.
      </p>
      {feedback && <p className="alert-success mb-3">{feedback}</p>}

      <div className="card-flat overflow-x-auto">
        <table className="table-modern table-fixed min-w-[900px] w-full">
          <colgroup>
            <col style={{ width: '30%' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '26%' }} />
            <col style={{ width: '8%' }} />
          </colgroup>
          <thead>
            <tr>
              <th className="px-3 py-2">Công việc</th>
              <th className="px-3 py-2">Dự án</th>
              <th className="px-3 py-2">Ưu tiên</th>
              <th className="px-3 py-2">Giờ dự kiến</th>
              <th className="px-3 py-2">Ghi chú</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item._id} className="border-t">
                <td className="px-3 py-1.5">
                  <AutoResizeTextarea
                    value={item.task}
                    onChange={(e) => handleUpdateRow(item._id, 'task', e.target.value)}
                    onBlur={() => handleBlurSave(item)}
                    className="input-sm w-full min-h-[80px]"
                  />
                </td>
                <td className="px-3 py-1">
                  <select
                    value={item.project?._id ?? item.project ?? ''}
                    onChange={(e) => {
                      const updated = { ...item, project: e.target.value };
                      handleUpdateRow(item._id, 'project', e.target.value);
                      handleBlurSave(updated);
                    }}
                    className="input-sm w-full truncate"
                  >
                    <option value="">—</option>
                    {projects.map((p) => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-1">
                  <select
                    value={item.priority}
                    onChange={(e) => {
                      const updated = { ...item, priority: e.target.value };
                      handleUpdateRow(item._id, 'priority', e.target.value);
                      handleBlurSave(updated);
                    }}
                    className="input-sm w-full"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-1">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={item.estimatedHours ?? ''}
                    onChange={(e) => handleUpdateRow(item._id, 'estimatedHours', e.target.value)}
                    onBlur={() => handleBlurSave(item)}
                    className="input-sm w-full"
                  />
                </td>
                <td className="px-3 py-1.5">
                  <AutoResizeTextarea
                    value={item.note || ''}
                    onChange={(e) => handleUpdateRow(item._id, 'note', e.target.value)}
                    onBlur={() => handleBlurSave(item)}
                    className="input-sm w-full min-h-[80px]"
                  />
                </td>
                <td className="px-3 py-1 text-right">
                  <button onClick={() => handleDeleteRow(item)} className="link-danger">
                    Xóa
                  </button>
                </td>
              </tr>
            ))}

            <tr className="border-t bg-gray-50/60">
              <td className="px-3 py-1.5">
                <AutoResizeTextarea
                  placeholder="Thêm công việc mới..."
                  value={newRow.task}
                  onChange={(e) => setNewRow((r) => ({ ...r, task: e.target.value }))}
                  onEnter={handleAddRow}
                  className="input-sm w-full min-h-[80px]"
                />
              </td>
              <td className="px-3 py-1">
                <select
                  value={newRow.project}
                  onChange={(e) => setNewRow((r) => ({ ...r, project: e.target.value }))}
                  className="input-sm w-full"
                >
                  <option value="">—</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </td>
              <td className="px-3 py-1">
                <select
                  value={newRow.priority}
                  onChange={(e) => setNewRow((r) => ({ ...r, priority: e.target.value }))}
                  className="input-sm w-full"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </td>
              <td className="px-3 py-1">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={newRow.estimatedHours}
                  onChange={(e) => setNewRow((r) => ({ ...r, estimatedHours: e.target.value }))}
                  className="input-sm w-full"
                />
              </td>
              <td className="px-3 py-1.5">
                <AutoResizeTextarea
                  value={newRow.note}
                  onChange={(e) => setNewRow((r) => ({ ...r, note: e.target.value }))}
                  onEnter={handleAddRow}
                  className="input-sm w-full min-h-[80px]"
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
    </div>
  );
}
