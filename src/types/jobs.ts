// Types for Job system

export interface JobResult {
  success: boolean;
  chunks_processed: number;
  book?: string;
  author?: string;
  tier?: number;
  resumed_from_seq?: number;
  sourceIdPrefix?: string;
}

export interface Job {
  jobId: string;
  type: "book" | "article" | "context";
  status: "pending" | "processing" | "completed" | "failed";
  title?: string;
  author?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  result?: JobResult;
}

export interface JobsResponse {
  jobs: Job[];
}

export interface JobQueueStatus {
  isProcessing: boolean;
  queueLength: number;
}

export type JobDetailResponse = Job
