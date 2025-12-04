import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
  totalItems?: number;
  showInfo?: boolean;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage = 10,
  totalItems,
  showInfo = true,
}: PaginationProps) {
  // Tính toán số item hiển thị
  const startItem = totalItems ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = totalItems
    ? Math.min(currentPage * itemsPerPage, totalItems)
    : 0;

  // Tạo danh sách số trang để hiển thị
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5; // Số trang tối đa hiển thị

    if (totalPages <= maxVisible) {
      // Nếu tổng số trang <= 5, hiển thị tất cả
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Logic hiển thị trang với ellipsis
      if (currentPage <= 3) {
        // Trang đầu: 1, 2, 3, 4, ..., last
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Trang cuối: 1, ..., n-3, n-2, n-1, n
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Trang giữa: 1, ..., current-1, current, current+1, ..., last
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  if (totalPages <= 1) {
    return null; // Không hiển thị phân trang nếu chỉ có 1 trang hoặc không có dữ liệu
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
      {/* Thông tin số item */}
      {showInfo && totalItems && (
        <div className="text-sm text-muted-foreground">
          Hiển thị <span className="font-medium text-foreground">{startItem}</span> -{' '}
          <span className="font-medium text-foreground">{endItem}</span> trong tổng số{' '}
          <span className="font-medium text-foreground">{totalItems}</span> mục
        </div>
      )}

      {/* Nút phân trang */}
      <div className="flex items-center gap-2">
        {/* Nút Previous */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-muted bg-background text-muted-foreground transition-all hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-background disabled:hover:text-muted-foreground"
          aria-label="Trang trước"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Số trang */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 text-muted-foreground"
                >
                  ...
                </span>
              );
            }

            const pageNum = page as number;
            const isActive = pageNum === currentPage;

            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => onPageChange(pageNum)}
                className={`inline-flex items-center justify-center min-w-[2.5rem] h-10 rounded-lg border transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm font-semibold'
                    : 'border-muted bg-background text-foreground hover:bg-muted hover:border-primary/30'
                }`}
                aria-label={`Trang ${pageNum}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Nút Next */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-muted bg-background text-muted-foreground transition-all hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-background disabled:hover:text-muted-foreground"
          aria-label="Trang sau"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

