"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import MapleAuction from "@/components/exchange/maple-auction";
import StatisticsDashboard from "@/components/exchange/statistics-dashboard";

type CurrentUser = {
  id: string;
  nickname: string;
  isAdmin: boolean;
};

type TabType = "exchange" | "statistics";

export default function ExchangeClient({ currentUser }: { currentUser: CurrentUser }) {
  const [activeTab, setActiveTab] = useState<TabType>("exchange");

  const tabs = [
    { id: "exchange" as TabType, label: "거래소", description: "아이템을 거래할 수 있습니다" },
    { id: "statistics" as TabType, label: "통계", description: "거래 통계와 트렌드를 확인할 수 있습니다" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">거래소</h1>
        <p className="text-muted-foreground">
          {tabs.find(tab => tab.id === activeTab)?.description}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border">
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "exchange" && <MapleAuction />}
        {activeTab === "statistics" && <StatisticsDashboard />}
      </div>
    </div>
  );
}

