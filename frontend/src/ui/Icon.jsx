import React from 'react';

/** Icon primitive – wraps an SVG or glyph. Usage:
 * <Icon name="star" /> or pass children.
 */
export function Icon({ name, size=20, label, className='', children, ...rest }) {
  const ariaProps = label ? { role:'img', 'aria-label': label } : { 'aria-hidden':'true' };
  if(children) {
    return <span className={"gt-icon "+className} style={{display:'inline-flex', width:size, height:size}} {...ariaProps} {...rest}>{children}</span>;
  }
  // Simple built-in glyph map (can be replaced with a sprite system)
  const paths = {
    star: 'M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z',
    check: 'M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z',
    delete: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12ZM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4Z',
    more: 'M12 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm0 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z',
    starFill: 'M12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2Z'
  };
  const d = paths[name];
  return (
    <span className={"gt-icon "+className} style={{display:'inline-flex', width:size, height:size}} {...ariaProps} {...rest}>
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false"><path d={d} /></svg>
    </span>
  );
}

export default Icon;
