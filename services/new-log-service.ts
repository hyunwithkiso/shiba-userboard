import { auth } from "@/lib/auth";

export interface LogRecord {
    id: string;
    userId?: string;
    action?: string;
    type?: string; // The doc mentions 'type'
    level?: string;
    message?: string;
    timestamp: string; // ISO 8601
    metadata?: any;
    [key: string]: any; // Allow other fields
}

interface PartitionLogResponse {
    success: boolean;
    data: {
        memory?: { records: LogRecord[]; total: number };
        database?: { records: LogRecord[]; total: number };
        combined?: { records?: LogRecord[]; bufferSize?: number };
    };
}

export interface PartitionLogParams {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    type?: string;
    level?: string;
    message?: string;
    userId?: string;
    metadata?: string;
}

export class NewLogService {
    private static getApiUrl(): string {
        const url = process.env.PARTITION_LOG_SERVER_URL;
        if (!url) {
            console.warn("PARTITION_LOG_SERVER_URL is not set. Using default http://localhost:3001");
            return "http://localhost:3001";
        }
        return url;
    }

    static async getPartitionLogs(params: PartitionLogParams) {
        const baseUrl = this.getApiUrl();
        const query = new URLSearchParams();

        if (params.page) query.append("page", params.page.toString());
        if (params.limit) query.append("limit", params.limit.toString());
        if (params.startDate) query.append("startDate", params.startDate);
        if (params.endDate) query.append("endDate", params.endDate);
        if (params.type) query.append("type", params.type);
        if (params.level) query.append("level", params.level);
        if (params.message) query.append("message", params.message);
        if (params.metadata) query.append("metadata", params.metadata);

        try {
            const response = await fetch(`${baseUrl}/api/logs?${query.toString()}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": process.env.SHIBA_LOG_API_KEY || "",
                },
                cache: "no-store", // Ensure fresh data
            });

            if (!response.ok) {
                throw new Error(`External API error: ${response.status} ${response.statusText}`);
            }

            const result: PartitionLogResponse = await response.json();


            if (!result.success || !result.data) {
                return { records: [], totalPages: 0, totalRecords: 0 };
            }

            // Check if we have combined records directly (as seen in screenshots)
            if (result.data.combined && Array.isArray(result.data.combined.records)) {
                const combinedRecords = result.data.combined.records;
                const totalRecords = combinedRecords.length; // Or use a total count if provided
                const limit = params.limit || 50;
                const totalPages = Math.ceil(totalRecords / limit); // This might be inaccurate if API is already paged

                // If the API is already returning paged results in 'combined', we just return them.
                // Assuming the API handles sorting and pagination for 'combined'.

                return {
                    records: combinedRecords,
                    totalPages: totalPages || 1, // Fallback
                    totalRecords: totalRecords,
                    meta: {
                        // memoryTotal: ... // Not available in this structure
                        // databaseTotal: ... 
                    }
                };
            }


            // Fallback to old logic if 'memory' and 'database' exist (for backward compatibility or different API version)
            if (result.data.memory && result.data.database) {
                const { memory, database } = result.data;
                let combinedRecords = [...memory.records, ...database.records];

                combinedRecords.sort((a, b) => {
                    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
                });

                const limit = params.limit || 50;
                const memPages = Math.ceil(memory.total / limit);
                const dbPages = Math.ceil(database.total / limit);
                const totalRecords = Math.max(memory.total, database.total);
                const totalPages = Math.max(memPages, dbPages);



                return {
                    records: combinedRecords,
                    totalPages: totalPages,
                    totalRecords: totalRecords,
                    meta: {
                        memoryTotal: memory.total,
                        databaseTotal: database.total
                    }
                };
            }

            return { records: [], totalPages: 0, totalRecords: 0 };

        } catch (error) {
            console.error("Failed to fetch partition logs:", error);
            // Return empty structure on error to prevent page crash
            return { records: [], totalPages: 0, totalRecords: 0, error: String(error) };
        }
    }
}
