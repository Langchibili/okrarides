'use client';

import BaseDataTable from '@/components/admin/DataTable';

export function DataTable(props) {
  return <BaseDataTable {...props} />;
}

export function Pagination({ page = 1, pageCount = 1, total = 0, pageSize = 20, onChange }) {
  if (pageCount <= 1) return null;
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);
  return (
    <div className="table-pagination">
      <span>Showing {first}–{last} of {total}</span>
      <div>
        <button type="button" onClick={() => onChange(Math.max(1, page - 1))} disabled={page <= 1}>Previous</button>
        <span>{page} / {pageCount}</span>
        <button type="button" onClick={() => onChange(Math.min(pageCount, page + 1))} disabled={page >= pageCount}>Next</button>
      </div>
    </div>
  );
}
