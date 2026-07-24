/**
 * Shared TypeScript Types
 * Used across frontend and backend
 */

// ==================== User Types ====================
export type UserRole = 'student' | 'admin' | 'super_admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Student {
  id: string;
  userId: string;
  fullName: string;
  phone?: string;
  college?: string;
  usn?: string;
  branch?: string;
  profileCompleted: boolean;
  cameraPermission: boolean;
  microphonePermission: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Admin {
  id: string;
  userId: string;
  fullName?: string;
  department?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Question Types ====================
export type QuestionType = 'mcq' | 'coding' | 'essay' | 'true_false';
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';
export type Branch = 'CSE' | 'ECE' | 'MECH' | 'CIVIL' | 'EEE' | 'OTHER';

export interface MCQOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  questionText: string;
  type: QuestionType;
  difficulty: QuestionDifficulty;
  branch: Branch;
  optionsJson?: MCQOption[] | string[];
  correctAnswer?: string;
  explanation?: string;
  timeLimitSeconds: number;
  points: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Test Types ====================
export type TestStatus = 'not_started' | 'in_progress' | 'paused' | 'submitted' | 'evaluated';
export type ViolationType = 'tab_switch' | 'window_blur' | 'copy_paste' | 'right_click' | 'camera_off' | 'microphone_off' | 'multiple_faces' | 'suspicious_activity';
export type ViolationSeverity = 'warning' | 'critical';

export interface Test {
  id: string;
  studentId: string;
  startTime?: Date;
  endTime?: Date;
  status: TestStatus;
  totalDuration: number; // in seconds
  currentDuration: number; // elapsed time in seconds
  violationsCount: number;
  score?: number;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestResponse {
  id: string;
  testId: string;
  questionId: string;
  studentAnswer?: string;
  isCorrect?: boolean;
  pointsEarned: number;
  aiEvaluationJson?: any;
  autoSavedAt?: Date;
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Violation {
  id: string;
  testId: string;
  violationType: ViolationType;
  description?: string;
  severity: ViolationSeverity;
  timestamp: Date;
  createdAt: Date;
}

// ==================== Test Template Types ====================
export interface TestTemplate {
  id: string;
  name: string;
  description?: string;
  totalQuestions: number;
  totalDuration: number; // in seconds
  branch: Branch;
  createdBy: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Analytics Types ====================
export interface TestAnalytics {
  id: string;
  testId: string;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unanswered: number;
  totalScore: number;
  timeTaken: number; // in seconds
  violationsCount: number;
  percentile?: number;
  createdAt: Date;
}

export interface DashboardStats {
  totalStudents: number;
  totalTests: number;
  averageScore: number;
  passingPercentage: number;
  topPerformers: Student[];
  recentTests: Test[];
}

// ==================== API Request/Response Types ====================
export interface AuthRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ErrorDetail {
  code: string;
  message: string;
  details?: any;
}

// ==================== Utility Types ====================
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

// Re-export everything
export default {
  UserRole,
  User,
  Student,
  Admin,
  Question,
  Test,
  TestResponse,
  Violation,
  TestTemplate,
  TestAnalytics,
  DashboardStats,
  AuthRequest,
  AuthResponse,
  PaginatedResponse,
  ErrorDetail,
};
