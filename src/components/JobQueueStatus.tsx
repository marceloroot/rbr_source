"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, AlertCircle } from "lucide-react";
import { JobQueueStatus } from "@/types/jobs";

export default function JobQueueStatusComponent() {
  const [queueStatus, setQueueStatus] = useState<JobQueueStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQueueStatus = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_ROUTE}/source/job-queue/status`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch queue status");
      }
      
      const data: JobQueueStatus = await response.json();
      setQueueStatus(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueStatus();
    
    // Poll every 5 seconds
    const interval = setInterval(fetchQueueStatus, 5000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock size={16} />
            Job Queue Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertCircle size={16} />
            Job Queue Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-500">Error: {error}</div>
        </CardContent>
      </Card>
    );
  }

  if (!queueStatus) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Clock size={16} />
          Job Queue Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm">Processing:</span>
          <Badge variant={queueStatus.isProcessing ? "default" : "secondary"}>
            {queueStatus.isProcessing ? (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Active
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <CheckCircle size={12} />
                Idle
              </div>
            )}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Queue Length:</span>
          <Badge variant="outline">
            {queueStatus.queueLength} jobs
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
