import { db } from '../config/firebase';
import { observationService } from './observationService';
import { logger } from '../utils/logger';
import { Timestamp } from 'firebase-admin/firestore';

interface CommunitySubmission {
  id: string;
  userId: string;
  text: string;
  observationId: string; // Link to Observatory analysis
  qualityScore: number;
  patternCount: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  votes: { up: number; down: number };
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  approvedAt?: Date;
}

interface CommunityVote {
  userId: string;
  submissionId: string;
  voteType: 'up' | 'down';
  timestamp: Date;
}

export class CommunityCorpusService {
  private submissionsRef = db.collection('community_submissions');
  private votesRef = db.collection('community_votes');
  private approvedCorpusRef = db.collection('approved_corpus');

  /**
   * Submit content to community corpus
   */
  async submitContent(userId: string, text: string): Promise<{
    submissionId: string;
    qualityScore: number;
    patternCount: number;
  }> {
    try {
      // Run Observatory analysis
      const observation = await observationService.observeText(text, userId, 'en');
      
      // Calculate quality metrics
      const qualityScore = this.calculateQualityScore(observation);
      const difficulty = this.calculateDifficulty(observation);
      
      if (qualityScore < 0.3) {
        throw new Error('Content quality too low for submission');
      }

      // Create submission
      const submission: Omit<CommunitySubmission, 'id'> = {
        userId,
        text,
        observationId: observation.id,
        qualityScore,
        patternCount: observation.patterns.length,
        difficulty,
        votes: { up: 0, down: 0 },
        status: 'pending',
        submittedAt: new Date()
      };

      const docRef = await this.submissionsRef.add(submission);
      
      logger.info('Community content submitted', {
        submissionId: docRef.id,
        userId: userId.substring(0, 8) + '...',
        qualityScore,
        patternCount: observation.patterns.length
      });

      return {
        submissionId: docRef.id,
        qualityScore,
        patternCount: observation.patterns.length
      };

    } catch (error) {
      logger.error('Error submitting community content', { error, userId });
      throw error;
    }
  }

  /**
   * Vote on community submission
   */
  async voteOnSubmission(userId: string, submissionId: string, voteType: 'up' | 'down'): Promise<void> {
    try {
      // Check if user already voted
      const existingVote = await this.votesRef
        .where('userId', '==', userId)
        .where('submissionId', '==', submissionId)
        .limit(1)
        .get();

      const batch = db.batch();

      if (!existingVote.empty) {
        // Update existing vote
        const voteDoc = existingVote.docs[0];
        const oldVote = voteDoc.data() as CommunityVote;
        
        if (oldVote.voteType !== voteType) {
          // Change vote
          batch.update(voteDoc.ref, { voteType, timestamp: new Date() });
          
          // Update submission vote counts
          const submissionRef = this.submissionsRef.doc(submissionId);
          const submissionDoc = await submissionRef.get();
          const submission = submissionDoc.data() as CommunitySubmission;
          
          const newVotes = { ...submission.votes };
          if (oldVote.voteType === 'up') newVotes.up--;
          else newVotes.down--;
          
          if (voteType === 'up') newVotes.up++;
          else newVotes.down++;
          
          batch.update(submissionRef, { votes: newVotes });
        }
      } else {
        // New vote
        const vote: CommunityVote = {
          userId,
          submissionId,
          voteType,
          timestamp: new Date()
        };
        
        const voteRef = this.votesRef.doc();
        batch.set(voteRef, vote);
        
        // Update submission vote count
        const submissionRef = this.submissionsRef.doc(submissionId);
        const submissionDoc = await submissionRef.get();
        const submission = submissionDoc.data() as CommunitySubmission;
        
        const newVotes = { ...submission.votes };
        if (voteType === 'up') newVotes.up++;
        else newVotes.down++;
        
        batch.update(submissionRef, { votes: newVotes });
      }

      await batch.commit();

      // Check if submission should be auto-approved
      await this.checkAutoApproval(submissionId);

    } catch (error) {
      logger.error('Error voting on submission', { error, userId, submissionId });
      throw error;
    }
  }

  /**
   * Get random puzzle content from approved corpus
   */
  async getRandomPuzzleContent(difficulty?: string, count: number = 1): Promise<CommunitySubmission[]> {
    try {
      let query = this.approvedCorpusRef.where('status', '==', 'approved');
      
      if (difficulty) {
        query = query.where('difficulty', '==', difficulty);
      }
      
      const snapshot = await query.limit(count * 3).get(); // Get more than needed for randomization
      const submissions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CommunitySubmission[];
      
      // Randomly select from results
      const selected = submissions.sort(() => Math.random() - 0.5).slice(0, count);
      
      logger.info('Retrieved random puzzle content', { 
        requested: count, 
        available: submissions.length, 
        selected: selected.length 
      });
      
      return selected;

    } catch (error) {
      logger.error('Error getting random puzzle content', { error });
      throw error;
    }
  }

  /**
   * Calculate quality score based on Observatory analysis
   */
  private calculateQualityScore(observation: any): number {
    const patterns = observation.patterns || [];
    const segments = observation.segments || [];
    
    // Base score from pattern diversity and significance
    const patternScore = Math.min(1.0, patterns.length * 0.1);
    const significanceScore = patterns.reduce((sum: number, p: any) => sum + (p.significance || 0), 0) / patterns.length || 0;
    const lengthScore = Math.min(1.0, segments.length * 0.02); // Prefer longer texts
    
    return (patternScore * 0.4 + significanceScore * 0.4 + lengthScore * 0.2);
  }

  /**
   * Determine difficulty based on pattern complexity
   */
  private calculateDifficulty(observation: any): 'easy' | 'medium' | 'hard' | 'expert' {
    const patterns = observation.patterns || [];
    const avgSignificance = patterns.reduce((sum: number, p: any) => sum + (p.significance || 0), 0) / patterns.length || 0;
    
    if (avgSignificance > 0.8) return 'expert';
    if (avgSignificance > 0.6) return 'hard';
    if (avgSignificance > 0.4) return 'medium';
    return 'easy';
  }

  /**
   * Auto-approve submissions with high community vote score
   */
  private async checkAutoApproval(submissionId: string): Promise<void> {
    try {
      const submissionDoc = await this.submissionsRef.doc(submissionId).get();
      const submission = submissionDoc.data() as CommunitySubmission;
      
      if (submission.status !== 'pending') return;
      
      const totalVotes = submission.votes.up + submission.votes.down;
      const approvalRatio = submission.votes.up / totalVotes;
      
      // Auto-approve if: 10+ votes and 75%+ approval
      if (totalVotes >= 10 && approvalRatio >= 0.75) {
        await this.approveSubmission(submissionId);
      }
      // Auto-reject if: 5+ votes and <25% approval
      else if (totalVotes >= 5 && approvalRatio < 0.25) {
        await this.rejectSubmission(submissionId);
      }
      
    } catch (error) {
      logger.error('Error checking auto-approval', { error, submissionId });
    }
  }

  /**
   * Approve submission for game corpus
   */
  private async approveSubmission(submissionId: string): Promise<void> {
    const submissionDoc = await this.submissionsRef.doc(submissionId).get();
    const submission = submissionDoc.data() as CommunitySubmission;
    
    // Update status
    await this.submissionsRef.doc(submissionId).update({
      status: 'approved',
      approvedAt: new Date()
    });
    
    // Add to approved corpus
    await this.approvedCorpusRef.doc(submissionId).set(submission);
    
    logger.info('Submission approved for corpus', { submissionId });
  }

  /**
   * Reject submission
   */
  private async rejectSubmission(submissionId: string): Promise<void> {
    await this.submissionsRef.doc(submissionId).update({
      status: 'rejected'
    });
    
    logger.info('Submission rejected', { submissionId });
  }
}

export const communityCorpusService = new CommunityCorpusService(); 