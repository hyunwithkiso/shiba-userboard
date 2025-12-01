"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function UserLogFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [startDate, setStartDate] = useState<Date | undefined>();
    const [endDate, setEndDate] = useState<Date | undefined>();
    const [type, setType] = useState<string>("");
    const [message, setMessage] = useState<string>("");

    // Initialize from URL
    useEffect(() => {
        const start = searchParams.get("startDate");
        const end = searchParams.get("endDate");
        const t = searchParams.get("type");
        const m = searchParams.get("message");

        if (start) setStartDate(new Date(start));
        if (end) setEndDate(new Date(end));
        if (t) setType(t);
        if (m) setMessage(m);
    }, [searchParams]);

    const handleSearch = () => {
        const params = new URLSearchParams(searchParams.toString());

        if (startDate) params.set("startDate", startDate.toISOString());
        else params.delete("startDate");

        if (endDate) params.set("endDate", endDate.toISOString());
        else params.delete("endDate");

        if (type && type !== "all") params.set("type", type);
        else params.delete("type");

        if (message) params.set("message", message);
        else params.delete("message");

        // Reset page on new search
        params.set("page", "1");

        router.push(`?${params.toString()}`);
    };

    const handleReset = () => {
        setStartDate(undefined);
        setEndDate(undefined);
        setType("");
        setMessage("");
        router.push("?");
    };

    return (
        <div className="flex flex-col gap-4 p-4 bg-background border rounded-lg mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Date Range - Start */}
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Start Date</label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !startDate && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={startDate}
                                onSelect={setStartDate}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Date Range - End */}
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">End Date</label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !endDate && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={endDate}
                                onSelect={setEndDate}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Type Select */}
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Log Type</label>
                    <Select value={type} onValueChange={setType}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="login">Login</SelectItem>
                            <SelectItem value="chat">Chat</SelectItem>
                            <SelectItem value="trade">Trade</SelectItem>
                            <SelectItem value="admin">Admin Action</SelectItem>
                            {/* Add more types as needed */}
                        </SelectContent>
                    </Select>
                </div>

                {/* Message Search */}
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Message / Keyword</label>
                    <Input
                        placeholder="Search message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    />
                </div>
            </div>

            <div className="flex justify-end gap-2 mt-2">
                <Button variant="outline" onClick={handleReset}>
                    <X className="mr-2 h-4 w-4" /> Reset
                </Button>
                <Button onClick={handleSearch}>
                    <Search className="mr-2 h-4 w-4" /> Search
                </Button>
            </div>
        </div>
    );
}
