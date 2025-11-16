// components/ErrorBoundary.tsx
import React, { ErrorInfo, ReactNode } from 'react';
import Button from './ui/Button';
import { APP_VERSION } from '../constants'; // Import app version

// Placeholder for a real error tracking service
const logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // In a real application, this would send the error to a service like Sentry,
    // LogRocket, or another monitoring tool.
    // Example: Sentry.captureException(error, { extra: errorInfo });
    console.log("--- Error Report Sent to Service (Simulation) ---");
    console.log("Version:", APP_VERSION);
    console.log("Error:", error);
    console.log("ErrorInfo:", errorInfo);
    console.log("-------------------------------------------------");
};


interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

// Fix: The previous attempt to extend a named import `Component` did not resolve the type inference issue.
// Extending `React.Component` directly is a more robust way to ensure the class correctly
// inherits properties like `props` and `state`, resolving the TypeScript errors.
class ErrorBoundary extends React.Component<Props, State> {
  // FIX: Switched from class property state initialization to a constructor.
  // The class property syntax, while modern, can sometimes cause issues with
  // type inference for inherited properties like `props` in certain TypeScript
  // configurations. Using a constructor is a more robust way to initialize state.
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to the console
    console.error("Uncaught error:", error, errorInfo);
    
    // Send the error to a monitoring service
    logErrorToService(error, errorInfo);
  }
  
  handleReset = () => {
      window.location.reload();
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="flex flex-col items-center justify-center h-screen p-8 text-center bg-gray-50 dark:bg-gray-900">
            <h1 className="text-xl font-semibold text-red-600 dark:text-red-400">Quelque chose s'est mal passé.</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
                Une erreur inattendue est survenue. Notre équipe a été notifiée.
                Veuillez essayer de recharger la page.
            </p>
            <Button onClick={this.handleReset} variant="danger" className="mt-6">
                Recharger l'application
            </Button>
            <p className="mt-8 text-xs text-gray-400 dark:text-gray-500">
                Version de l'application: {APP_VERSION}
            </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;