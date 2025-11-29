"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown, ChevronRight, Play, Loader2, Key, Copy, RefreshCw, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateApiKey, getApiKey } from "./actions";
import { toast } from "sonner";

export default function ApiDocsPage() {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [response, setResponse] = useState<any>(null);
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [showKey, setShowKey] = useState(false);
    const [isGeneratingKey, setIsGeneratingKey] = useState(false);
    const [params, setParams] = useState({
        limit: "50",
        offset: "0",
        type: "",
        startDate: "",
        endDate: "",
    });

    useEffect(() => {
        // Fetch existing API key on mount
        getApiKey().then((data) => {
            if (data?.key) {
                setApiKey(data.key);
            }
        });
    }, []);

    const handleGenerateKey = async () => {
        setIsGeneratingKey(true);
        try {
            const data = await generateApiKey();
            setApiKey(data.key);
            toast.success("API Key generated successfully");
        } catch (error) {
            toast.error("Failed to generate API Key");
        } finally {
            setIsGeneratingKey(false);
        }
    };

    const handleCopyKey = () => {
        if (apiKey) {
            navigator.clipboard.writeText(apiKey);
            toast.success("API Key copied to clipboard");
        }
    };

    const handleExecute = async () => {
        if (!apiKey) {
            toast.error("API Key is required. Please generate one first.");
            return;
        }

        setIsLoading(true);
        setResponse(null);
        try {
            const queryParams = new URLSearchParams();
            if (params.limit) queryParams.set("limit", params.limit);
            if (params.offset) queryParams.set("offset", params.offset);
            if (params.type && params.type !== "ALL") queryParams.set("type", params.type);
            if (params.startDate) queryParams.set("startDate", params.startDate);
            if (params.endDate) queryParams.set("endDate", params.endDate);

            const res = await fetch(`/api/logs?${queryParams.toString()}`, {
                headers: {
                    "x-api-key": apiKey,
                },
            });
            const data = await res.json();
            setResponse({
                status: res.status,
                statusText: res.statusText,
                data,
            });
        } catch (error) {
            setResponse({ error: "Failed to fetch" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="flex-1 py-24">
            <div className="container mx-auto max-w-5xl space-y-8">
                <div className="flex flex-col items-start gap-2">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">v1.0.0</Badge>
                        <Badge className="bg-blue-600 hover:bg-blue-700">Beta</Badge>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        API Documentation
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Shiba Userboard API 명세서 및 테스트 도구
                    </p>
                </div>

                {/* API Key Management Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Key className="w-5 h-5 text-yellow-500" />
                            Authentication
                        </CardTitle>
                        <CardDescription>
                            API를 사용하기 위해서는 API Key가 필요합니다. Key는 헤더의 <code>x-api-key</code>에 포함되어야 합니다.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="relative flex-1">
                                <Input
                                    type={showKey ? "text" : "password"}
                                    value={apiKey || ""}
                                    placeholder="No API Key generated"
                                    readOnly
                                    className="font-mono pr-24"
                                />
                                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    {apiKey && (
                                        <>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={() => setShowKey(!showKey)}
                                            >
                                                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={handleCopyKey}
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                            <Button onClick={handleGenerateKey} disabled={isGeneratingKey}>
                                {isGeneratingKey ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                )}
                                {apiKey ? "Regenerate Key" : "Generate Key"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-6">
                    <Card className={cn("border-l-4 border-l-green-500 transition-all duration-200 shadow-sm hover:shadow-md", isExpanded ? "ring-1 ring-green-500/20" : "")}>
                        <div
                            className="flex items-center justify-between p-4 cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            <div className="flex items-center gap-3">
                                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 font-bold px-3 py-1 text-sm">GET</Badge>
                                <span className="font-mono text-sm font-medium text-foreground">/api/logs</span>
                                <span className="text-sm text-muted-foreground hidden sm:inline-block">- 사용자 로그 조회</span>
                            </div>
                            {isExpanded ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                        </div>

                        {isExpanded && (
                            <CardContent className="p-0 border-t">
                                <div className="p-6 space-y-8">

                                    {/* Description */}
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-semibold text-foreground/90">Description</h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            사용자의 활동 로그를 조회합니다.
                                            <br />
                                            유효한 API Key가 필요합니다.
                                        </p>
                                    </div>

                                    {/* Parameters */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between border-b pb-2">
                                            <h3 className="text-sm font-semibold text-foreground/90">Parameters</h3>
                                            <Button
                                                size="sm"
                                                onClick={handleExecute}
                                                disabled={isLoading || !apiKey}
                                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-50"
                                            >
                                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4 fill-current" />}
                                                Try it out
                                            </Button>
                                        </div>

                                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                            <div className="space-y-2">
                                                <Label htmlFor="type" className="text-xs font-semibold uppercase text-muted-foreground">Log Type</Label>
                                                <Select
                                                    value={params.type}
                                                    onValueChange={(val) => setParams({ ...params, type: val })}
                                                >
                                                    <SelectTrigger id="type" className="w-full">
                                                        <SelectValue placeholder="Select Type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="ALL">All Types</SelectItem>
                                                        <SelectItem value="ITEM_TRADE">ITEM_TRADE</SelectItem>
                                                        <SelectItem value="MONEY_TRADE">MONEY_TRADE</SelectItem>
                                                        <SelectItem value="BANK_TRADE">BANK_TRADE</SelectItem>
                                                        <SelectItem value="VEHICLE_TRADE">VEHICLE_TRADE</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <p className="text-[10px] text-muted-foreground">로그 타입을 필터링합니다.</p>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="limit" className="text-xs font-semibold uppercase text-muted-foreground">Limit</Label>
                                                <Input
                                                    id="limit"
                                                    type="number"
                                                    value={params.limit}
                                                    onChange={(e) => setParams({ ...params, limit: e.target.value })}
                                                    className="font-mono"
                                                />
                                                <p className="text-[10px] text-muted-foreground">한 번에 가져올 로그 수 (Default: 50)</p>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="offset" className="text-xs font-semibold uppercase text-muted-foreground">Offset</Label>
                                                <Input
                                                    id="offset"
                                                    type="number"
                                                    value={params.offset}
                                                    onChange={(e) => setParams({ ...params, offset: e.target.value })}
                                                    className="font-mono"
                                                />
                                                <p className="text-[10px] text-muted-foreground">건너뛸 로그 수 (Default: 0)</p>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="startDate" className="text-xs font-semibold uppercase text-muted-foreground">Start Date</Label>
                                                <Input
                                                    id="startDate"
                                                    type="date"
                                                    value={params.startDate}
                                                    onChange={(e) => setParams({ ...params, startDate: e.target.value })}
                                                    className="font-mono"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="endDate" className="text-xs font-semibold uppercase text-muted-foreground">End Date</Label>
                                                <Input
                                                    id="endDate"
                                                    type="date"
                                                    value={params.endDate}
                                                    onChange={(e) => setParams({ ...params, endDate: e.target.value })}
                                                    className="font-mono"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Response */}
                                    {response && (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-semibold text-foreground/90">Server Response</h3>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-muted-foreground">Status:</span>
                                                    <Badge variant={response.status === 200 ? "default" : "destructive"} className="font-mono text-xs">
                                                        {response.status} {response.statusText}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="rounded-md border bg-slate-950 p-4 overflow-hidden">
                                                <div className="overflow-x-auto max-h-[400px] scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                                                    <pre className="text-xs font-mono text-slate-50 leading-relaxed">
                                                        {JSON.stringify(response.data, null, 2)}
                                                    </pre>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                </div>
                            </CardContent>
                        )}
                    </Card>
                </div>
            </div>
        </main>
    );
}
