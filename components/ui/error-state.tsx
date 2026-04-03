import { AlertCircle, WifiOff, ServerCrash, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type ErrorType = "network" | "server" | "notFound" | "generic";

interface ErrorStateProps {
  type?: ErrorType;
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
  showRetry?: boolean;
}

const errorConfig = {
  network: {
    icon: WifiOff,
    defaultTitle: "Network Connection Lost",
    defaultMessage:
      "Unable to connect to the server. Please check your internet connection and try again.",
    color: "text-orange-500",
  },
  server: {
    icon: ServerCrash,
    defaultTitle: "Server Error",
    defaultMessage:
      "Something went wrong on our end. Our team has been notified and is working on it.",
    color: "text-red-500",
  },
  notFound: {
    icon: AlertCircle,
    defaultTitle: "Content Not Found",
    defaultMessage:
      "The content you're looking for doesn't exist or has been removed.",
    color: "text-yellow-500",
  },
  generic: {
    icon: AlertCircle,
    defaultTitle: "Something Went Wrong",
    defaultMessage:
      "An unexpected error occurred. Please try again or contact support if the problem persists.",
    color: "text-destructive",
  },
};

export function ErrorState({
  type = "generic",
  title,
  message,
  onRetry,
  className,
  showRetry = true,
}: ErrorStateProps) {
  const config = errorConfig[type];
  const Icon = config.icon;

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="pt-12 pb-12">
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Icon */}
          <div className={cn("p-4 rounded-full bg-muted", config.color)}>
            <Icon className="h-12 w-12" />
          </div>

          {/* Title and Message */}
          <div className="space-y-2 max-w-md">
            <h3 className="text-xl font-semibold">
              {title || config.defaultTitle}
            </h3>
            <p className="text-muted-foreground">
              {message || config.defaultMessage}
            </p>
          </div>

          {/* Retry Button */}
          {showRetry && onRetry && (
            <Button onClick={onRetry} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Inline Error State (smaller, for inline use)
interface InlineErrorProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function InlineError({ message, onRetry, className }: InlineErrorProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4 rounded-lg border border-destructive/50 bg-destructive/10",
        className,
      )}
    >
      <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
      <p className="text-sm text-destructive flex-1">{message}</p>
      {onRetry && (
        <Button
          onClick={onRetry}
          size="sm"
          variant="outline"
          className="flex-shrink-0"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Retry
        </Button>
      )}
    </div>
  );
}

// Network Error Boundary Component
interface NetworkErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onRetry?: () => void;
}

export function NetworkErrorBoundary({
  children,
  fallback,
  onRetry,
}: NetworkErrorBoundaryProps) {
  if (fallback) {
    return <>{fallback}</>;
  }

  return <ErrorState type="network" onRetry={onRetry} />;
}
