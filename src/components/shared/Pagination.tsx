import React from 'react';
import Button from './Button';
import Text from './Text';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const Pagination: React.FC<PaginationProps> = ({
  page,
  pageSize,
  total,
  onPageChange,
  className,
}) => {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < pageCount;

  const goTo = (p: number) => {
    const clamped = Math.min(Math.max(1, p), pageCount);
    if (clamped !== page) onPageChange(clamped);
  };

  return (
    <div className={`flex items-center justify-center ${className ?? ''}`}>
      <div className="inline-flex items-center h-9 mt-1">
        <Button
          variant="ghost"
          size="sm"
          disabled={!canPrev}
          onClick={() => goTo(page - 1)}
          aria-label="Previous page"
          className="h-8 px-2 rounded-md transition-colors hover:bg-neutral-100 active:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 disabled:hover:bg-transparent"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="h-8 px-3 flex items-center">
          <Text variant="p" size="sm" className="text-neutral-600 leading-none mt-4">
            Page {page} of {pageCount}
          </Text>
        </div>
        <Button
          variant="ghost"
          size="sm"
          disabled={!canNext}
          onClick={() => goTo(page + 1)}
          aria-label="Next page"
          className="h-8 px-2 rounded-md transition-colors hover:bg-neutral-100 active:bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 disabled:hover:bg-transparent"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default Pagination;


