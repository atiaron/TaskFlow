import React, { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, forwardRef } from 'react';
import '../ui/datetime.css';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * DateTimePicker (2025 Modern)
 * Props:
 *  - isOpen: boolean
 *  - onClose(): void
 *  - onChange(timestamp:number | null)
 *  - initialValue?: number (ms)
 *  - min?: number (ms)
 *  - max?: number (ms)
 *  - variant?: 'wheel' | 'slider' | 'native'
 *  - mode?: 'date-time' | 'date' | 'time'
 *  - disablePast?: boolean
 *  - locale?: string (default 'he-IL')
 *  - dir?: 'rtl' | 'ltr'
 * Accessibility:
 *  Uses ARIA listbox pattern per column (year/month/day/hour/minute) with roving focus simulation.
 */
const clamp = (v,min,max)=> Math.min(max, Math.max(min,v));

function buildDateParts(base){
  const d = base ? new Date(base) : new Date();
  return { y:d.getFullYear(), m:d.getMonth()+1, day:d.getDate(), h:d.getHours(), min:d.getMinutes() };
}
function daysInMonth(y,m){ return new Date(y,m,0).getDate(); }
function pad(n){ return n<10? `0${n}`: `${n}`; }

function generateRange(start,end){ const arr=[]; for(let i=start;i<=end;i++) arr.push(i); return arr; }

const DEFAULT_YEAR_SPAN = 4; // +/- שנים קדימה/אחורה סביב השנה הנוכחית – אפשר להרחיב בהמשך

const DateTimePicker = forwardRef(function DateTimePicker(props, ref){
  const {
    isOpen,
    onClose,
    onChange,
    initialValue,
    min,
    max,
    variant='wheel',
    mode='date-time',
    disablePast=false,
    locale='he-IL',
    dir='rtl'
  } = props;

  const initialParts = useMemo(()=> buildDateParts(initialValue), [initialValue]);
  const [parts,setParts] = useState(initialParts);
  const overlayRef = useRef(null);
  const columnsRef = useRef({}); // map key->HTMLElement

  // Sync when initialValue changes externally while closed
  useEffect(()=>{ if(!isOpen){ setParts(buildDateParts(initialValue)); }}, [initialValue,isOpen]);

  const yearNow = new Date().getFullYear();
  const years = useMemo(()=> generateRange(yearNow-DEFAULT_YEAR_SPAN, yearNow+DEFAULT_YEAR_SPAN), [yearNow]);
  const months = useMemo(()=> generateRange(1,12), []);
  const days = useMemo(()=> generateRange(1, daysInMonth(parts.y, parts.m)), [parts.y, parts.m]);
  const hours = useMemo(()=> generateRange(0,23), []);
  const minutes = useMemo(()=> generateRange(0,55).filter(n=> n%5===0), []); // 5 min steps

  // Compose timestamp
  const timestamp = useMemo(()=>{
    const {y,m,day,h,min:mi} = parts;
    const dt = new Date(y, m-1, day, h, mi, 0, 0);
    return dt.getTime();
  }, [parts]);

  // Constraints
  const constrainedTs = useMemo(()=>{
    let ts = timestamp;
    if(disablePast){ const now = Date.now(); if(ts < now) ts = now; }
    if(min && ts < min) ts = min;
    if(max && ts > max) ts = max;
    return ts;
  }, [timestamp, disablePast, min, max]);

  // Apply constraint if changed
  useEffect(()=>{
    if(constrainedTs !== timestamp){
      const d = new Date(constrainedTs);
      setParts({ y:d.getFullYear(), m:d.getMonth()+1, day:d.getDate(), h:d.getHours(), min:d.getMinutes() });
    }
  }, [constrainedTs, timestamp]);

  const commit = useCallback(()=>{ onChange?.(constrainedTs); }, [onChange, constrainedTs]);

  const close = useCallback(()=>{ onClose?.(); }, [onClose]);

  // Wheel scroll → set active based on center slot
  const handleScroll = useCallback((key)=>{
    const col = columnsRef.current[key];
    if(!col) return;
    const rect = col.getBoundingClientRect();
    const centerY = rect.top + rect.height/2;
    const slots = Array.from(col.querySelectorAll('[data-value]'));
    let closest=null, minDist=Infinity;
    slots.forEach(el=>{
      const r = el.getBoundingClientRect();
      const d = Math.abs((r.top + r.height/2) - centerY);
      if(d<minDist){ minDist=d; closest=el; }
    });
    if(closest){
      const v = Number(closest.dataset.value);
      setParts(p=> ({...p, [key]: v}));
    }
  }, []);

  const wheelColumnProps = (key, values, formatter)=>{
    return {
      ref: el=> columnsRef.current[key]=el,
      className: 'gt-dt-column',
      role:'listbox',
      tabIndex:0,
      'aria-label': key,
      onScroll: ()=> handleScroll(key),
      children: values.map(v=>{
        const active = parts[key] === v;
        return <div key={v} aria-selected={active} data-active={active} data-value={v} role='option' className='gt-dt-slot'>{formatter? formatter(v): v}</div>;
      })
    };
  };

  // Keyboard navigation (simple – moves selection)
  const handleKey = useCallback((e)=>{
    const targetCol = Object.entries(columnsRef.current).find(([,el])=> el === document.activeElement);
    if(!targetCol) return;
    const [key, el] = targetCol;
    if(['ArrowUp','ArrowDown','Home','End','PageUp','PageDown'].includes(e.key)){
      e.preventDefault();
      const arr = Array.from(el.querySelectorAll('[data-value]'));
      const values = arr.map(sl=> Number(sl.dataset.value));
      const idx = values.indexOf(parts[key]);
      let nextIdx = idx;
      if(e.key==='ArrowUp') nextIdx = clamp(idx-1,0,values.length-1);
      if(e.key==='ArrowDown') nextIdx = clamp(idx+1,0,values.length-1);
      if(e.key==='Home' || e.key==='PageUp') nextIdx = 0;
      if(e.key==='End' || e.key==='PageDown') nextIdx = values.length-1;
      const nextVal = values[nextIdx];
      setParts(p=> ({...p, [key]: nextVal}));
      // Scroll into view
      const slot = arr[nextIdx];
      slot?.scrollIntoView({block:'center', behavior:'smooth'});
    }
  }, [parts]);

  useEffect(()=>{
    if(!isOpen) return;
    const onDocKey = (e)=>{ if(e.key==='Escape'){ e.preventDefault(); close(); } else { handleKey(e);} };
    document.addEventListener('keydown', onDocKey);
    return ()=> document.removeEventListener('keydown', onDocKey);
  }, [isOpen, close, handleKey]);

  useImperativeHandle(ref, ()=> ({ focusFirst: ()=> { columnsRef.current.year?.focus(); } }));

  // Fallback native variant
  if(variant==='native'){
    return isOpen ? (
      <div className='gt-dt-overlay' dir={dir}>
        <div className='gt-dt-surface'>
          <div className='gt-dt-header'>
            <h2>בחר תאריך</h2>
            <button className='gt-dt-btn' onClick={close}>סגור</button>
          </div>
          <div style={{padding:'12px'}}>
            {(mode==='date' || mode==='date-time') && (
              <input type='date' defaultValue={new Date(constrainedTs).toISOString().slice(0,10)} onChange={e=> {
                const [yy,mm,dd]= e.target.value.split('-').map(Number);
                setParts(p=> ({...p, y:yy, m:mm, day:dd}));
              }} />)}
            {(mode==='time' || mode==='date-time') && (
              <input type='time' style={{marginInlineStart:8}} defaultValue={pad(parts.h)+':'+pad(parts.min)} onChange={e=> {
                const [hh,mi]= e.target.value.split(':').map(Number);
                setParts(p=> ({...p, h:hh, min:mi}));
              }} />)}
          </div>
          <div className='gt-dt-footer'>
            <button className='gt-dt-btn' onClick={close}>ביטול</button>
            <button className='gt-dt-btn' data-variant='primary' onClick={()=> { commit(); close(); }}>שמירה</button>
          </div>
        </div>
      </div>
    ): null;
  }

  const showDate = mode==='date' || mode==='date-time';
  const showTime = mode==='time' || mode==='date-time';

  const colOrder = useMemo(()=>{
    const arr = [];
    if(showDate){ arr.push('day','month','y'); }
    if(showTime){ arr.push('h','min'); }
    return arr;
  }, [showDate, showTime]);

  const formatters = {
    day: v=> pad(v),
    month: v=> pad(v),
    y: v=> v,
    h: v=> pad(v),
    min: v=> pad(v)
  };

  const valueSets = {
    day: days,
    month: months,
    y: years,
    h: hours,
    min: minutes
  };

  const labels = { day:'יום', month:'חודש', y:'שנה', h:'שעה', min:'דקות' };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className='gt-dt-overlay' dir={dir} aria-modal='true' role='dialog' aria-label='בחירת תאריך ושעה'>
          <motion.div className={`gt-dt-surface gt-dt--${variant}`} initial={{y:50, opacity:0}} animate={{y:0, opacity:1, transition:{duration:.28, ease:[.4,0,.2,1]}}} exit={{y:40, opacity:0, transition:{duration:.20}}}>
            <div className='gt-dt-header'>
              <h2>{mode==='time' ? 'בחירת שעה' : mode==='date' ? 'בחירת תאריך' : 'בחר תאריך ושעה'}</h2>
              <button className='gt-dt-btn' onClick={close} aria-label='סגור'>✕</button>
            </div>
            <div className='gt-dt-body'>
              <div className='gt-dt-columns' onKeyDown={handleKey}>
                {colOrder.map(key => (
                  <div key={key} aria-label={labels[key]} {...wheelColumnProps(key==='y'?'y':key, valueSets[key==='y'?'y':key], formatters[key])} />
                ))}
                <div className='gt-dt-focusbar' aria-hidden='true' />
              </div>
            </div>
            <div className='gt-dt-footer'>
              <button className='gt-dt-btn' onClick={close}>ביטול</button>
              <button className='gt-dt-btn' data-variant='primary' onClick={()=> { commit(); close(); }}>שמירה</button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});

export default DateTimePicker;
