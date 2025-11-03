import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { PasswordStrengthAnalyzer } from '../../../../utils/password-strength';
import { PasswordStrengthResult } from '../../../../../types';

/**
 * PasswordStrengthIndicatorComponent
 *
 * Displays visual feedback about password strength including:
 * - Color-coded strength bar (weak/fair/good/strong)
 * - Strength level text
 * - Criteria checklist with visual indicators
 * - Actionable feedback for unmet criteria
 *
 * This is a purely presentational component with no outputs.
 */
@Component({
  selector: 'app-password-strength-indicator',
  standalone: true,
  imports: [CommonModule, NzIconModule],
  templateUrl: './password-strength-indicator.component.html',
  styleUrl: './password-strength-indicator.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordStrengthIndicatorComponent {
  // Inputs using modern Angular 19 input() function
  password = input('');
  showDetails = input(true);
  minLength = input(8);

  /**
   * Analyzes password and returns strength result
   * Memoized to avoid recomputation on every render
   */
  get strengthResult(): PasswordStrengthResult | null {
    const pwd = this.password();
    return pwd ? PasswordStrengthAnalyzer.analyze(pwd) : null;
  }

  /**
   * Maps strength level to CSS class for color coding
   * @param level - Strength level (weak, fair, good, strong)
   * @returns CSS class name for styling
   */
  getStrengthTextClass(level: string): string {
    const classMap: Record<string, string> = {
      weak: 'text-red-600',
      fair: 'text-yellow-600',
      good: 'text-blue-600',
      strong: 'text-green-600',
    };
    return classMap[level] || 'text-gray-600';
  }

  /**
   * Maps strength level to progress bar color
   * @param level - Strength level
   * @returns CSS class for progress bar
   */
  getProgressBarClass(level: string): string {
    const classMap: Record<string, string> = {
      weak: 'bg-red-500',
      fair: 'bg-yellow-500',
      good: 'bg-blue-500',
      strong: 'bg-green-500',
    };
    return classMap[level] || 'bg-gray-400';
  }

  /**
   * Builds array of criteria items for display
   * @returns Array of criterion objects with met status and label
   */
  getCriteria(): Array<{ met: boolean; label: string }> {
    const result = this.strengthResult;
    if (!result) return [];

    return [
      { met: result.criteria.hasMinLength, label: 'At least 6 characters' },
      { met: result.criteria.hasUppercase, label: 'Uppercase letter' },
      { met: result.criteria.hasLowercase, label: 'Lowercase letter' },
      { met: result.criteria.hasNumbers, label: 'Number' },
      { met: result.criteria.hasSpecialChars, label: 'Special character' },
    ];
  }
}
