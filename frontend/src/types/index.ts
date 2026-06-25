export type Role = "USER" | "ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface VideoWithProgress {
  id: string;
  title: string;
  description?: string | null;
  youtubeVideoId: string;
  durationSeconds: number | null;
  lastWatchedSecond: number;
  watchedPercentage: number;
  isCompleted: boolean;
}

export interface ReportRow {
  assignmentId: string;
  userId: string;
  userName: string;
  userEmail: string;
  videoId: string;
  videoTitle: string;
  durationSeconds: number | null;
  lastWatchedSecond: number;
  watchedPercentage: number;
  isCompleted: boolean;
  updatedAt: string | null;
}

export interface ReportSummary {
  totalUsers: number;
  totalVideos: number;
  totalAssignments: number;
  completedCount: number;
  completionRate: number;
}
