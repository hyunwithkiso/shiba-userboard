"use client";

import { useEffect, useState } from "react";
import { getAllApiKeys, revokeApiKey, type ApiKeyData } from "./actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Search, Ban, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function AdminApiKeysPage() {
    const [keys, setKeys] = useState<ApiKeyData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isRevoking, setIsRevoking] = useState<string | null>(null);

    useEffect(() => {
        fetchKeys();
    }, []);

    const fetchKeys = async () => {
        setIsLoading(true);
        try {
            const result = await getAllApiKeys();
            if (result.success && result.data) {
                setKeys(result.data);
            } else {
                toast.error(result.error || "Failed to fetch API keys");
            }
        } catch (error) {
            toast.error("An error occurred while fetching keys");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRevoke = async (id: string) => {
        if (!confirm("Are you sure you want to revoke this API key? This action cannot be undone.")) {
            return;
        }

        setIsRevoking(id);
        try {
            const result = await revokeApiKey(id);
            if (result.success) {
                toast.success("API Key revoked successfully");
                fetchKeys(); // Refresh list
            } else {
                toast.error(result.error || "Failed to revoke API key");
            }
        } catch (error) {
            toast.error("An error occurred while revoking the key");
        } finally {
            setIsRevoking(null);
        }
    };

    const filteredKeys = keys.filter((key) => {
        const searchLower = searchTerm.toLowerCase();
        return (
            key.user?.nickname?.toLowerCase().includes(searchLower) ||
            key.user?.email?.toLowerCase().includes(searchLower) ||
            key.key.toLowerCase().includes(searchLower)
        );
    });

    return (
        <div className="container mx-auto py-24 space-y-8 max-w-7xl">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">API Key Management</h1>
                <p className="text-muted-foreground">
                    Manage user API keys. View usage and revoke keys if necessary.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>All API Keys</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search user or key..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </div>
                    <CardDescription>
                        Total {keys.length} keys found.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>API Key</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Created At</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredKeys.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">
                                                No API keys found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredKeys.map((key) => (
                                            <TableRow key={key.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={key.user?.image || ""} />
                                                            <AvatarFallback>{key.user?.nickname?.[0] || "U"}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{key.user?.nickname || "Unknown"}</span>
                                                            <span className="text-xs text-muted-foreground">{key.user?.email}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                                                        {key.key.substring(0, 8)}...
                                                    </code>
                                                </TableCell>
                                                <TableCell>
                                                    {key.isActive ? (
                                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
                                                            <CheckCircle className="h-3 w-3" /> Active
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1">
                                                            <XCircle className="h-3 w-3" /> Revoked
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {format(new Date(key.createdAt), "yyyy-MM-dd HH:mm")}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {key.isActive && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => handleRevoke(key.id)}
                                                            disabled={isRevoking === key.id}
                                                        >
                                                            {isRevoking === key.id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Ban className="h-4 w-4 mr-1" />
                                                            )}
                                                            Revoke
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
