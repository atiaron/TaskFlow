import React, { useCallback, useEffect, useRef, useState, forwardRef, useImperativeHandle, memo } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import '../ui/task-row-modern.css';

/**
 * TaskRowModern – מודל מודרני עם תמיכה ב:
 *  - Swipe (complete / star / delete) – RTL aware
 *  - Expandable meta (badges + description)
 *  - Priority indicator (p1/p2/p3)
 *  - A11y: role=listitem, כפתורי פעולה ממותגים
 * Props:
 *  task: { id, title, completed, starred, priority, meta?: string, badges?: Array<{id,label,kind?}> }
 *  onToggleComplete(id)
 *  onToggleStar(id)
 *  onDelete(id)
 *  onOpenDetails(task)
 *  onExpandChange(id, expanded)
 *  initialExpanded?
 *  swipe?: boolean
 *  disableAnimations?: boolean
 */
const SWIPE_THRESHOLD = 80; // px before action hint

function TaskRowModernBase(props, ref){
  const { task, onToggleComplete, onToggleStar, onDelete, onOpenDetails, onExpandChange, initialExpanded=false, swipe=true, disableAnimations=false } = props;
  const [expanded,setExpanded] = useState(initialExpanded);
  const x = useMotionValue(0);
  const dir = 'rtl'; // future: derive from document
  const containerRef = useRef(null);
  const isDragging = useRef(false);
  const actionRef = useRef(null);

  const showComplete = useTransform(x, latest => (dir==='rtl'? latest> SWIPE_THRESHOLD : latest < -SWIPE_THRESHOLD));
  const showStar     = useTransform(x, latest => (dir==='rtl'? latest< -SWIPE_THRESHOLD : latest > SWIPE_THRESHOLD));
  const showDelete   = useTransform(x, latest => Math.abs(latest) > SWIPE_THRESHOLD*1.6);

  useImperativeHandle(ref, ()=> ({ collapse: ()=> setExpanded(false), expand: ()=> setExpanded(true) }), []);

  useEffect(()=> { onExpandChange?.(task.id, expanded); }, [expanded, task.id, onExpandChange]);

  const handlePointerDown = (e)=> {
    if(!swipe) return;
    isDragging.current = true;
    x.stop();
    actionRef.current = { startX: e.clientX, start: x.get() };
  };
  const handlePointerMove = (e)=> {
    if(!isDragging.current) return;
    const dx = (e.clientX - actionRef.current.startX) * (dir==='rtl'? 1 : 1); // symmetrical here intentionally, adapt if needed
    x.set(actionRef.current.start + dx);
  };
  const handlePointerUp = ()=> {
    if(!isDragging.current) return;
    isDragging.current = false;
    const current = x.get();
    const rtl = dir==='rtl';
    if(Math.abs(current) > SWIPE_THRESHOLD*1.6 && onDelete){
      onDelete(task.id);
      return;
    }
    if(rtl && current > SWIPE_THRESHOLD && onToggleComplete){ onToggleComplete(task.id); animate(x,0); return; }
    if(rtl && current < -SWIPE_THRESHOLD && onToggleStar){ onToggleStar(task.id); animate(x,0); return; }
    if(!rtl && current < -SWIPE_THRESHOLD && onToggleComplete){ onToggleComplete(task.id); animate(x,0); return; }
    if(!rtl && current > SWIPE_THRESHOLD && onToggleStar){ onToggleStar(task.id); animate(x,0); return; }
    animate(x,0, { type:'spring', stiffness:300, damping:30 });
  };

  const toggleExpand = useCallback(()=> setExpanded(e=> !e), []);

  const badges = task.badges || [];
  const metaText = task.meta || '';
  const hasMeta = !!metaText || badges.length>0;

  return (
    <div className='gt-taskRow-wrap' dir={dir}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className='gt-taskRow-swipeBg' data-show='true' aria-hidden='true'>
        <div style={{opacity:0.85}}>{/* Left (visual end in RTL) */}⭐</div>
        <div style={{opacity:0.85}}>✓</div>
      </div>
      <motion.div
        ref={containerRef}
        className='gt-taskRow'
        role='listitem'
        aria-label={task.title}
        data-completed={task.completed || false}
        data-active={expanded || false}
        style={{ x }}
        transition={disableAnimations? {duration:0}: undefined}
        layout
        onDoubleClick={()=> onOpenDetails?.(task)}
      >
        <div className='gt-taskRow-leading'>
          <button aria-pressed={task.completed} onClick={()=> onToggleComplete?.(task.id)} title={task.completed? 'בטל השלמה':'סמן כהושלם'}>
            {task.completed? '✓':'○'}
          </button>
        </div>
        <div className='gt-taskRow-body'>
          <div className='gt-taskRow-title' data-priority={task.priority || 'p3'}>
            <button onClick={()=> onOpenDetails?.(task)} style={{all:'unset', cursor:'pointer'}}>{task.title || 'ללא כותרת'}</button>
            {task.starred && <span aria-label='מועדף' title='מועדף'>★</span>}
          </div>
          {hasMeta && (
            <>
              {metaText && <div className='gt-taskRow-metaClamp' data-expanded={expanded}>{metaText}</div>}
              {badges.length>0 && (
                <div className='gt-taskRow-badges'>
                  {badges.map(b => <span key={b.id} className='gt-taskRow-badge'>{b.label}</span>)}
                </div>
              )}
              <button className='gt-taskRow-expandBtn' onClick={toggleExpand} aria-expanded={expanded} aria-label={expanded? 'כווץ פרטים':'הרחב פרטים'}>
                {expanded? 'צמצום':'הרחבה'}
              </button>
            </>
          )}
        </div>
        <div className='gt-taskRow-trailing gt-taskRow-actions'>
          <button aria-pressed={task.starred} onClick={()=> onToggleStar?.(task.id)} title={task.starred? 'הסר ממועדפים':'סמן כמועדף'}>★</button>
          <button onClick={()=> onDelete?.(task.id)} title='מחק'>🗑</button>
        </div>
      </motion.div>
    </div>
  );
}

const TaskRowModern = memo(forwardRef(TaskRowModernBase));
export default TaskRowModern;
