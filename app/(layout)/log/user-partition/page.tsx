import { Suspense } from "react";
import { NewLogService } from "@/services/new-log-service";
import { UserLogFilter } from "@/components/game/user-log-filter";
import { UserDataTable } from "@/components/game/user-data-table";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "User Partition Logs",
    description: "View user logs from partition server",
};

interface PageProps {
    searchParams: {
        page?: string;
        limit?: string;
        startDate?: string;
        endDate?: string;
        type?: string;
        message?: string;
        userId?: string;
    };
}

export default async function PartitionLogPage({ searchParams }: PageProps) {
    const page = parseInt(searchParams.page || "1");
    const limit = parseInt(searchParams.limit || "20");

    const logsData = await NewLogService.getPartitionLogs({
        page,
        limit,
        startDate: searchParams.startDate,
        endDate: searchParams.endDate,
        type: searchParams.type,
        message: searchParams.message,
        userId: searchParams.userId,
    });

    return (
        <div className="container mx-auto py-10">
            <div className="flex flex-col gap-4">
                <h1 className="text-2xl font-bold tracking-tight">User Partition Logs</h1>
                <p className="text-muted-foreground">
                    View and filter user logs from the partition log system.
                </p>

                <UserLogFilter />

                <Suspense fallback={<div>Loading logs...</div>}>
                    <UserDataTable
                        logs={logsData.records}
                        totalPages={logsData.totalPages}
                        currentPage={page}
                    />
                </Suspense>
            </div>
        </div>
    );
}
