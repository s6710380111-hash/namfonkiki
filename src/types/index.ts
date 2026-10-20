export type UserRole = 'admin' | 'moderator' | 'member';
export type UserStatus = 'active' | 'suspended';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  status: UserStatus;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export type MediaType = 'pdf' | 'video' | 'website' | 'document' | 'image';
export type ResourceStatus = 'published' | 'hidden' | 'deleted';

export type GradeLevel = 
  | 'ทุกระดับชั้น'
  | 'ประถมศึกษา'
  | 'มัธยมศึกษาตอนต้น'
  | 'มัธยมศึกษาตอนปลาย'
  | 'อุดมศึกษา/มหาวิทยาลัย'
  | 'ครูและอาจารย์'
  | 'บุคคลทั่วไป';

export interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  gradeLevel: GradeLevel;
  mediaType: MediaType;
  fileUrl: string;
  fileName?: string;
  fileSize?: number;
  thumbnailUrl?: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  viewCount: number;
  favoriteCount: number;
  status: ResourceStatus;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FavoriteItem {
  id: string; // Composite: `${userId}_${resourceId}`
  userId: string;
  resourceId: string;
  resourceTitle: string;
  resourceCategory: string;
  resourceMediaType: MediaType;
  createdAt: string;
}

export type ReportReason = 
  | 'broken_link' 
  | 'copyright' 
  | 'inappropriate' 
  | 'inaccurate' 
  | 'spam' 
  | 'other';

export type ReportStatus = 'pending' | 'resolved' | 'dismissed';

export interface ContentReport {
  id: string;
  resourceId: string;
  resourceTitle: string;
  reporterId: string;
  reporterEmail: string;
  reporterName?: string;
  reason: ReportReason;
  details: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
  resolvedBy?: string;
  resolutionNote?: string;
}

export interface ModerationLog {
  id: string;
  action: 'hide_resource' | 'unhide_resource' | 'delete_resource' | 'suspend_user' | 'activate_user' | 'change_role' | 'resolve_report' | 'update_settings';
  targetId: string;
  targetType: 'resource' | 'user' | 'report' | 'setting';
  moderatorId: string;
  moderatorEmail: string;
  reason: string;
  createdAt: string;
}

export interface SiteSettings {
  id?: string;
  siteName: string;
  siteDescription: string;
  announcement: string;
  announcementActive: boolean;
  categories: string[];
  allowRegistration: boolean;
  contactEmail?: string;
  updatedBy: string;
  updatedAt: string;
}

export interface FilterState {
  searchQuery: string;
  category: string;
  gradeLevel: string;
  mediaType: string;
  sortBy: 'newest' | 'popular' | 'views';
}
