import React from 'react';
import clsx from 'clsx';

/** Button primitive – variants: primary (default), secondary, ghost, text, danger, icon */
export const Button = React.forwardRef(function Button({ as:Comp='button', variant='primary', icon, children, className='', disabled, ...rest }, ref){
  return (
    <Comp ref={ref} className={clsx('gt-btn', className)} data-variant={variant} aria-disabled={disabled || undefined} disabled={disabled} {...rest}>
      {icon}
      {children && <span className="gt-btn__label">{children}</span>}
    </Comp>
  );
});

export const IconButton = React.forwardRef(function IconButton({ as:Comp='button', pressed, label, children, className='', ...rest }, ref){
  return (
    <Comp ref={ref} className={clsx('gt-iconBtn', className)} aria-pressed={pressed} aria-label={label} {...rest}>{children}</Comp>
  );
});
