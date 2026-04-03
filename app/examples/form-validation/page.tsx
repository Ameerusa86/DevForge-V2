"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFormValidation } from "@/hooks/use-form-validation";
import {
  FormFieldError,
  FormErrorSummary,
} from "@/components/ui/form-field-error";
import { ErrorState } from "@/components/ui/error-state";
import {
  fetchWithErrorHandling,
  showErrorToast,
} from "@/lib/api-error-handler";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function FormValidationExamplePage() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    hasErrors,
  } = useFormValidation(
    {
      name: "",
      email: "",
      message: "",
      age: "",
    },
    {
      name: {
        required: true,
        minLength: 2,
        maxLength: 50,
      },
      email: {
        required: true,
        email: true,
      },
      message: {
        required: true,
        minLength: 10,
        maxLength: 500,
      },
      age: {
        number: true,
        min: 18,
        max: 120,
      },
    },
  );

  const onSubmit = async (formValues: typeof values) => {
    try {
      setSubmitError(null);

      // Simulate API call with error handling
      await fetchWithErrorHandling("/api/example", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formValues),
      });

      toast.success("Form submitted successfully!");
      setIsSuccess(true);
      reset();
    } catch (error) {
      console.error("Form submission error:", error);
      setSubmitError("Failed to submit form. Please try again.");
      showErrorToast(error);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">Success!</h2>
              <p className="text-muted-foreground mb-6">
                Your form has been submitted successfully.
              </p>
              <Button onClick={() => setIsSuccess(false)}>
                Submit Another
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Form Validation Example</CardTitle>
            <CardDescription>
              This form demonstrates validation, error handling, and network
              error states
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit(onSubmit);
              }}
              className="space-y-6"
            >
              {/* Error Summary */}
              {hasErrors && Object.keys(touched).length > 0 && (
                <FormErrorSummary errors={errors} />
              )}

              {/* Submit Error */}
              {submitError && (
                <ErrorState
                  type="generic"
                  title="Submission Failed"
                  message={submitError}
                  onRetry={() => handleSubmit(onSubmit)}
                  showRetry={true}
                />
              )}

              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={values.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  onBlur={() => handleBlur("name")}
                  placeholder="Enter your name"
                  className={
                    touched.name && errors.name
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }
                />
                <FormFieldError error={errors.name} touched={touched.name} />
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={values.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  onBlur={() => handleBlur("email")}
                  placeholder="you@example.com"
                  className={
                    touched.email && errors.email
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }
                />
                <FormFieldError error={errors.email} touched={touched.email} />
              </div>

              {/* Age Field (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="age">Age (Optional)</Label>
                <Input
                  id="age"
                  name="age"
                  type="number"
                  value={values.age}
                  onChange={(e) => handleChange("age", e.target.value)}
                  onBlur={() => handleBlur("age")}
                  placeholder="18"
                  className={
                    touched.age && errors.age
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }
                />
                <FormFieldError error={errors.age} touched={touched.age} />
              </div>

              {/* Message Field */}
              <div className="space-y-2">
                <Label htmlFor="message">
                  Message <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="message"
                  name="message"
                  value={values.message}
                  onChange={(e) => handleChange("message", e.target.value)}
                  onBlur={() => handleBlur("message")}
                  placeholder="Enter your message (minimum 10 characters)"
                  rows={4}
                  className={
                    touched.message && errors.message
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }
                />
                <FormFieldError
                  error={errors.message}
                  touched={touched.message}
                />
                <p className="text-xs text-muted-foreground">
                  {values.message.length}/500 characters
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4"
                        xmlns="http://www.w3.org/2400/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    "Submit Form"
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={reset}>
                  Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Documentation */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Validation Rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <ul className="list-disc list-inside space-y-1">
              <li>Name: Required, 2-50 characters</li>
              <li>Email: Required, valid email format</li>
              <li>Age: Optional, must be between 18-120</li>
              <li>Message: Required, 10-500 characters</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
