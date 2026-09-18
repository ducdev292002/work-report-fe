import { useEffect, useState, useCallback } from 'react';
import { Users, AlertTriangle, Clock } from 'lucide-react';
import api from '../../api/client.js';
import { flattenOrgTree, getVisibleRoots } from '../../utils/orgTree.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Pagination from '../../components/Pagination.jsx';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const STATUS_STYLE = {
  submitted: 'bg-emerald-50 text-emerald-700',
  draft: 'bg-amber-50 text-amber-700',
  missing: 'bg-gray-50 text-gray-300',
};
const STATUS_LABEL = { submitted: 'Đã nộp', draft: 'Nháp', missing: 'Chưa báo cáo' };

function shortDate(date) {
  const [, m, d] = date.split('-');
  return `${d}/${m}`;
}

function weekdayOf(date) {
  return WEEKDAYS[new Date(`${date}T00:00:00`).getDay()];
}

function initials(name = '') {
  return name.trim().split(/\s+/).slice(-2).map((w) => w[0]).join('').toUpperCase();
}

export default function OverviewPage() {
  const { user } = useAuth();
  const [units, setUnits] = useState([]);
  const [orgUnit, setOrgUnit] = useState('');
  const [to, setTo] = useState(todayStr());
  const [from, setFrom] = useState(addDays(todayStr(), -6));
  const [dates, setDates] = useState([]);
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/org/tree').then(({ data }) => setUnits(flattenOrgTree(getVisibleRoots(data.tree, user))));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const params = { from, to, page, limit };
    if (orgUnit) params.orgUnit = orgUnit;
    const { data } = await api.get('/reports/overview', { params });
    setDates(data.dates);
    setRows(data.rows);
    setTotals(data.totals);
    setPagination(data.pagination);
    setLoading(false);
  }, [from, to, orgUnit, page, limit]);

  useEffect(() => {
    load();
  }, [load]);

  function applyPreset(days) {
    setTo(todayStr());
    setFrom(addDays(todayStr(), -(days - 1)));
    setPage(1);
  }

  function updateOrgUnit(value) {
    setOrgUnit(value);
    setPage(1);
  }

  const today = todayStr();
  const totalMissing = totals.reduce((sum, t) => sum + t.missing, 0);
  const totalHours = totals.reduce((sum, t) => sum + t.hours, 0);

  return (
    <div>
      <h1 className="page-title mb-4">Tổng quan nhiều ngày</h1>

      <div className="card flex flex-wrap gap-4 items-end mb-4">
        <div>
          <label className="field-label text-xs">Đơn vị</label>
          <select value={orgUnit} onChange={(e) => updateOrgUnit(e.target.value)} className="input-sm">
            <option value="">Tất cả</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>{'—'.repeat(u.depth)} {u.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label text-xs">Từ ngày</label>
          <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className="input-sm" />
        </div>
        <div>
          <label className="field-label text-xs">Đến ngày</label>
          <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} className="input-sm" />
        </div>
        <div className="flex gap-1">
          <button onClick={() => applyPreset(7)} className="btn-secondary-sm">7 ngày</button>
          <button onClick={() => applyPreset(14)} className="btn-secondary-sm">14 ngày</button>
          <button onClick={() => applyPreset(30)} className="btn-secondary-sm">30 ngày</button>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" /> Đã nộp</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Nháp</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block" /> Chưa báo cáo</span>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Đang tải...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="rounded-2xl shadow-card border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center shrink-0 shadow-sm"><Users size={18} /></div>
              <div>
                <div className="text-xs font-medium text-brand-700/80">Nhân viên</div>
                <div className="text-2xl font-bold text-brand-900">{pagination?.total ?? rows.length}</div>
              </div>
            </div>
            <div className="rounded-2xl shadow-card border border-red-100 bg-gradient-to-br from-red-50 to-white p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center shrink-0 shadow-sm"><AlertTriangle size={18} /></div>
              <div>
                <div className="text-xs font-medium text-red-700/80">Lượt thiếu báo cáo</div>
                <div className="text-2xl font-bold text-red-900">{totalMissing}</div>
              </div>
            </div>
            <div className="rounded-2xl shadow-card border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm"><Clock size={18} /></div>
              <div>
                <div className="text-xs font-medium text-emerald-700/80">Tổng giờ ghi nhận</div>
                <div className="text-2xl font-bold text-emerald-900">{totalHours}</div>
              </div>
            </div>
          </div>

          <div className="card-flat">
           <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-gray-50/95 backdrop-blur-sm px-4 py-2.5 text-left border-b border-gray-100 min-w-[190px] text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Nhân viên
                  </th>
                  {dates.map((date) => (
                    <th
                      key={date}
                      className={`px-1 py-2 border-b border-gray-100 text-center min-w-[64px] ${
                        date === today ? 'bg-brand-50/60' : 'bg-gray-50/60'
                      }`}
                    >
                      <div className={`text-[10px] uppercase tracking-wide ${date === today ? 'text-brand-500' : 'text-gray-400'}`}>
                        {weekdayOf(date)}
                      </div>
                      <div className={`text-xs font-semibold ${date === today ? 'text-brand-700' : 'text-gray-600'}`}>
                        {shortDate(date)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.employee.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="sticky left-0 z-10 bg-white px-4 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center text-[11px] font-semibold shrink-0">
                          {initials(row.employee.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-800 truncate max-w-[130px]">{row.employee.name}</div>
                          <div className="text-xs text-gray-400 truncate max-w-[130px]">{row.employee.orgUnit?.name}</div>
                        </div>
                      </div>
                    </td>
                    {row.cells.map((cell) => (
                      <td key={cell.date} className={`px-1 py-1.5 text-center ${cell.date === today ? 'bg-brand-50/30' : ''}`}>
                        <div
                          title={`${cell.date}: ${STATUS_LABEL[cell.status]}${cell.hoursSpent ? ` — ${cell.hoursSpent}h` : ''}`}
                          className={`mx-auto w-9 h-7 flex items-center justify-center rounded-md text-xs font-semibold ${STATUS_STYLE[cell.status]}`}
                        >
                          {cell.status === 'missing' ? '·' : cell.hoursSpent ?? '✓'}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={dates.length + 1} className="px-4 py-8 text-center text-gray-400 text-sm">
                      Không có nhân viên nào trong phạm vi này
                    </td>
                  </tr>
                )}
              </tbody>
              {rows.length > 0 && (
                <tfoot>
                  <tr className="border-t border-gray-100 bg-gray-50/60">
                    <td className="sticky left-0 bg-gray-50/95 backdrop-blur-sm px-4 py-2 text-xs font-medium text-gray-500">
                      Đã nộp / Tổng
                    </td>
                    {totals.map((t) => (
                      <td key={t.date} className="px-1 py-2 text-center text-xs font-medium text-gray-500">
                        {t.submitted}/{rows.length}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              )}
            </table>
           </div>
            <Pagination pagination={pagination} onPageChange={setPage} onLimitChange={(n) => { setLimit(n); setPage(1); }} />
          </div>
        </>
      )}
    </div>
  );
}
