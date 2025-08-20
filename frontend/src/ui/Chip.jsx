import React from 'react';
import clsx from 'clsx';

export function Chip({ children, interactive=false, variant, onClick, className='', ...rest }){
  return (
    <span className={clsx('gt-chip', className)} data-interactive={interactive || undefined} data-variant={variant} onClick={interactive? onClick: undefined} {...rest}>{children}</span>
  );
}

export default Chip;
