import { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, Pencil, Download } from 'lucide-react';
import api from '../../api/client.js';
import { downloadFromApi } from '../../utils/download.js';
import Pagination from '../../components/Pagination.jsx';
import ExpandableText from '../../components/ExpandableText.jsx';
import AutoResizeTextarea from '../../components/AutoResizeTextarea.jsx';

export default function EmployeeReportsPage() {
  const [pastReports, setPastReports] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [projects, setProjects] = useState([]);
  const [today, setToday] = useState('');
  const [content, setContent] = useState('');
  const [project, setProject] = useState('');
  const [hoursSpent, setHoursSpent] = useState('');
  const [todayStatus, setTodayStatus] = useState(null); // null | 'draft' | 'submitted'
  const [editing, setEditing] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const loadToday = useCallback(async () => {
    const [todayRes, projectsRes] = await Promise.all([
      api.get('/reports/mine/today'),
      api.get('/org/my-projects'),
    ]);
    setToday(todayRes.data.today);
    setProjects(projectsRes.data.projects);

    const todayReport = todayRes.data.report;
    if (todayReport) {
      setContent(todayReport.content);
      setProject(todayReport.project?._id || '');
      setHoursSpent(todayReport.hoursSpent ?? '');
      setTodayStatus(todayReport.status);
      setEditing(todayReport.status !== 'submitted');
    } else {
      setContent('');
      setProject('');
      setHoursSpent('');
      setTodayStatus(null);
      setEditing(true);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    const { data } = await api.get('/reports/mine', { params: { page, limit } });
    setPastReports(data.reports);
    setPagination(data.pagination);
  }, [page, limit]);

  useEffect(() => {
    (async () => {
      await Promise.all([loadToday(), loadHistory()]);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading) loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  async function handleSave(status) {
    setError('');
    setFeedback('');
    if (!content.trim()) {
      setError('Vui lòng nhập nội dung báo cáo');
      return;
    }
    setSaving(true);
    try {
      await api.put('/reports/mine/today', {
        content,
        project: project || null,
        hoursSpent: hoursSpent === '' ? null : Number(hoursSpent),
        status,
      });
      await loadToday();
      setFeedback(
        status === 'submitted'
          ? `Đã nộp báo cáo lúc ${new Date().toLocaleTimeString('vi-VN')}`
          : `Đã lưu nháp lúc ${new Date().toLocaleTimeString('vi-VN')}`
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-gray-500">Đang tải...</p>;

  const locked = todayStatus === 'submitted' && !editing;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h1 className="page-title">Báo cáo hôm nay ({today})</h1>
          {todayStatus === 'submitted' && <span className="badge-green">Đã nộp</span>}
          {todayStatus === 'draft' && <span className="badge-amber">Nháp</span>}
        </div>

        <div className="card max-w-xl space-y-3">
          {locked && (
            <div className="alert-success flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5"><CheckCircle2 size={16} /> Bạn đã nộp báo cáo hôm nay.</span>
              <button onClick={() => setEditing(true)} className="link-action flex items-center gap-1 shrink-0">
                <Pencil size={13} /> Sửa lại
              </button>
            </div>
          )}

          <div>
            <label className="field-label">Dự án (tùy chọn)</label>
            <select
              disabled={locked}
              value={project}
              onChange={(e) => setProject(e.target.value)}
              className="input disabled:bg-gray-100"
            >
              <option value="">-- Không thuộc dự án cụ thể --</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label">Nội dung công việc</label>
            <AutoResizeTextarea
              disabled={locked}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="input min-h-[120px] disabled:bg-gray-100"
              placeholder="Hôm nay bạn đã làm gì?"
            />
          </div>
          <div>
            <label className="field-label">Số giờ đã dành (tùy chọn)</label>
            <input
              type="number"
              min="0"
              step="0.5"
              disabled={locked}
              value={hoursSpent}
              onChange={(e) => setHoursSpent(e.target.value)}
              className="input-sm w-32 disabled:bg-gray-100"
            />
          </div>
          {error && <p className="alert-error">{error}</p>}
          {feedback && !error && <p className="alert-success">{feedback}</p>}
          {!locked && (
            <div className="flex gap-2">
              <button
                onClick={() => handleSave('draft')}
                disabled={saving || !content.trim()}
                className="btn-secondary"
              >
                {saving ? 'Đang lưu...' : 'Lưu nháp'}
              </button>
              <button
                onClick={() => handleSave('submitted')}
                disabled={saving || !content.trim()}
                className="btn-primary"
              >
                {saving ? 'Đang nộp...' : 'Nộp báo cáo'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="card-title">Lịch sử báo cáo (chỉ xem)</h2>
          <button onClick={() => downloadFromApi('/reports/mine/export')} className="btn-secondary-sm">
            <Download size={14} /> Xuất CSV
          </button>
        </div>
        <div className="card-flat">
          <table className="table-modern">
            <thead>
              <tr>
                <th className="px-4 py-2">Ngày</th>
                <th className="px-4 py-2">Dự án</th>
                <th className="px-4 py-2">Nội dung</th>
                <th className="px-4 py-2">Giờ</th>
                <th className="px-4 py-2">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {pastReports.map((r) => (
                <tr key={r._id}>
                  <td className="px-4 py-2 whitespace-nowrap">{r.date}</td>
                  <td className="px-4 py-2">{r.project?.name || '—'}</td>
                  <td className="px-4 py-2 max-w-md">
                    <ExpandableText text={r.content} title={`Báo cáo ngày ${r.date}`} />
                  </td>
                  <td className="px-4 py-2">{r.hoursSpent ?? '—'}</td>
                  <td className="px-4 py-2">
                    <span className={r.status === 'submitted' ? 'badge-green' : 'badge-amber'}>
                      {r.status === 'submitted' ? 'Đã nộp' : 'Nháp'}
                    </span>
                  </td>
                </tr>
              ))}
              {pastReports.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-4 text-center text-gray-500">Chưa có báo cáo cũ</td></tr>
              )}
            </tbody>
          </table>
          <Pagination pagination={pagination} onPageChange={setPage} onLimitChange={(n) => { setLimit(n); setPage(1); }} />
        </div>
      </div>
    </div>
  );
}
