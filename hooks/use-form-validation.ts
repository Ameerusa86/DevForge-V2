import { useState, useCallback } from "react";

export interface ValidationRule<T = unknown> {
  validate: (value: T) => boolean | Promise<boolean>;
  message: string;
}

export interface FieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: ValidationRule[];
  email?: boolean;
  url?: boolean;
  number?: boolean;
  min?: number;
  max?: number;
}

export interface FieldConfig {
  [key: string]: FieldValidation;
}

export interface FormErrors {
  [key: string]: string;
}

export interface TouchedFields {
  [key: string]: boolean;
}

export function useFormValidation<T extends Record<string, unknown>>(
  initialValues: T,
  validationConfig: FieldConfig
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = useCallback(
    (name: string, value: unknown): string | null => {
      const rules = validationConfig[name];
      if (!rules) return null;

      // Required validation
      if (rules.required && (!value || value.toString().trim() === "")) {
        return "This field is required";
      }

      // Skip other validations if empty and not required
      if (!value && !rules.required) return null;

      const stringValue = String(value);

      // Min length
      if (rules.minLength && stringValue.length < rules.minLength) {
        return `Minimum length is ${rules.minLength} characters`;
      }

      // Max length
      if (rules.maxLength && stringValue.length > rules.maxLength) {
        return `Maximum length is ${rules.maxLength} characters`;
      }

      // Email validation
      if (rules.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(stringValue)) {
        return "Please enter a valid email address";
      }

      // URL validation
      if (rules.url) {
        try {
          new URL(stringValue);
        } catch {
          return "Please enter a valid URL";
        }
      }

      // Number validation
      if (rules.number && isNaN(Number(value))) {
        return "Please enter a valid number";
      }

      // Min value
      if (rules.min !== undefined && Number(value) < rules.min) {
        return `Minimum value is ${rules.min}`;
      }

      // Max value
      if (rules.max !== undefined && Number(value) > rules.max) {
        return `Maximum value is ${rules.max}`;
      }

      // Pattern validation
      if (rules.pattern && !rules.pattern.test(stringValue)) {
        return "Please enter a valid format";
      }

      // Custom validations
      if (rules.custom) {
        for (const rule of rules.custom) {
          if (!rule.validate(value)) {
            return rule.message;
          }
        }
      }

      return null;
    },
    [validationConfig]
  );

  const handleChange = useCallback(
    (name: string, value: unknown) => {
      setValues((prev) => ({ ...prev, [name]: value }));

      // Validate on change if field has been touched
      if (touched[name]) {
        const error = validateField(name, value);
        setErrors((prev) => ({
          ...prev,
          [name]: error || "",
        }));
      }
    },
    [touched, validateField]
  );

  const handleBlur = useCallback(
    (name: string) => {
      setTouched((prev) => ({ ...prev, [name]: true }));

      const error = validateField(name, values[name]);
      setErrors((prev) => ({
        ...prev,
        [name]: error || "",
      }));
    },
    [values, validateField]
  );

  const validateAll = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    Object.keys(validationConfig).forEach((name) => {
      const error = validateField(name, values[name]);
      if (error) {
        newErrors[name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    setTouched(
      Object.keys(validationConfig).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {}
      )
    );

    return isValid;
  }, [values, validateField, validationConfig]);

  const handleSubmit = useCallback(
    async (onSubmit: (values: T) => Promise<void> | void) => {
      setIsSubmitting(true);

      try {
        const isValid = validateAll();
        if (!isValid) {
          setIsSubmitting(false);
          return;
        }

        await onSubmit(values);
      } catch (error) {
        console.error("Form submission error:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validateAll]
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  const setFieldValue = useCallback((name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const setFieldError = useCallback((name: string, error: string) => {
    setErrors((prev) => ({ ...prev, [name]: error }));
  }, []);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    validateAll,
    reset,
    setFieldValue,
    setFieldError,
    isValid: Object.values(errors).every((error) => !error),
    hasErrors: Object.values(errors).some((error) => error),
  };
}
