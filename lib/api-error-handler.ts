import { toast } from "sonner";

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

export class ValidationError extends Error {
  constructor(message: string, public errors?: Record<string, string>) {
    super(message);
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ServerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ServerError";
  }
}

/**
 * Parse API error response and throw appropriate error type
 */
export async function handleApiError(response: Response): Promise<never> {
  let errorData: unknown;

  try {
    errorData = await response.json();
  } catch {
    errorData = { message: response.statusText };
  }

  const errorObj = errorData as {
    message?: string;
    error?: string;
    errors?: Record<string, string>;
  };
  const message = errorObj.message || errorObj.error || "An error occurred";

  switch (response.status) {
    case 400:
      if (errorObj.errors) {
        throw new ValidationError(message, errorObj.errors);
      }
      throw new Error(message);

    case 401:
      throw new AuthenticationError(message);

    case 404:
      throw new NotFoundError(message);

    case 500:
    case 502:
    case 503:
      throw new ServerError(message);

    default:
      throw new Error(message);
  }
}

/**
 * Wrapper for fetch with error handling
 */
export async function fetchWithErrorHandling(
  url: string,
  options?: RequestInit
): Promise<Response> {
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      await handleApiError(response);
    }

    return response;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new NetworkError(
        "Network connection lost. Please check your internet connection."
      );
    }
    throw error;
  }
}

/**
 * Show appropriate toast message for different error types
 */
export function showErrorToast(error: unknown) {
  if (error instanceof NetworkError) {
    toast.error("Network Error", {
      description: error.message,
      action: {
        label: "Retry",
        onClick: () => window.location.reload(),
      },
    });
  } else if (error instanceof ValidationError) {
    toast.error("Validation Error", {
      description: error.message,
    });
  } else if (error instanceof AuthenticationError) {
    toast.error("Authentication Required", {
      description: "Please sign in to continue",
      action: {
        label: "Sign In",
        onClick: () => (window.location.href = "/login"),
      },
    });
  } else if (error instanceof NotFoundError) {
    toast.error("Not Found", {
      description: error.message,
    });
  } else if (error instanceof ServerError) {
    toast.error("Server Error", {
      description: "Something went wrong on our end. Please try again later.",
    });
  } else if (error instanceof Error) {
    toast.error("Error", {
      description: error.message,
    });
  } else {
    toast.error("Error", {
      description: "An unexpected error occurred",
    });
  }
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
