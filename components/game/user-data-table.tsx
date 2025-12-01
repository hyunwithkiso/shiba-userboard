"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { LogRecord } from "@/services/new-log-service";
import { format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface UserDataTableProps {
    logs: LogRecord[];
    totalPages: number;
    currentPage: number;
}

export function UserDataTable({ logs, totalPages, currentPage }: UserDataTableProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const createPageURL = (pageNumber: number | string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", pageNumber.toString());
        return `?${params.toString()}`;
    };

    const renderPaginationItems = () => {
        const items: React.ReactNode[] = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        if (startPage > 1) {
            items.push(
                <PaginationItem key="1">
                    <PaginationLink href={createPageURL(1)}>1</PaginationLink>
                </PaginationItem>
            );
            if (startPage > 2) {
                items.push(
                    <PaginationItem key="ellipsis-start">
                        <PaginationEllipsis />
                    </PaginationItem>
                );
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            items.push(
                <PaginationItem key={i}>
                    <PaginationLink
                        href={createPageURL(i)}
                        isActive={currentPage === i}
                    >
                        {i}
                    </PaginationLink>
                </PaginationItem>
            );
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                items.push(
                    <PaginationItem key="ellipsis-end">
                        <PaginationEllipsis />
                    </PaginationItem>
                );
            }
            items.push(
                <PaginationItem key={totalPages}>
                    <PaginationLink href={createPageURL(totalPages)}>
                        {totalPages}
                    </PaginationLink>
                </PaginationItem>
            );
        }

        return items;
    };

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[180px]">Timestamp</TableHead>
                            <TableHead className="w-[100px]">Type</TableHead>
                            <TableHead className="w-[100px]">Level</TableHead>
                            <TableHead>Message</TableHead>
                            <TableHead className="w-[200px]">Details</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No logs found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            logs.map((log, index) => (
                                <TableRow key={log.id || index}>
                                    <TableCell className="font-mono text-xs">
                                        {log.timestamp ? format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss") : "-"}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{log.type || log.action || "Unknown"}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        {log.level && (
                                            <Badge
                                                variant={
                                                    log.level === "error"
                                                        ? "destructive"
                                                        : log.level === "warn"
                                                            ? "secondary" // Changed from "warning" to "secondary" as "warning" is not standard shadcn
                                                            : "secondary"
                                                }
                                            >
                                                {log.level}
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="max-w-[400px] truncate" title={log.message}>
                                        {log.message}
                                    </TableCell>
                                    <TableCell>
                                        <ScrollArea className="h-[50px] w-full rounded-md border p-2 text-xs font-mono">
                                            {log.metadata ? JSON.stringify(log.metadata, null, 2) :
                                                log.details ? JSON.stringify(log.details, null, 2) : "-"}
                                        </ScrollArea>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {totalPages > 1 && (
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                href={createPageURL(currentPage - 1)}
                                aria-disabled={currentPage <= 1}
                                className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                            />
                        </PaginationItem>
                        {renderPaginationItems()}
                        <PaginationItem>
                            <PaginationNext
                                href={createPageURL(currentPage + 1)}
                                aria-disabled={currentPage >= totalPages}
                                className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
        </div>
    );
}
