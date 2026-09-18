import { ChevronLeft, ChevronRight } from 'lucide-react';

const LIMIT_OPTIONS = [10, 20, 50, 100];

// Shared list-footer control: page navigation + "rows per page" selector.
// `pagination` is the {page, limit, total, totalPages} shape returned by the
// backend's paginationMeta() helper.
export default function Pagination({ pagination, onPageChange, onLimitChange }) {
  if (!pagination) return null;
  const { page, limit, total, totalPages } = pagination;
  if (total === 0) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
      <div className="flex items-center gap-2 whitespace-nowrap">
        <span className="whitespace-nowrap">
          <span className="font-medium text-gray-700">{from}–{to}</span> / {total}
        </span>
        {onLimitChange && (
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="input-sm !py-1"
          >
            {LIMIT_OPTIONS.map((n) => (
              <option key={n} value={n}>{n} / trang</option>
            ))}
          </select>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          aria-label="Trang trước"
        >
          <ChevronLeft size={15} />
        </button>
        <span className="px-2.5 py-1 rounded-md bg-gray-100 text-xs font-medium text-gray-600 whitespace-nowrap">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          aria-label="Trang sau"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
