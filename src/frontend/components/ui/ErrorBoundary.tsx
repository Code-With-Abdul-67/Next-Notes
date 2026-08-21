"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <AlertTriangle size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Something went wrong</h2>
            <p className="text-sm text-white/50 max-w-sm leading-relaxed">
              An unexpected error occurred. Your notes are safe — this is a display issue only.
            </p>
            {this.state.message && (
              <p className="text-xs text-white/25 font-mono mt-2 max-w-sm break-all">
                {this.state.message}
              </p>
            )}
          </div>
          <button
            onClick={() => {
              this.setState({ hasError: false, message: "" });
              window.location.reload();
            }}
            className="btn-primary flex items-center gap-2 px-5 h-10 rounded-xl text-sm"
          >
            <RefreshCw size={15} />
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
