import { useEffect, useState, useCallback } from 'react';
import { UploadCloud, Download, Trash2, FileText, FileSpreadsheet, Image as ImageIcon, File as FileIcon } from 'lucide-react';
import api from '../../api/client.js';
import { flattenOrgTree, findUnitById } from '../../utils/orgTree.js';
import Pagination from '../../components/Pagination.jsx';
import { useConfirm } from '../../context/ConfirmContext.jsx';

function FileTypeIcon({ fileType }) {
  if (fileType?.includes('spreadsheet') || fileType?.includes('excel')) {
    return <FileSpreadsheet size={18} className="text-emerald-600" />;
  }
  if (fileType?.startsWith('image/')) return <ImageIcon size={18} className="text-brand-600" />;
  if (fileType?.includes('word') || fileType?.includes('pdf')) return <FileText size={18} className="text-red-500" />;
  return <FileIcon size={18} className="text-gray-400" />;
}

export default function AdminDocumentsPage() {
  const confirm = useConfirm();
  const [documents, setDocuments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [tree, setTree] = useState([]);
  const [units, setUnits] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', orgUnit: '', project: '', file: null });
  const [filterOrgUnit, setFilterOrgUnit] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadDocuments = useCallback(async () => {
    const params = { page, limit };
    if (filterOrgUnit) params.orgUnit = filterOrgUnit;
    const { data } = await api.get('/documents', { params });
    setDocuments(data.documents);
    setPagination(data.pagination);
  }, [page, limit, filterOrgUnit]);

  useEffect(() => {
    (async () => {
      const treeRes = await api.get('/org/tree');
      setTree(treeRes.data.tree);
      setUnits(flattenOrgTree(treeRes.data.tree));
      await loadDocuments();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading) loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, filterOrgUnit]);

  useEffect(() => {
    if (!form.orgUnit) {
      setProjects([]);
      return;
    }
    const unit = findUnitById(tree, form.orgUnit);
    setProjects(unit?.projects || []);
  }, [form.orgUnit, tree]);

  async function handleUpload(e) {
    e.preventDefault();
    setError('');
    if (!form.file) {
      setError('Vui lòng chọn file');
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('orgUnit', form.orgUnit);
      if (form.project) fd.append('project', form.project);
      fd.append('file', form.file);
      await api.post('/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm({ title: '', orgUnit: '', project: '', file: null });
      setPage(1);
      loadDocuments();
    } catch (err) {
      setError(err.response?.data?.message || 'Tải lên thất bại');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(doc) {
    const ok = await confirm({ title: 'Xóa tài liệu', message: `Xóa tài liệu "${doc.title}"?`, danger: true });
    if (!ok) return;
    await api.delete(`/documents/${doc._id}`);
    loadDocuments();
  }

  if (loading) return <p className="text-gray-500">Đang tải...</p>;

  return (
    <div>
      <h1 className="page-title mb-4">Tài liệu</h1>

      <form onSubmit={handleUpload} className="card space-y-3 max-w-md mb-4">
        <h2 className="card-title flex items-center gap-1.5"><UploadCloud size={16} className="text-brand-600" /> Gửi tài liệu mới</h2>
        <div>
          <label className="field-label">Tiêu đề</label>
          <input
            required
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="input"
          />
        </div>
        <div>
          <label className="field-label">Gửi tới đơn vị</label>
          <select
            required
            value={form.orgUnit}
            onChange={(e) => setForm((f) => ({ ...f, orgUnit: e.target.value, project: '' }))}
            className="input"
          >
            <option value="">-- Chọn đơn vị --</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {'—'.repeat(u.depth)} {u.name}
              </option>
            ))}
          </select>
        </div>
        {projects.length > 0 && (
          <div>
            <label className="field-label">Dự án (tùy chọn)</label>
            <select
              value={form.project}
              onChange={(e) => setForm((f) => ({ ...f, project: e.target.value }))}
              className="input"
            >
              <option value="">-- Không gắn dự án --</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="field-label">File (PDF, Word, Excel, ảnh — tối đa 20MB)</label>
          <input
            type="file"
            required
            onChange={(e) => setForm((f) => ({ ...f, file: e.target.files[0] }))}
            className="w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
          />
        </div>
        {error && <p className="alert-error">{error}</p>}
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? 'Đang tải lên...' : 'Tải lên'}
        </button>
      </form>

      <div className="flex items-center gap-2 mb-2">
        <label className="text-sm text-gray-500">Lọc theo đơn vị:</label>
        <select
          value={filterOrgUnit}
          onChange={(e) => { setFilterOrgUnit(e.target.value); setPage(1); }}
          className="input-sm"
        >
          <option value="">Tất cả</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>{'—'.repeat(u.depth)} {u.name}</option>
          ))}
        </select>
      </div>

      <div className="card-flat">
        <table className="table-modern">
          <thead>
            <tr>
              <th className="px-4 py-2">Tài liệu</th>
              <th className="px-4 py-2">Đơn vị</th>
              <th className="px-4 py-2">Dự án</th>
              <th className="px-4 py-2">Người gửi</th>
              <th className="px-4 py-2 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc._id}>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2.5">
                    <FileTypeIcon fileType={doc.fileType} />
                    <div className="min-w-0">
                      <div className="font-medium text-gray-800 truncate max-w-[220px]">{doc.title}</div>
                      <div className="text-xs text-gray-400 truncate max-w-[220px]">{doc.fileName}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2 text-gray-600">{doc.orgUnit?.name}</td>
                <td className="px-4 py-2 text-gray-600">{doc.project?.name || '—'}</td>
                <td className="px-4 py-2 text-gray-600">{doc.uploadedBy?.name}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center justify-end gap-1">
                    <a href={doc.fileUrl} target="_blank" rel="noreferrer" title="Tải xuống" className="btn-ghost">
                      <Download size={15} />
                    </a>
                    <button onClick={() => handleDelete(doc)} title="Xóa" className="btn-ghost hover:text-red-600">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {documents.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-center text-gray-500">Chưa có tài liệu nào</td>
              </tr>
            )}
          </tbody>
        </table>
        <Pagination pagination={pagination} onPageChange={setPage} onLimitChange={(n) => { setLimit(n); setPage(1); }} />
      </div>
    </div>
  );
}
