import * as React from 'react'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'live'
  shape?: 'default' | 'pill' | 'circle'
  size?: 'default' | 'sm' | 'xs'
}

export function Badge({
  variant = 'default',
  shape = 'default',
  size = 'default',
  className = '',
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`ui-badge ui-badge--${variant} ui-badge--shape-${shape} ui-badge--size-${size} ${className}`.trim()}
      {...props}
    >
      {children}
    </span>
  )
}
