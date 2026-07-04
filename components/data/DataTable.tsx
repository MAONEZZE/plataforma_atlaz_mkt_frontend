"use client";

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useState } from "react";
import { ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onChange: (page: number) => void;
  };
  onRowClick?: (row: T) => void;
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  isLoading,
  emptyState,
  pagination,
  onRowClick,
  className,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: !!pagination,
  });

  const totalPages = pagination ? Math.ceil(pagination.total / pagination.pageSize) : 1;

  return (
    <div className={cn("space-y-4", className)}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null : header.column.getCanSort() ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-2 h-8 font-medium"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === "asc" ? (
                        <ChevronUp className="ml-1 size-3.5" />
                      ) : header.column.getIsSorted() === "desc" ? (
                        <ChevronDown className="ml-1 size-3.5" />
                      ) : (
                        <ArrowUpDown className="ml-1 size-3.5 opacity-40" />
                      )}
                    </Button>
                  ) : (
                    flexRender(header.column.columnDef.header, header.getContext())
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {columns.map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-32 text-center">
                {emptyState ?? "Nenhum resultado."}
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                onClick={() => onRowClick?.(row.original)}
                className={cn(onRowClick && "cursor-pointer hover:bg-accent/40")}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {pagination && totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => pagination.onChange(Math.max(1, pagination.page - 1))}
                aria-disabled={pagination.page <= 1}
                className={pagination.page <= 1 ? "pointer-events-none opacity-40" : "cursor-pointer"}
              />
            </PaginationItem>
            <PaginationItem>
              <span className="text-sm text-muted-foreground px-3">
                Página {pagination.page} de {totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                onClick={() => pagination.onChange(Math.min(totalPages, pagination.page + 1))}
                aria-disabled={pagination.page >= totalPages}
                className={pagination.page >= totalPages ? "pointer-events-none opacity-40" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
