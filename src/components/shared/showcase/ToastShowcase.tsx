import React from 'react';
import { Toast, ToastContainer, Button, Text } from '../index';
import { useToast } from '../../../lib/useToast';

const ToastShowcase: React.FC = () => {
  const [toasts, toastMethods] = useToast();

  const handleShowToast = (
    variant: 'default' | 'success' | 'error' | 'warning' | 'info',
    size: 'sm' | 'md' | 'lg' = 'md'
  ) => {
    const messages = {
      default: {
        title: 'Default Toast',
        message: 'This is a default toast message',
      },
      success: {
        title: 'Success!',
        message: 'Your action was completed successfully',
      },
      error: {
        title: 'Error Occurred',
        message: 'Something went wrong. Please try again.',
      },
      warning: {
        title: 'Warning',
        message: 'Please review your input before proceeding',
      },
      info: {
        title: 'Information',
        message: 'Here is some helpful information for you',
      },
    };

    const { title, message } = messages[variant];

    toastMethods.show({
      title,
      message,
      variant,
      size,
      duration: 5000,
    });
  };

  const handleShowToastWithAction = () => {
    toastMethods.show({
      title: 'Action Required',
      message: 'This toast has an action button you can click',
      variant: 'info',
      size: 'md',
      duration: 0, // No auto-dismiss
      action: {
        label: 'Take Action',
        onClick: () => {
          toastMethods.success(
            'Action Taken!',
            'You clicked the action button'
          );
        },
      },
    });
  };

  const handleShowPersistentToast = () => {
    toastMethods.show({
      title: 'Persistent Toast',
      message: 'This toast will not auto-dismiss. You must close it manually.',
      variant: 'warning',
      size: 'lg',
      duration: 0, // No auto-dismiss
    });
  };

  const handleShowCustomDuration = () => {
    toastMethods.show({
      title: 'Quick Toast',
      message: 'This toast will disappear in 2 seconds',
      variant: 'success',
      size: 'sm',
      duration: 2000,
    });
  };

  return (
    <section className="space-y-6">
      <Text variant="h2" size="2xl" weight="semibold">
        Toast Notifications
      </Text>

      <div className="space-y-4">
        <Text variant="h3" size="xl" weight="semibold">
          Toast Variants
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleShowToast('default')}
          >
            Default
          </Button>
          <Button
            variant="success"
            size="sm"
            onClick={() => handleShowToast('success')}
          >
            Success
          </Button>
          <Button
            variant="error"
            size="sm"
            onClick={() => handleShowToast('error')}
          >
            Error
          </Button>
          <Button
            variant="warning"
            size="sm"
            onClick={() => handleShowToast('warning')}
          >
            Warning
          </Button>
          <Button
            variant="info"
            size="sm"
            onClick={() => handleShowToast('info')}
          >
            Info
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <Text variant="h3" size="xl" weight="semibold">
          Toast Sizes
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleShowToast('info', 'sm')}
          >
            Small Toast
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleShowToast('info', 'md')}
          >
            Medium Toast
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleShowToast('info', 'lg')}
          >
            Large Toast
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <Text variant="h3" size="xl" weight="semibold">
          Special Features
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Button
            variant="accent"
            size="sm"
            onClick={handleShowToastWithAction}
          >
            With Action
          </Button>
          <Button
            variant="accent"
            size="sm"
            onClick={handleShowPersistentToast}
          >
            Persistent
          </Button>
          <Button variant="accent" size="sm" onClick={handleShowCustomDuration}>
            Custom Duration
          </Button>
          <Button variant="ghost" size="sm" onClick={toastMethods.clear}>
            Clear All
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <Text variant="h3" size="lg" weight="medium" color="muted">
          Usage Examples
        </Text>
        <div className="p-4 bg-neutral-50 rounded-lg space-y-3">
          <Text variant="p" size="sm" weight="medium" className="mb-3">
            Common Toast Patterns
          </Text>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="text-sm">
              <Text
                variant="p"
                size="xs"
                weight="semibold"
                className="text-blue-700 mb-1"
              >
                Success Feedback
              </Text>
              <Text variant="p" size="xs" color="muted">
                Use for completed actions, form submissions, etc.
              </Text>
            </div>
            <div className="text-sm">
              <Text
                variant="p"
                size="xs"
                weight="semibold"
                className="text-blue-700 mb-1"
              >
                Error Handling
              </Text>
              <Text variant="p" size="xs" color="muted">
                Use for validation errors, API failures, etc.
              </Text>
            </div>
            <div className="text-sm">
              <Text
                variant="p"
                size="xs"
                weight="semibold"
                className="text-blue-700 mb-1"
              >
                Information
              </Text>
              <Text variant="p" size="xs" color="muted">
                Use for helpful tips, status updates, etc.
              </Text>
            </div>
            <div className="text-sm">
              <Text
                variant="p"
                size="xs"
                weight="semibold"
                className="text-blue-700 mb-1"
              >
                Warnings
              </Text>
              <Text variant="p" size="xs" color="muted">
                Use for important notices, confirmations, etc.
              </Text>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Container - Positioned at top-right */}
      <ToastContainer
        toasts={toasts}
        onRemoveToast={toastMethods.remove}
        position="top-right"
      />
    </section>
  );
};

export default ToastShowcase;
