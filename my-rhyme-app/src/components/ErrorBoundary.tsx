import React from 'react';
import { Alert, Button } from '@mui/material';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch() {
    // You can log the error to an error reporting service
    // console.error("Uncaught error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Alert severity="error" sx={{ m: 4 }}>
          <div>Something went wrong. Please try refreshing the page.</div>
          <Button onClick={this.handleReload} sx={{ mt: 2 }} variant="contained">Reload</Button>
        </Alert>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary; 