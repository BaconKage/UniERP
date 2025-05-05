export type UserRole = 'student' | 'teacher' | 'admin';

export interface User {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  approved: boolean;
  createdAt: Date;
}

export interface Attendance {
  id: string;
  studentId: string;
  date: Date;
  status: 'present' | 'absent' | 'late';
  markedBy: string;
  locked: boolean;
  createdAt: Date;
}

export interface Grade {
  id: string;
  studentId: string;
  studentName: string;
  subject: string;
  marks: number;
  comments: string;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  visibleTo: UserRole[];
  createdBy: string;
  createdByName: string;
  createdByRole: UserRole;
  createdAt: Date;
}

export interface Achievement {
  id: string;
  studentId: string;
  studentName: string;
  title: string;
  description: string;
  date: Date;
  certificateUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewerName?: string;
  reviewComments?: string;
  createdAt: Date;
}

export interface MedicalCertificate {
  id: string;
  studentId: string;
  studentName: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  certificateUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewerName?: string;
  reviewComments?: string;
  uploadedAt: Date;
  reviewedAt?: Date;
}