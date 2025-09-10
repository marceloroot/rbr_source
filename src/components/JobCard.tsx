"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Book, 
  FileText, 
  Layers,
  Eye,
  Calendar,
  User
} from "lucide-react";
import { Job } from "@/types/jobs";
import Link from "next/link";

interface JobCardProps {
  job: Job;
}

export default function JobCard({ job }: JobCardProps) {
  const getStatusIcon = (status: Job["status"]) => {
    switch (status) {
      case "pending":
        return <Clock size={16} className="text-yellow-500" />;
      case "processing":
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case "completed":
        return <CheckCircle size={16} className="text-green-500" />;
      case "failed":
        return <XCircle size={16} className="text-red-500" />;
      default:
        return <Clock size={16} />;
    }
  };

  const getStatusVariant = (status: Job["status"]) => {
    switch (status) {
      case "pending":
        return "secondary" as const;
      case "processing":
        return "default" as const;
      case "completed":
        return "default" as const;
      case "failed":
        return "destructive" as const;
      default:
        return "secondary" as const;
    }
  };

  const getTypeIcon = (type: Job["type"]) => {
    switch (type) {
      case "book":
        return <Book size={16} />;
      case "article":
        return <FileText size={16} />;
      case "context":
        return <Layers size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getDuration = () => {
    if (!job.startedAt || !job.completedAt) return null;
    
    const start = new Date(job.startedAt);
    const end = new Date(job.completedAt);
    const duration = end.getTime() - start.getTime();
    
    if (duration < 1000) return `${duration}ms`;
    if (duration < 60000) return `${Math.round(duration / 1000)}s`;
    return `${Math.round(duration / 60000)}m`;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getTypeIcon(job.type)}
            <CardTitle className="text-base">
              {job.title || `${job.type} Job`}
            </CardTitle>
          </div>
          <Badge variant={getStatusVariant(job.status)} className="flex items-center gap-1">
            {getStatusIcon(job.status)}
            {job.status}
          </Badge>
        </div>
        {job.author && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <User size={14} />
            {job.author}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Calendar size={14} />
          Created: {formatDate(job.createdAt)}
        </div>
        
        {job.startedAt && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock size={14} />
            Started: {formatDate(job.startedAt)}
          </div>
        )}
        
        {job.completedAt && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <CheckCircle size={14} />
            Completed: {formatDate(job.completedAt)}
            {getDuration() && (
              <span className="ml-1 text-xs bg-muted px-1 rounded">
                ({getDuration()})
              </span>
            )}
          </div>
        )}
        
        {job.error && (
          <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-2 rounded">
            <strong>Error:</strong> {job.error}
          </div>
        )}
        
        {job.result && job.status === "completed" && (
          <div className="text-sm text-green-600 bg-green-50 dark:bg-green-950 p-2 rounded">
            <strong>Result:</strong> {job.result.chunks_processed} chunks processed
            {job.result.book && (
              <div className="mt-1">
                <strong>Book:</strong> {job.result.book}
              </div>
            )}
          </div>
        )}
        
        <div className="flex justify-between items-center pt-2">
          <div className="text-xs text-muted-foreground">
            ID: {job.jobId.slice(0, 8)}...
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href={`/client/jobs/${job.jobId}`}>
              <Eye size={14} className="mr-1" />
              View Details
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
