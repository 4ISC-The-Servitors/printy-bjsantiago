import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  hoverable?: boolean;
  onClick?: () => void;
}

interface CardComponent
  extends React.ForwardRefExoticComponent<
    CardProps & React.RefAttributes<HTMLDivElement>
  > {
  Header: React.FC<{ title?: string; subtitle?: string }>;
  Title: React.FC<{ children: React.ReactNode }>;
  Subtitle: React.FC<{ children: React.ReactNode }>;
  Content: React.FC<{ children: React.ReactNode }>;
  Footer: React.FC<{ children: React.ReactNode }>;
  Actions: React.FC<{ children: React.ReactNode }>;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      title,
      subtitle,
      children,
      hoverable = false,
      onClick,
      className,
      ...props
    },
    ref
  ) => {
    const isClickable = !!onClick;

    return (
      <div
        ref={ref}
        className={cn(
          'card',
          hoverable && 'hover:shadow-medium hover:-translate-y-1',
          isClickable && 'cursor-pointer',
          className
        )}
        onClick={onClick}
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onKeyDown={
          isClickable
            ? e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClick?.();
                }
              }
            : undefined
        }
        {...props}
      >
        {(title || subtitle) && (
          <CardHeader title={title} subtitle={subtitle} />
        )}
        <CardContent>{children}</CardContent>
      </div>
    );
  }
) as CardComponent;

Card.displayName = 'Card';

const CardHeader: React.FC<{ title?: string; subtitle?: string }> = ({
  title,
  subtitle,
}) => (
  <div className="p-6 pb-4">
    {title && <CardTitle>{title}</CardTitle>}
    {subtitle && <CardSubtitle>{subtitle}</CardSubtitle>}
  </div>
);

const CardTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="text-lg font-semibold text-neutral-900">{children}</h3>
);

const CardSubtitle: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <p className="mt-1 text-sm text-neutral-600">{children}</p>;

const CardContent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="p-6">{children}</div>
);

const CardFooter: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="p-6 pt-4">{children}</div>
);

const CardActions: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center gap-2">{children}</div>
);

// Attach compound components to Card
Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Subtitle = CardSubtitle;
Card.Content = CardContent;
Card.Footer = CardFooter;
Card.Actions = CardActions;

export default Card;
