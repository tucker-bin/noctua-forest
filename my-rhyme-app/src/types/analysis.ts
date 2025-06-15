export interface SavedAnalysis {
  id: string;
  userId: string;
  title: string;
  description?: string;
  originalText: string;
  analysisData: any; // The full analysis result from Anthropic
  isPublic: boolean;
  isDraft: boolean;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  viewCount: number;
  likeCount: number;
  shareCount: number;
  thumbnail?: string; // Base64 or URL to generated thumbnail
}

export interface AnalysisPost extends SavedAnalysis {
  author: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  isLiked?: boolean;
  comments?: AnalysisComment[];
}

export interface AnalysisComment {
  id: string;
  postId: string;
  userId: string;
  author: {
    name: string;
    avatar?: string;
  };
  content: string;
  createdAt: Date;
}

export interface SaveAnalysisRequest {
  title: string;
  description?: string;
  originalText: string;
  analysisData: any;
  isPublic: boolean;
  isDraft: boolean;
  tags?: string[];
} 