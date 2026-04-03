import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormFieldErrorProps {
  error?: string;
  touched?: boolean;
  className?: string;
}

export function FormFieldError({
  error,
  touched,
  className,
}: FormFieldErrorProps) {
  if (!touched || !error) return null;

  return (
    <div className={cn("flex items-center gap-1.5 mt-1.5", className)}>
      <AlertCircle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
      <p className="text-xs text-destructive">{error}</p>
    </div>
  );
}

interface FormFieldSuccessProps {
  message?: string;
  show?: boolean;
  className?: string;
}

export function FormFieldSuccess({
  message,
  show,
  className,
}: FormFieldSuccessProps) {
  if (!show || !message) return null;

  return (
    <div className={cn("flex items-center gap-1.5 mt-1.5", className)}>
      <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
      <p className="text-xs text-green-600">{message}</p>
    </div>
  );
}

interface FormErrorSummaryProps {
  errors: Record<string, string>;
  className?: string;
}

export function FormErrorSummary({ errors, className }: FormErrorSummaryProps) {
  const errorList = Object.entries(errors);

  if (errorList.length === 0) return null;

  return (
    <div
      className={cn(
        "p-4 rounded-lg border border-destructive/50 bg-destructive/10 space-y-2",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-destructive" />
        <p className="font-semibold text-sm text-destructive">
          Please fix the following errors:
        </p>
      </div>
      <ul className="list-disc list-inside space-y-1 text-sm text-destructive ml-1">
        {errorList.map(([field, error]) => (
          <li key={field}>{error}</li>
        ))}
      </ul>
    </div>
  );
}

// Input wrapper with validation states
interface ValidatedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  touched?: boolean;
  success?: boolean;
  label?: string;
}

export function ValidatedInput({
  error,
  touched,
  success,
  label,
  className,
  ...props
}: ValidatedInputProps) {
  const hasError = touched && error;

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            hasError && "border-destructive focus-visible:ring-destructive",
            success &&
              !hasError &&
              "border-green-600 focus-visible:ring-green-600",
            className
          )}
          {...props}
        />
        {success && !hasError && (
          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-600" />
        )}
      </div>
      <FormFieldError error={error} touched={touched} />
    </div>
  );
}
