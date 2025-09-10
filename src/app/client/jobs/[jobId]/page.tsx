"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  RefreshCw,
  Clock, 
  CheckCircle, 
  XCircle, 
  Book, 
  FileText, 
  Layers,
  Calendar,
  User,
  AlertCircle,
  Info
} from "lucide-react";
import { toast } from "sonner";
import { JobDetailResponse } from "@/types/jobs";

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;
  
  const [job, setJob] = useState<JobDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJob = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_ROUTE}/source/job/${jobId}`
      );
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Job not found");
        }
        throw new Error("Failed to fetch job details");
      }
      
      const data: JobDetailResponse = await response.json();
      setJob(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      toast.error("Failed to load job details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jobId) {
      fetchJob();
      
      // Poll every 5 seconds if job is not completed
      const interval = setInterval(() => {
        if (job && (job.status === "pending" || job.status === "processing")) {
          fetchJob();
        }
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [jobId, job?.status]);

  const getStatusIcon = (status: JobDetailResponse["status"]) => {
    switch (status) {
      case "pending":
        return <Clock size={20} className="text-yellow-500" />;
      case "processing":
        return <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case "completed":
        return <CheckCircle size={20} className="text-green-500" />;
      case "failed":
        return <XCircle size={20} className="text-red-500" />;
      default:
        return <Clock size={20} />;
    }
  };

  const getStatusVariant = (status: JobDetailResponse["status"]) => {
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

  const getTypeIcon = (type: JobDetailResponse["type"]) => {
    switch (type) {
      case "book":
        return <Book size={20} />;
      case "article":
        return <FileText size={20} />;
      case "context":
        return <Layers size={20} />;
      default:
        return <FileText size={20} />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getDuration = () => {
    if (!job?.startedAt || !job?.completedAt) return null;
    
    const start = new Date(job.startedAt);
    const end = new Date(job.completedAt);
    const duration = end.getTime() - start.getTime();
    
    if (duration < 1000) return `${duration}ms`;
    if (duration < 60000) return `${Math.round(duration / 1000)}s`;
    return `${Math.round(duration / 60000)}m`;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading job details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft size={16} className="mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Job Details</h1>
        </div>
        
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
            <p className="text-red-500 mb-4">{error || "Job not found"}</p>
            <Button onClick={fetchJob}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft size={16} className="mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {getTypeIcon(job.type)}
            Job Details
          </h1>
          <p className="text-muted-foreground">Job ID: {job.jobId}</p>
        </div>
        <Button onClick={fetchJob} disabled={loading} variant="outline">
          <RefreshCw size={16} className={`mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Job Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {job.title || `${job.type} Job`}
                  </CardTitle>
                  {job.author && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <User size={14} />
                      {job.author}
                    </div>
                  )}
                </div>
                <Badge variant={getStatusVariant(job.status)} className="flex items-center gap-1">
                  {getStatusIcon(job.status)}
                  {job.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="flex items-center gap-1">
                    <Calendar size={14} />
                    {formatDate(job.createdAt)}
                  </p>
                </div>
                
                {job.startedAt && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Started</label>
                    <p className="flex items-center gap-1">
                      <Clock size={14} />
                      {formatDate(job.startedAt)}
                    </p>
                  </div>
                )}
                
                {job.completedAt && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Completed</label>
                    <p className="flex items-center gap-1">
                      <CheckCircle size={14} />
                      {formatDate(job.completedAt)}
                      {getDuration() && (
                        <span className="ml-1 text-xs bg-muted px-1 rounded">
                          ({getDuration()})
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Error Details */}
          {job.error && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <XCircle size={20} />
                  Error Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg">
                  <p className="text-red-700 dark:text-red-300">{job.error}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Result Details */}
          {job.result && job.status === "completed" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle size={20} />
                  Processing Result
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <Info size={16} />
                    <span className="font-medium">Success:</span>
                    <Badge variant={job.result.success ? "default" : "destructive"}>
                      {job.result.success ? "Yes" : "No"}
                    </Badge>
                  </div>
                  
                  <div>
                    <span className="font-medium">Chunks Processed:</span>
                    <span className="ml-2">{job.result.chunks_processed}</span>
                  </div>
                  {job.result.sourceIdPrefix && (
                  <div>
                    <span className="font-medium">Sorce Prefix:</span>
                    <span className="ml-2">{job.result.sourceIdPrefix}</span>
                  </div>
                  )}
                  {job.result.book && (
                    <div>
                      <span className="font-medium">Book:</span>
                      <span className="ml-2">{job.result.book}</span>
                    </div>
                  )}
                  
                  {job.result.author && (
                    <div>
                      <span className="font-medium">Author:</span>
                      <span className="ml-2">{job.result.author}</span>
                    </div>
                  )}
                  
                  {job.result.tier && (
                    <div>
                      <span className="font-medium">Tier:</span>
                      <span className="ml-2">{job.result.tier}</span>
                    </div>
                  )}
                  
                  {job.result.resumed_from_seq !== undefined && (
                    <div>
                      <span className="font-medium">Resumed from sequence:</span>
                      <span className="ml-2">{job.result.resumed_from_seq}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Job Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Type</label>
                <div className="flex items-center gap-2 mt-1">
                  {getTypeIcon(job.type)}
                  <span className="capitalize">{job.type}</span>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Job ID</label>
                <p className="text-sm font-mono bg-muted p-2 rounded mt-1 break-all">
                  {job.jobId}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusIcon(job.status)}
                  <span className="capitalize">{job.status}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                onClick={() => router.push("/client/jobs")} 
                variant="outline" 
                className="w-full"
              >
                View All Jobs
              </Button>
              
              {job.status === "failed" && (
                <Button 
                  onClick={() => {
                    // Here you could implement retry logic
                    toast.info("Retry functionality not implemented yet");
                  }} 
                  variant="outline" 
                  className="w-full"
                >
                  Retry Job
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
