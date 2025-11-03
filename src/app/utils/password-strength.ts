import { PasswordStrengthResult } from '../../types';

/**
 * PasswordStrengthAnalyzer
 *
 * Utility class for analyzing password strength based on multiple criteria.
 * Provides a score (0-4), strength level, and actionable feedback.
 *
 * Criteria analyzed:
 * - Minimum length (6+ characters)
 * - Uppercase letters presence
 * - Lowercase letters presence
 * - Numeric digits presence
 * - Special characters presence
 */
export class PasswordStrengthAnalyzer {
  /**
   * Analyzes password strength and returns detailed feedback
   * @param password - The password to analyze
   * @returns PasswordStrengthResult with score, level, criteria met, and feedback
   */
  static analyze(password: string): PasswordStrengthResult {
    const criteria = {
      hasMinLength: password.length >= 6,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumbers: /[0-9]/.test(password),
      hasSpecialChars: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };

    // Calculate score based on criteria met
    let score = 0;
    Object.values(criteria).forEach((met) => {
      if (met) score++;
    });

    const level = this.scoreToLevel(score);
    const feedback = this.generateFeedback(criteria);

    return { score, level, feedback, criteria };
  }

  /**
   * Converts score (0-4) to a human-readable strength level
   * @param score - Score from 0-4
   * @returns Strength level: 'weak', 'fair', 'good', or 'strong'
   */
  private static scoreToLevel(
    score: number
  ): 'weak' | 'fair' | 'good' | 'strong' {
    if (score <= 1) return 'weak';
    if (score <= 2) return 'fair';
    if (score <= 3) return 'good';
    return 'strong';
  }

  /**
   * Generates actionable feedback based on which criteria are not met
   * @param criteria - Object indicating which criteria are met
   * @returns Array of feedback strings for unmet criteria
   */
  private static generateFeedback(criteria: Record<string, boolean>): string[] {
    const feedback = [];
    if (!criteria['hasMinLength']) feedback.push('At least 6 characters');
    if (!criteria['hasUppercase']) feedback.push('Include uppercase letter');
    if (!criteria['hasLowercase']) feedback.push('Include lowercase letter');
    if (!criteria['hasNumbers']) feedback.push('Include a number');
    if (!criteria['hasSpecialChars']) feedback.push('Include special character');
    return feedback;
  }
}
