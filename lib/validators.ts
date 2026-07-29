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
  email: z.string().email('Invalid email format'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone must be 10 digits'),
  college: z.string().min(2, 'College name is required'),
  usn: z.string().min(1, 'USN is required'),
  branchName: z.string().min(1, 'Branch name is required'),
  cameraPermission: z.boolean().default(false),
  microphonePermission: z.boolean().default(false),
});

export const AdminProfileSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  department: z.string().min(2, 'Department is required'),
});

// ==================== Question Schemas ====================
export const QuestionSchema = z.object({
  questionText: z.string().min(3, 'Question text must be at least 3 characters'),
  type: z.enum(['mcq', 'coding', 'single_select', 'date', 'open_text', 'ranking', 'structured_response', 'code_response', 'code_review', 'structured_plan', 'multi_select', 'prompt_writing']),
  timeLimitSeconds: z.number().optional().default(60),
  points: z.number().min(0, 'Points must be at least 0').default(0),
  isPublished: z.boolean().default(false),
  explanation: z.string().optional(),
  
  weight: z.number().optional().default(1),
  expectedDuration: z.number().optional().default(5),
  isRequired: z.boolean().optional().default(true),
  displayOrder: z.number().optional().default(0),
  section: z.string().optional().default('APTITUDE'),
  sectionOrder: z.number().optional().default(0),
  questionOrder: z.number().optional().default(0),

  // Conditional validation based on type
  optionsJson: z.any().optional(),
  correctAnswer: z.string().optional(),
}).refine((data) => {
  if (data.type === 'mcq') {
    return !!data.optionsJson && !!data.correctAnswer;
  }
  if (data.type === 'single_select') {
    return !!data.optionsJson;
  }
  if (data.type === 'multi_select' || data.type === 'ranking') {
    return !!data.optionsJson && !!data.correctAnswer;
  }
  if (data.type === 'coding') {
    return !!data.optionsJson; // coding uses optionsJson for starter code and test cases
  }
  if (data.type === 'structured_response' || data.type === 'structured_plan') {
    return !!data.optionsJson; // uses optionsJson for fields/steps
  }
  return true;
}, {
  message: 'Missing required configuration for the selected question type',
});

// ==================== Test Schemas ====================
export const CreateTestSchema = z.object({
  templateId: z.string().uuid('Invalid template ID').optional(),
  studentId: z.string().uuid('Invalid student ID'),
  totalDuration: z.number().min(60, 'Test duration must be at least 60 seconds'),
  questionIds: z.array(z.string().uuid()).min(1, 'At least one question is required'),
});

export const SubmitTestResponseSchema = z.object({
  assessmentId: z.string().uuid('Invalid assessment ID'),
  studentId: z.string().optional(),
  submittedAt: z.string().datetime().optional(),
  status: z.enum(['submitted', 'auto_submitted']).optional(),
  violations: z.array(z.any()).optional(),
  responses: z.array(
    z.object({
      questionId: z.string().uuid('Invalid question ID'),
      section: z.string().optional(),
      questionType: z.string().optional(),
      answer: z.string().optional(),
    })
  ).default([]),
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
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
});

// Type exports
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type StudentProfileInput = z.infer<typeof StudentProfileSchema>;
export type AdminProfileInput = z.infer<typeof AdminProfileSchema>;
export type QuestionInput = z.infer<typeof QuestionSchema>;
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
  CreateTestSchema,
  SubmitTestResponseSchema,
  TestStatusUpdateSchema,
  ViolationSchema,
  FileUploadSchema,
  PaginationSchema,
  AnalyticsFilterSchema,
};
