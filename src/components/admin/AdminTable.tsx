import { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Column<T> {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  width?: string;
}

interface AdminTableProps<T> {
  columns: Column<T>[];
  data: T[];
  page: number;
  pages: number;
  total: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  emptyIcon?: string;
  emptyMessage?: string;
}

export function AdminTable<T extends { _id: string }>({
  columns, data, page, pages, total, onPageChange,
  isLoading, emptyIcon = '📭', emptyMessage = 'No data found',
}: AdminTableProps<T>) {
  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {columns.map(col => (
                <th key={col.key} className={`px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide ${col.width || ''}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  {columns.map(col => (
                    <td key={col.key} className="px-4 py-3">
                      <div className="h-4 bg-muted rounded skeleton" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <div className="text-4xl mb-2">{emptyIcon}</div>
                  <p className="text-muted-foreground text-sm">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              data.map(row => (
                <tr key={row._id} className="hover:bg-muted/20 transition-colors">
                  {columns.map(col => (
                    <td key={col.key} className="px-4 py-3 align-middle">{col.render(row)}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
          <p className="text-xs text-muted-foreground">
            Page <strong>{page}</strong> of <strong>{pages}</strong> · <strong>{total}</strong> total
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => onPageChange(page - 1)} disabled={page <= 1}
              className="p-1.5 rounded-lg border border-border hover:bg-accent disabled:opacity-40 transition-colors">
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => onPageChange(p)}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${p === page ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}>
                {p}
              </button>
            ))}
            <button onClick={() => onPageChange(page + 1)} disabled={page >= pages}
              className="p-1.5 rounded-lg border border-border hover:bg-accent disabled:opacity-40 transition-colors">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
