import { useEffect, useState, useCallback } from 'react';
import { Download, FileText, FileSpreadsheet, Image as ImageIcon, File as FileIcon } from 'lucide-react';
import api from '../../api/client.js';
import Pagination from '../../components/Pagination.jsx';

function FileTypeIcon({ fileType }) {
  if (fileType?.includes('spreadsheet') || fileType?.includes('excel')) {
    return <FileSpreadsheet size={18} className="text-emerald-600" />;
  }
  if (fileType?.startsWith('image/')) return <ImageIcon size={18} className="text-brand-600" />;
  if (fileType?.includes('word') || fileType?.includes('pdf')) return <FileText size={18} className="text-red-500" />;
  return <FileIcon size={18} className="text-gray-400" />;
}

export default function EmployeeDocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await api.get('/documents/mine', { params: { page, limit } });
    setDocuments(data.documents);
    setPagination(data.pagination);
    setLoading(false);
  }, [page, limit]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <p className="text-gray-500">Đang tải...</p>;

  return (
    <div>
      <h1 className="page-title mb-4">Tài liệu được gửi</h1>
      <div className="card-flat">
        <table className="table-modern">
          <thead>
            <tr>
              <th className="px-4 py-2">Tài liệu</th>
              <th className="px-4 py-2">Gửi tới</th>
              <th className="px-4 py-2">Dự án</th>
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
                      <div className="font-medium text-gray-800 truncate max-w-[240px]">{doc.title}</div>
                      <div className="text-xs text-gray-400 truncate max-w-[240px]">{doc.fileName}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2 text-gray-600">{doc.orgUnit?.name}</td>
                <td className="px-4 py-2 text-gray-600">{doc.project?.name || '—'}</td>
                <td className="px-4 py-2 text-right">
                  <a href={doc.fileUrl} target="_blank" rel="noreferrer" title="Tải xuống" className="btn-ghost inline-flex">
                    <Download size={15} />
                  </a>
                </td>
              </tr>
            ))}
            {documents.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-4 text-center text-gray-500">Chưa có tài liệu nào</td></tr>
            )}
          </tbody>
        </table>
        <Pagination pagination={pagination} onPageChange={setPage} onLimitChange={(n) => { setLimit(n); setPage(1); }} />
      </div>
    </div>
  );
}
