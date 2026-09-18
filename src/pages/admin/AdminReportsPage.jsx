import { useEffect, useState, useCallback, useMemo } from 'react';
import { FolderOpen, Download } from 'lucide-react';
import api from '../../api/client.js';
import { flattenOrgTree, getVisibleRoots } from '../../utils/orgTree.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { downloadFromApi } from '../../utils/download.js';
import Pagination from '../../components/Pagination.jsx';
import ExpandableText from '../../components/ExpandableText.jsx';

const NO_PROJECT_KEY = '__none__';

function groupByProject(rows) {
  const groups = new Map();
  for (const row of rows) {
    const key = row.project?._id || NO_PROJECT_KEY;
    if (!groups.has(key)) groups.set(key, { name: row.project?.name || 'Không thuộc dự án cụ thể', rows: [] });
    groups.get(key).rows.push(row);
  }
  return Array.from(groups.values()).sort((a, b) => {
    if (a.name === 'Không thuộc dự án cụ thể') return 1;
    if (b.name === 'Không thuộc dự án cụ thể') return -1;
    return a.name.localeCompare(b.name);
  });
}

export default function AdminReportsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('reports'); // 'reports' | 'plans'
  const [units, setUnits] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [reports, setReports] = useState([]);
  const [reportsPagination, setReportsPagination] = useState(null);
  const [reportsPage, setReportsPage] = useState(1);
  const [reportsLimit, setReportsLimit] = useState(50);
  const [plans, setPlans] = useState([]);
  const [plansPagination, setPlansPagination] = useState(null);
  const [plansPage, setPlansPage] = useState(1);
  const [plansLimit, setPlansLimit] = useState(50);
  const [filters, setFilters] = useState({ orgUnit: '', employee: '', project: '', from: '', to: '', forDate: '' });
  const [loading, setLoading] = useState(true);

  const loadMeta = useCallback(async () => {
    const [treeRes, empRes] = await Promise.all([api.get('/org/tree'), api.get('/employees', { params: { limit: 100 } })]);
    const visibleRoots = getVisibleRoots(treeRes.data.tree, user);
    setUnits(flattenOrgTree(visibleRoots));
    setEmployees(empRes.data.employees);

    const projects = [];
    (function collect(nodes) {
      for (const node of nodes) {
        node.projects?.forEach((p) => projects.push(p));
        if (node.children?.length) collect(node.children);
      }
    })(visibleRoots);
    setAllProjects(projects);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  const loadReports = useCallback(async () => {
    const params = { page: reportsPage, limit: reportsLimit };
    if (filters.orgUnit) params.orgUnit = filters.orgUnit;
    if (filters.employee) params.employee = filters.employee;
    if (filters.project) params.project = filters.project;
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;
    const { data } = await api.get('/reports', { params });
    setReports(data.reports);
    setReportsPagination(data.pagination);
  }, [filters, reportsPage, reportsLimit]);

  const loadPlans = useCallback(async () => {
    const params = { page: plansPage, limit: plansLimit };
    if (filters.orgUnit) params.orgUnit = filters.orgUnit;
    if (filters.employee) params.employee = filters.employee;
    if (filters.project) params.project = filters.project;
    if (filters.forDate) params.forDate = filters.forDate;
    const { data } = await api.get('/plans', { params });
    setPlans(data.items);
    setPlansPagination(data.pagination);
  }, [filters, plansPage, plansLimit]);

  useEffect(() => {
    if (loading) return;
    if (tab === 'reports') loadReports();
    else loadPlans();
  }, [tab, loading, loadReports, loadPlans]);

  function updateFilter(patch) {
    setFilters((f) => ({ ...f, ...patch }));
    setReportsPage(1);
    setPlansPage(1);
  }

  const groupedReports = useMemo(() => groupByProject(reports), [reports]);
  const groupedPlans = useMemo(() => groupByProject(plans), [plans]);

  function handleExport() {
    const params = {
      orgUnit: filters.orgUnit,
      employee: filters.employee,
      project: filters.project,
    };
    if (tab === 'reports') {
      downloadFromApi('/reports/export', { ...params, from: filters.from, to: filters.to });
    } else {
      downloadFromApi('/plans/export', { ...params, forDate: filters.forDate });
    }
  }

  if (loading) return <p className="text-gray-500">Đang tải...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="page-title">Báo cáo</h1>
        <button onClick={handleExport} className="btn-secondary-sm">
          <Download size={14} /> Xuất CSV
        </button>
      </div>

      <div className="inline-flex gap-1 p-1 bg-gray-100 rounded-xl mb-4">
        <button
          onClick={() => setTab('reports')}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
            tab === 'reports' ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Báo cáo hàng ngày
        </button>
        <button
          onClick={() => setTab('plans')}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
            tab === 'plans' ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Kế hoạch ngày mai
        </button>
      </div>

      <div className="card flex flex-wrap gap-3 items-end mb-4">
        <div>
          <label className="field-label text-xs">Đơn vị</label>
          <select value={filters.orgUnit} onChange={(e) => updateFilter({ orgUnit: e.target.value })} className="input-sm">
            <option value="">Tất cả</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>{'—'.repeat(u.depth)} {u.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label text-xs">Nhân viên</label>
          <select value={filters.employee} onChange={(e) => updateFilter({ employee: e.target.value })} className="input-sm">
            <option value="">Tất cả</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label text-xs">Dự án</label>
          <select value={filters.project} onChange={(e) => updateFilter({ project: e.target.value })} className="input-sm">
            <option value="">Tất cả</option>
            {allProjects.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>
        {tab === 'reports' ? (
          <>
            <div>
              <label className="field-label text-xs">Từ ngày</label>
              <input type="date" value={filters.from} onChange={(e) => updateFilter({ from: e.target.value })} className="input-sm" />
            </div>
            <div>
              <label className="field-label text-xs">Đến ngày</label>
              <input type="date" value={filters.to} onChange={(e) => updateFilter({ to: e.target.value })} className="input-sm" />
            </div>
          </>
        ) : (
          <div>
            <label className="field-label text-xs">Cho ngày</label>
            <input type="date" value={filters.forDate} onChange={(e) => updateFilter({ forDate: e.target.value })} className="input-sm" />
          </div>
        )}
      </div>

      {tab === 'reports' ? (
        <div className="space-y-4">
          {groupedReports.map((group) => (
            <div key={group.name} className="card-flat">
              <div className="bg-gray-50/80 border-b border-gray-100 px-4 py-3 flex items-center justify-between">
                <h3 className="card-title flex items-center gap-1.5"><FolderOpen size={15} className="text-amber-500" /> {group.name}</h3>
                <span className="text-xs text-gray-500">{group.rows.length} báo cáo</span>
              </div>
              <table className="table-modern">
                <thead>
                  <tr>
                    <th className="px-4 py-2">Ngày</th>
                    <th className="px-4 py-2">Nhân viên</th>
                    <th className="px-4 py-2">Đơn vị</th>
                    <th className="px-4 py-2">Nội dung</th>
                    <th className="px-4 py-2">Giờ</th>
                    <th className="px-4 py-2">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {group.rows.map((r) => (
                    <tr key={r._id}>
                      <td className="px-4 py-2 whitespace-nowrap">{r.date}</td>
                      <td className="px-4 py-2">{r.employee?.name}</td>
                      <td className="px-4 py-2">{r.orgUnit?.name}</td>
                      <td className="px-4 py-2 max-w-md">
                        <ExpandableText text={r.content} title={`Báo cáo ngày ${r.date} — ${r.employee?.name}`} />
                      </td>
                      <td className="px-4 py-2">{r.hoursSpent ?? '—'}</td>
                      <td className="px-4 py-2">
                        <span className={r.status === 'submitted' ? 'badge-green' : 'badge-amber'}>
                          {r.status === 'submitted' ? 'Đã nộp' : 'Nháp'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          {groupedReports.length === 0 && (
            <div className="card text-center text-gray-500 text-sm">Không có báo cáo</div>
          )}
          <div className="card-flat">
            <Pagination
              pagination={reportsPagination}
              onPageChange={setReportsPage}
              onLimitChange={(n) => { setReportsLimit(n); setReportsPage(1); }}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedPlans.map((group) => (
            <div key={group.name} className="card-flat">
              <div className="bg-gray-50/80 border-b border-gray-100 px-4 py-3 flex items-center justify-between">
                <h3 className="card-title flex items-center gap-1.5"><FolderOpen size={15} className="text-amber-500" /> {group.name}</h3>
                <span className="text-xs text-gray-500">{group.rows.length} đầu việc</span>
              </div>
              <table className="table-modern">
                <thead>
                  <tr>
                    <th className="px-4 py-2">Cho ngày</th>
                    <th className="px-4 py-2">Nhân viên</th>
                    <th className="px-4 py-2">Đơn vị</th>
                    <th className="px-4 py-2">Công việc</th>
                    <th className="px-4 py-2">Ưu tiên</th>
                    <th className="px-4 py-2">Giờ dự kiến</th>
                    <th className="px-4 py-2">Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {group.rows.map((p) => (
                    <tr key={p._id}>
                      <td className="px-4 py-2 whitespace-nowrap">{p.forDate}</td>
                      <td className="px-4 py-2">{p.employee?.name}</td>
                      <td className="px-4 py-2">{p.orgUnit?.name}</td>
                      <td className="px-4 py-2 max-w-sm">
                        <ExpandableText text={p.task} title={`Kế hoạch ${p.forDate} — ${p.employee?.name}`} />
                      </td>
                      <td className="px-4 py-2 capitalize">{p.priority}</td>
                      <td className="px-4 py-2">{p.estimatedHours ?? '—'}</td>
                      <td className="px-4 py-2 max-w-xs">
                        <ExpandableText text={p.note} title={`Ghi chú — ${p.employee?.name}`} threshold={60} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          {groupedPlans.length === 0 && (
            <div className="card text-center text-gray-500 text-sm">Không có kế hoạch</div>
          )}
          <div className="card-flat">
            <Pagination
              pagination={plansPagination}
              onPageChange={setPlansPage}
              onLimitChange={(n) => { setPlansLimit(n); setPlansPage(1); }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
