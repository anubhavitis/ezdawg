"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "./button";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

function DefaultFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-destructive bg-destructive/10 p-6">
      <div className="flex items-center gap-2 text-destructive mb-2">
        <AlertCircle className="w-5 h-5" />
        <h3 className="font-semibold">Something went wrong</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        This section encountered an error. Try refreshing.
      </p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || <DefaultFallback onRetry={this.resetError} />
      );
    }

    return this.props.children;
  }
}
