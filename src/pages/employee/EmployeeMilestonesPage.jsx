import { useEffect, useState, useCallback } from 'react';
import { Flag, CalendarClock } from 'lucide-react';
import api from '../../api/client.js';
import Pagination from '../../components/Pagination.jsx';

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
  if (diff < 0) return <span className="badge-gray">Đã qua {Math.abs(diff)} ngày</span>;
  if (diff === 0) return <span className="badge-red">Hôm nay</span>;
  if (diff <= 3) return <span className="badge-amber">Còn {diff} ngày</span>;
  return <span className="badge-brand">Còn {diff} ngày</span>;
}

export default function EmployeeMilestonesPage() {
  const [milestones, setMilestones] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [upcomingOnly, setUpcomingOnly] = useState(true);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await api.get('/milestones/mine', { params: { page, limit, upcomingOnly } });
    setMilestones(data.milestones);
    setPagination(data.pagination);
    setLoading(false);
  }, [page, limit, upcomingOnly]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <p className="text-gray-500">Đang tải...</p>;

  return (
    <div>
      <h1 className="page-title mb-1 flex items-center gap-2">
        <Flag size={20} className="text-brand-600" />
        Mốc quan trọng của dự án
      </h1>
      <p className="page-subtitle mb-4">
        Các mốc bắt buộc của dự án thuộc đơn vị bạn — demo, deadline, bàn giao...
      </p>

      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none mb-4">
        <input
          type="checkbox"
          checked={!upcomingOnly}
          onChange={(e) => { setUpcomingOnly(!e.target.checked); setPage(1); }}
          className="rounded"
        />
        Hiện cả mốc đã qua
      </label>

      {milestones.length === 0 ? (
        <div className="empty-state">
          <CalendarClock size={32} className="text-gray-300 mb-1" />
          <p>Không có mốc thời gian nào{upcomingOnly ? ' sắp tới' : ''}.</p>
        </div>
      ) : (
        <div>
          {milestones.map((m, idx) => {
            const isLast = idx === milestones.length - 1;
            const isPast = daysBetween(m.date, todayStr()) < 0;
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
                <div className={`card flex-1 mb-4 py-3 ${isPast ? 'opacity-60' : ''}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-gray-800">{m.title}</span>
                    <span className="badge-gray">{m.project?.name}</span>
                    <CountdownBadge date={m.date} />
                    <span className="ml-auto text-xs text-gray-400 shrink-0">{formatDate(m.date)}</span>
                  </div>
                  {m.description && <p className="text-sm text-gray-500 mt-1.5 whitespace-pre-wrap">{m.description}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="card-flat">
        <Pagination pagination={pagination} onPageChange={setPage} onLimitChange={(n) => { setLimit(n); setPage(1); }} />
      </div>
    </div>
  );
}
