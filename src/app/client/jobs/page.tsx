"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  RefreshCw, 
  Search, 
  Filter, 
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Job, JobsResponse } from "@/types/jobs";
import JobCard from "@/components/JobCard";
import JobQueueStatusComponent from "@/components/JobQueueStatus";

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<Job["status"] | "all">("all");
  const [typeFilter, setTypeFilter] = useState<Job["type"] | "all">("all");

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_ROUTE}/source/jobs`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch jobs");
      }
      
      const data: JobsResponse = await response.json();
      setJobs(data.jobs);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    
    // Poll every 10 seconds
    const interval = setInterval(fetchJobs, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.jobId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    const matchesType = typeFilter === "all" || job.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusCounts = () => {
    const counts = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      total: jobs.length
    };
    
    jobs.forEach(job => {
      counts[job.status]++;
    });
    
    return counts;
  };

  const statusCounts = getStatusCounts();

  if (loading && jobs.length === 0) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading jobs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" asChild>
            <Link href="/client/search" className="flex items-center gap-2">
              <ArrowLeft size={16} />
              Back to Search
            </Link>
          </Button>
          <Button onClick={fetchJobs} disabled={loading} variant="outline">
            <RefreshCw size={16} className={`mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold">Jobs</h1>
          <p className="text-muted-foreground">
            Monitor and manage your ingestion jobs
          </p>
        </div>
      </div>

      {/* Queue Status */}
      <div className="mb-6">
        <JobQueueStatusComponent />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock size={20} className="text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{statusCounts.total}</p>
                <p className="text-sm text-muted-foreground">Total Jobs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock size={20} className="text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{statusCounts.pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <div>
                <p className="text-2xl font-bold">{statusCounts.processing}</p>
                <p className="text-sm text-muted-foreground">Processing</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle size={20} className="text-green-500" />
              <div>
                <p className="text-2xl font-bold">{statusCounts.completed}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle size={20} className="text-red-500" />
              <div>
                <p className="text-2xl font-bold">{statusCounts.failed}</p>
                <p className="text-sm text-muted-foreground">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter size={20} />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by title, author, or job ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as Job["status"] | "all")}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as Job["type"] | "all")}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">All Types</option>
                <option value="book">Book</option>
                <option value="article">Article</option>
                <option value="context">Context</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jobs List */}
      {error ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-500 mb-4">Error: {error}</p>
            <Button onClick={fetchJobs}>Try Again</Button>
          </CardContent>
        </Card>
      ) : filteredJobs.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              {jobs.length === 0 ? "No jobs found" : "No jobs match your filters"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <JobCard key={job.jobId} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
