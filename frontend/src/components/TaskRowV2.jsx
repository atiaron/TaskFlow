import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import '../ui/tokens-unified.css';
import '../ui/task-row-modern.css';
import { Icon } from '../ui/Icon';
import { IconButton } from '../ui/Button';
import Chip from '../ui/Chip';

/** TaskRowV2 – Unified modern Task Row (swipe + expand + a11y)
 * Props:
 *  task: { id, title, completed, starred, priority, meta?, badges?:Array<{id,label,variant?}> }
 *  onToggleComplete(id)
 *  onToggleStar(id)
 *  onDelete(id)
 *  onOpenDetails(task)
 *  onExpandChange(id, expanded)
 *  initialExpanded?
 *  swipe? (default true)
 *  disableAnimations?
 */
const SWIPE = 90;

function TaskRowImpl({ task, onToggleComplete, onToggleStar, onDelete, onOpenDetails, onExpandChange, initialExpanded=false, swipe=true, disableAnimations=false }, ref){
  const [expanded, setExpanded] = useState(initialExpanded);
  useEffect(()=> { onExpandChange?.(task.id, expanded); }, [expanded, task.id, onExpandChange]);
  const dir = 'rtl'; // TODO: derive globally
  const x = useMotionValue(0);
  const dragCtx = useRef(null);

  useImperativeHandle(ref, ()=> ({ expand: ()=> setExpanded(true), collapse: ()=> setExpanded(false) }), []);

  const pointerDown = (e)=> { if(!swipe) return; dragCtx.current = { startX: e.clientX, start: x.get() }; };
  const pointerMove = (e)=> { if(!dragCtx.current) return; const dx = e.clientX - dragCtx.current.startX; x.set(dragCtx.current.start + dx); };
  const reset = ()=> { animate(x, 0, { type:'spring', stiffness:300, damping:30 }); };
  const pointerUp = ()=> {
    if(!dragCtx.current) return; const current = x.get(); const rtl = dir==='rtl';
    if(Math.abs(current) > SWIPE*1.6 && onDelete){ onDelete(task.id); dragCtx.current=null; return; }
    if(rtl && current > SWIPE && onToggleComplete){ onToggleComplete(task.id); reset(); dragCtx.current=null; return; }
    if(rtl && current < -SWIPE && onToggleStar){ onToggleStar(task.id); reset(); dragCtx.current=null; return; }
    if(!rtl && current < -SWIPE && onToggleComplete){ onToggleComplete(task.id); reset(); dragCtx.current=null; return; }
    if(!rtl && current > SWIPE && onToggleStar){ onToggleStar(task.id); reset(); dragCtx.current=null; return; }
    reset(); dragCtx.current=null;
  };

  const toggleExpand = useCallback(()=> setExpanded(e=> !e), []);
  const badges = task.badges || [];
  const meta = task.meta || '';
  const hasMeta = !!meta || badges.length>0;

  return (
    <div className="gt-taskRow-wrap" dir={dir} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} data-task-id={task.id}>
      <div className="gt-taskRow-swipeBg" aria-hidden="true" data-show="true">
        <div style={{opacity:.85}}>⭐</div>
        <div style={{opacity:.85}}>✓</div>
      </div>
      <motion.div className="gt-taskRow" role="listitem" aria-label={task.title} data-completed={task.completed || false} data-active={expanded || false} style={{ x }} layout transition={disableAnimations? {duration:0}: undefined}>
        <div className="gt-taskRow-leading">
          <IconButton label={task.completed? 'בטל השלמה':'סמן כהושלמה'} pressed={task.completed} onClick={()=> onToggleComplete?.(task.id)}>
            {task.completed? <Icon name="check" /> : <span style={{fontSize:18}}>○</span>}
          </IconButton>
        </div>
        <div className="gt-taskRow-body">
          <div className="gt-taskRow-title" data-priority={task.priority || 'p3'}>
            <button onClick={()=> onOpenDetails?.(task)} style={{all:'unset', cursor:'pointer'}}>{task.title || 'ללא כותרת'}</button>
            {task.starred && <Icon name="starFill" label="מועדף" />}
          </div>
          {hasMeta && (
            <>
              {meta && <div className="gt-taskRow-metaClamp" data-expanded={expanded}>{meta}</div>}
              {badges.length>0 && <div className="gt-taskRow-badges">{badges.map(b=> <Chip key={b.id} variant={b.variant}>{b.label}</Chip>)}</div>}
              <button className="gt-taskRow-expandBtn" onClick={toggleExpand} aria-expanded={expanded} aria-label={expanded? 'כווץ פרטים':'הרחב פרטים'}>{expanded? 'צמצום':'הרחבה'}</button>
            </>
          )}
        </div>
        <div className="gt-taskRow-trailing gt-taskRow-actions" aria-label="פעולות">
          <IconButton label={task.starred? 'הסר ממועדפים':'סמן כמועדף'} pressed={task.starred} onClick={()=> onToggleStar?.(task.id)}>
            <Icon name={task.starred? 'starFill':'star'} />
          </IconButton>
          <IconButton label="מחק" onClick={()=> onDelete?.(task.id)}>
            <Icon name="delete" />
          </IconButton>
        </div>
      </motion.div>
    </div>
  );
}

export const TaskRowV2 = forwardRef(TaskRowImpl);
export default TaskRowV2;
