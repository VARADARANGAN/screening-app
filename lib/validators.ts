/**
 * Validation Schemas using Zod
 * Centralized validation for all API inputs and forms
 */

import { z } from 'zod';

// ==================== Auth Schemas ====================
export const RegisterSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  role: z.enum(['student', 'admin']).default('student'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// ==================== Student Schemas ====================
export const StudentProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone must be 10 digits'),
  college: z.string().min(2, 'College name is required'),
  usn: z.string().min(1, 'USN is required'),
  branchId: z.string().uuid('Invalid branch ID'),
  cameraPermission: z.boolean().default(false),
  microphonePermission: z.boolean().default(false),
});

export const AdminProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  department: z.string().min(2, 'Department is required'),
});

// ==================== Question Schemas ====================
export const QuestionSchema = z.object({
  questionText: z.string().min(3, 'Question text must be at least 3 characters'),
  type: z.enum(['mcq', 'coding']),
  category: z.string().optional().default('General'),
  branchId: z.string().uuid('Invalid branch ID').or(z.literal('')).optional().nullable().transform(v => v === '' || v === null ? undefined : v),
  timeLimitSeconds: z.number().optional().default(60),
  points: z.number().min(1, 'Points must be at least 1'),
  isPublished: z.boolean().default(false),
  
  // Conditional validation based on type
  optionsJson: z.any().optional(),
  correctAnswer: z.string().optional(),
  explanation: z.string().optional(),
}).refine((data) => {
  // MCQ requires options and correct answer
  if (data.type === 'mcq') {
    return data.optionsJson && data.correctAnswer;
  }
  return true;
}, {
  message: 'MCQ questions require options and a correct answer',
});

// ==================== Branch Schemas ====================
export const BranchSchema = z.object({
  name: z.string().min(2, 'Branch name must be at least 2 characters'),
});

// ==================== Test Schemas ====================
export const CreateTestSchema = z.object({
  templateId: z.string().uuid('Invalid template ID').optional(),
  studentId: z.string().uuid('Invalid student ID'),
  totalDuration: z.number().min(60, 'Test duration must be at least 60 seconds'),
  questionIds: z.array(z.string().uuid()).min(1, 'At least one question is required'),
});

export const SubmitTestResponseSchema = z.object({
  testId: z.string().uuid('Invalid test ID'),
  questionId: z.string().uuid('Invalid question ID'),
  studentAnswer: z.string().optional(),
  isCorrect: z.boolean().optional(),
});

export const TestStatusUpdateSchema = z.object({
  testId: z.string().uuid('Invalid test ID'),
  status: z.enum(['not_started', 'in_progress', 'paused', 'submitted', 'evaluated']),
  currentDuration: z.number().min(0).optional(),
});

// ==================== Violation Schemas ====================
export const ViolationSchema = z.object({
  testId: z.string().uuid('Invalid test ID'),
  violationType: z.enum([
    'tab_switch',
    'window_blur',
    'copy_paste',
    'right_click',
    'camera_off',
    'microphone_off',
    'multiple_faces',
    'suspicious_activity',
  ]),
  description: z.string().optional(),
  severity: z.enum(['warning', 'critical']).default('warning'),
});

// ==================== File Upload Schemas ====================
export const FileUploadSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => file.size <= 5242880, // 5MB
    'File size must be less than 5MB'
  ),
  fileType: z.enum(['csv', 'xlsx', 'xls']),
});

// ==================== Pagination Schemas ====================
export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ==================== Analytics Schemas ====================
export const AnalyticsFilterSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  branch: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
});

// Type exports
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type StudentProfileInput = z.infer<typeof StudentProfileSchema>;
export type AdminProfileInput = z.infer<typeof AdminProfileSchema>;
export type QuestionInput = z.infer<typeof QuestionSchema>;
export type BranchInput = z.infer<typeof BranchSchema>;
export type CreateTestInput = z.infer<typeof CreateTestSchema>;
export type SubmitTestResponseInput = z.infer<typeof SubmitTestResponseSchema>;
export type TestStatusUpdateInput = z.infer<typeof TestStatusUpdateSchema>;
export type ViolationInput = z.infer<typeof ViolationSchema>;
export type FileUploadInput = z.infer<typeof FileUploadSchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;
export type AnalyticsFilterInput = z.infer<typeof AnalyticsFilterSchema>;

export default {
  RegisterSchema,
  LoginSchema,
  StudentProfileSchema,
  AdminProfileSchema,
  QuestionSchema,
  BranchSchema,
  CreateTestSchema,
  SubmitTestResponseSchema,
  TestStatusUpdateSchema,
  ViolationSchema,
  FileUploadSchema,
  PaginationSchema,
  AnalyticsFilterSchema,
};
