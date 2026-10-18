import React, { Component, ReactNode } from "react";
import type { CarouselErrorInfo } from "../model/types";
import { createError } from "../lib/utils/validators";

interface Props {
  children: ReactNode;
  fallback?: (error: CarouselErrorInfo, retry: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: CarouselErrorInfo | null;
}

/**
 * Error Boundary для карусели
 * Перехватывает ошибки и показывает fallback UI
 */
class CarouselErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error: createError(
        "NAVIGATION_ERROR",
        error.message || "Произошла ошибка при работе карусели",
        true,
      ),
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[CarouselErrorBoundary] Error caught:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Используем пользовательский fallback если предоставлен
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      // Дефолтный fallback UI
      return (
        <div className="w-full px-4 py-6 relative select-none bg-white mt-4 flex flex-col items-center justify-center min-h-[200px] rounded-lg border border-gray-200">
          {/* <div className="text-center max-w-md">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Ошибка загрузки карусели</h3>
            <p className="text-sm text-gray-600 mb-4">{this.state.error.message}</p>
            {this.state.error.recoverable && (
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
              >
                Попробовать снова
              </button>
            )}
          </div> */}
        </div>
      );
    }

    return this.props.children;
  }
}

export default CarouselErrorBoundary;
