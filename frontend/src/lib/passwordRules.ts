export const PASSWORD_RULES = [
  { id: "length", label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { id: "lower", label: "One lowercase letter (a-z)", test: (p: string) => /[a-z]/.test(p) },
  { id: "upper", label: "One uppercase letter (A-Z)", test: (p: string) => /[A-Z]/.test(p) },
  { id: "digit", label: "One number (0-9)", test: (p: string) => /\d/.test(p) },
] as const;

export const isPasswordValid = (p: string) => PASSWORD_RULES.every((r) => r.test(p));