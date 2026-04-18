import React from "react";
import ErrorState from "./ErrorState";

/**
 * React Error Boundary to catch crashes in sub-sections of the UI
 * without crashing the entire page.
 */
class QueryBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("QueryBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      
      return (
        <ErrorState 
          variant="backend" 
          compact={this.props.compact} 
          message={this.state.error?.message} 
          onRetry={() => {
            this.setState({ hasError: false, error: null });
            if (this.props.onRetry) this.props.onRetry();
          }}
        />
      );
    }

    return this.props.children;
  }
}

export default QueryBoundary;
