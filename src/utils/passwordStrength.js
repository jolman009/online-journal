/**
 * Password strength validation for master password
 *
 * Requirements:
 * - Minimum 12 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * - No common patterns (e.g., "password", "123456")
 */

const COMMON_PASSWORDS = [
  'password', 'password1', 'password123', '123456', '12345678', '123456789',
  'qwerty', 'abc123', 'letmein', 'welcome', 'monkey', 'dragon', 'master',
  'login', 'admin', 'passw0rd', 'iloveyou', 'sunshine', 'princess', 'football',
  'shadow', 'superman', 'michael', 'jennifer', 'hunter', 'trustno1', 'ranger',
  'buster', 'thomas', 'robert', 'hockey', 'batman', 'test', 'pass', 'killer',
  'george', 'charlie', 'andrew', 'michelle', 'love', 'secret', 'angel'
];

const SEQUENTIAL_PATTERNS = [
  '123', '234', '345', '456', '567', '678', '789', '890',
  'abc', 'bcd', 'cde', 'def', 'efg', 'fgh', 'ghi', 'hij',
  'qwe', 'wer', 'ert', 'rty', 'tyu', 'yui', 'uio', 'iop',
  'asd', 'sdf', 'dfg', 'fgh', 'ghj', 'hjk', 'jkl',
  'zxc', 'xcv', 'cvb', 'vbn', 'bnm'
];

export const PASSWORD_RULES = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
  forbidCommon: true,
  forbidSequential: true,
};

/**
 * Check individual password requirements
 * @param {string} password
 * @returns {object} Object with individual rule results
 */
export function checkPasswordRules(password) {
  const lower = password.toLowerCase();

  return {
    minLength: password.length >= PASSWORD_RULES.minLength,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password),
    notCommon: !COMMON_PASSWORDS.some(common => lower.includes(common)),
    notSequential: !SEQUENTIAL_PATTERNS.some(seq => lower.includes(seq)),
  };
}

/**
 * Calculate password strength score (0-100)
 * @param {string} password
 * @returns {number} Score from 0 to 100
 */
export function calculateStrengthScore(password) {
  if (!password) return 0;

  let score = 0;
  const rules = checkPasswordRules(password);

  // Base score from length (up to 30 points)
  score += Math.min(30, password.length * 2);

  // Character variety (up to 40 points)
  if (rules.hasUppercase) score += 10;
  if (rules.hasLowercase) score += 10;
  if (rules.hasNumber) score += 10;
  if (rules.hasSpecial) score += 10;

  // Bonus for length beyond minimum (up to 20 points)
  if (password.length > PASSWORD_RULES.minLength) {
    score += Math.min(20, (password.length - PASSWORD_RULES.minLength) * 2);
  }

  // Penalties
  if (!rules.notCommon) score -= 30;
  if (!rules.notSequential) score -= 15;

  // Penalty for repeated characters
  const repeatedChars = password.match(/(.)\1{2,}/g);
  if (repeatedChars) {
    score -= repeatedChars.length * 5;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Get strength label and color based on score
 * @param {number} score
 * @returns {object} { label, color, level }
 */
export function getStrengthInfo(score) {
  if (score < 30) {
    return { label: 'Very Weak', color: '#ef4444', level: 0 };
  } else if (score < 50) {
    return { label: 'Weak', color: '#f97316', level: 1 };
  } else if (score < 70) {
    return { label: 'Fair', color: '#eab308', level: 2 };
  } else if (score < 90) {
    return { label: 'Strong', color: '#22c55e', level: 3 };
  } else {
    return { label: 'Very Strong', color: '#10b981', level: 4 };
  }
}

/**
 * Validate password meets all requirements
 * @param {string} password
 * @returns {object} { isValid, errors }
 */
export function validatePassword(password) {
  const rules = checkPasswordRules(password);
  const errors = [];

  if (!rules.minLength) {
    errors.push(`At least ${PASSWORD_RULES.minLength} characters required`);
  }
  if (!rules.hasUppercase) {
    errors.push('At least one uppercase letter required');
  }
  if (!rules.hasLowercase) {
    errors.push('At least one lowercase letter required');
  }
  if (!rules.hasNumber) {
    errors.push('At least one number required');
  }
  if (!rules.hasSpecial) {
    errors.push('At least one special character required (!@#$%^&*...)');
  }
  if (!rules.notCommon) {
    errors.push('Password contains a common word or pattern');
  }
  if (!rules.notSequential) {
    errors.push('Password contains sequential characters (abc, 123, qwerty...)');
  }

  return {
    isValid: errors.length === 0,
    errors,
    rules,
  };
}
