import type { SaveAnalysisRequest, AnalysisPost } from '../types/analysis';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export class AnalysisService {
  private static getHeaders() {
    return {
      'Content-Type': 'application/json',
      // TODO: Add authentication headers
      'user-id': 'mock-user-id' // Replace with actual user ID from auth context
    };
  }

  static async saveAnalysis(data: SaveAnalysisRequest): Promise<AnalysisPost> {
    const response = await fetch(`${API_BASE_URL}/api/analysis/save`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save analysis');
    }

    const result = await response.json();
    return result.analysis;
  }

  static async getUserAnalyses(userId: string, includePrivate = false): Promise<AnalysisPost[]> {
    const url = new URL(`${API_BASE_URL}/api/analysis/user/${userId}`);
    if (includePrivate) {
      url.searchParams.append('includePrivate', 'true');
    }

    const response = await fetch(url.toString(), {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch analyses');
    }

    const result = await response.json();
    return result.analyses;
  }

  static async getAnalysis(analysisId: string): Promise<AnalysisPost> {
    const response = await fetch(`${API_BASE_URL}/api/analysis/${analysisId}`, {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch analysis');
    }

    const result = await response.json();
    return result.analysis;
  }

  static async updateAnalysis(analysisId: string, data: Partial<SaveAnalysisRequest>): Promise<AnalysisPost> {
    const response = await fetch(`${API_BASE_URL}/api/analysis/${analysisId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update analysis');
    }

    const result = await response.json();
    return result.analysis;
  }

  static async deleteAnalysis(analysisId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/analysis/${analysisId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete analysis');
    }
  }

  static async toggleLike(analysisId: string, isLiked: boolean): Promise<{ likeCount: number; isLiked: boolean }> {
    const response = await fetch(`${API_BASE_URL}/api/analysis/${analysisId}/like`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ isLiked })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to toggle like');
    }

    const result = await response.json();
    return {
      likeCount: result.likeCount,
      isLiked: result.isLiked
    };
  }

  static async getPublicAnalyses(options: {
    page?: number;
    limit?: number;
    tags?: string[];
    search?: string;
  } = {}): Promise<{
    analyses: AnalysisPost[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const url = new URL(`${API_BASE_URL}/api/analysis/public/feed`);
    
    if (options.page) url.searchParams.append('page', options.page.toString());
    if (options.limit) url.searchParams.append('limit', options.limit.toString());
    if (options.search) url.searchParams.append('search', options.search);
    if (options.tags) {
      options.tags.forEach(tag => url.searchParams.append('tags', tag));
    }

    const response = await fetch(url.toString(), {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch public analyses');
    }

    const result = await response.json();
    return {
      analyses: result.analyses,
      pagination: result.pagination
    };
  }
} 