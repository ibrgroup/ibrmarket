import { VALIDATION } from "../config/constants";

// Типы для валидации
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ValidationRule<T = any> {
  validate: (value: T) => boolean;
  message: string;
}

// Валидация email
export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];

  if (!email) {
    errors.push("Email обязателен");
  } else if (!VALIDATION.EMAIL_REGEX.test(email)) {
    errors.push("Некорректный формат email");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Валидация пароля
export const validatePassword = (password: string): ValidationResult => {
  const errors: string[] = [];

  if (!password) {
    errors.push("Пароль обязателен");
  } else {
    if (password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
      errors.push(`Пароль должен содержать минимум ${VALIDATION.PASSWORD_MIN_LENGTH} символов`);
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push("Пароль должен содержать минимум одну строчную букву");
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push("Пароль должен содержать минимум одну заглавную букву");
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push("Пароль должен содержать минимум одну цифру");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Валидация телефона
export const validatePhone = (phone: string): ValidationResult => {
  const errors: string[] = [];

  if (!phone) {
    errors.push("Телефон обязателен");
  } else if (!VALIDATION.PHONE_REGEX.test(phone)) {
    errors.push("Некорректный формат телефона");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Валидация обязательного поля
export const validateRequired = (value: any, fieldName: string = "Поле"): ValidationResult => {
  const errors: string[] = [];

  if (!value || (typeof value === "string" && !value.trim())) {
    errors.push(`${fieldName} обязательно для заполнения`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Комбинированная валидация
export const validateField = (
  value: any,
  rules: ValidationRule[],
  _fieldName: string = "Поле",
): ValidationResult => {
  const errors: string[] = [];

  for (const rule of rules) {
    if (!rule.validate(value)) {
      errors.push(rule.message);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Валидация формы
export const validateForm = (
  data: Record<string, any>,
  schema: Record<string, ValidationRule[]>,
): {
  isValid: boolean;
  errors: Record<string, string[]>;
} => {
  const errors: Record<string, string[]> = {};
  let isValid = true;

  for (const [field, rules] of Object.entries(schema)) {
    const result = validateField(data[field], rules, field);
    if (!result.isValid) {
      errors[field] = result.errors;
      isValid = false;
    }
  }

  return { isValid, errors };
};
