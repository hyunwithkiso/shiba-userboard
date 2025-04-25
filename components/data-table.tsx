"use client";

import { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Pagination from "@/components/pagination";

export interface Column<T> {
  header: string;
  accessorKey: keyof T;
  cell?: (item: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  isLoading?: boolean;
  keyField: keyof T;
  emptyMessage?: string;
}

export function DataTable<T>({
  columns,
  data,
  totalItems,
  itemsPerPage,
  currentPage,
  isLoading = false,
  keyField,
  emptyMessage = "데이터가 없습니다.",
}: DataTableProps<T>) {
  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={String(column.accessorKey)}
                  className={column.className}
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // 로딩 상태
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`loading-${index}`}>
                  {columns.map((column) => (
                    <TableCell
                      key={`loading-cell-${index}-${String(
                        column.accessorKey
                      )}`}
                      className="py-3"
                    >
                      <div className="h-4 animate-pulse bg-muted rounded-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              // 데이터 없음
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              // 데이터 표시
              data.map((item) => (
                <TableRow key={String(item[keyField])}>
                  {columns.map((column) => (
                    <TableCell
                      key={String(column.accessorKey)}
                      className={column.className}
                    >
                      {column.cell
                        ? column.cell(item)
                        : (item[column.accessorKey] as ReactNode)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
      />
    </div>
  );
}
