import React, { useState, useRef } from 'react';
import DateTimePicker from './DateTimePicker';

export default function ExampleDateTimeUsage(){
  const [open,setOpen] = useState(false);
  const [value,setValue] = useState(null);
  const pickerRef = useRef(null);

  return (
    <div style={{padding:24}}>
      <h3>דוגמת שימוש ברכיב DateTimePicker מודרני</h3>
      <p>ערך נוכחי: {value ? new Date(value).toLocaleString('he-IL') : '—'}</p>
      <div style={{display:'flex', gap:12}}>
        <button onClick={()=> { setOpen(true); setTimeout(()=> pickerRef.current?.focusFirst(), 50); }}>פתח Wheel</button>
        <button onClick={()=> { setOpen(true); }}>פתח (ישתמש בברירת מחדל)</button>
      </div>
      <DateTimePicker
        ref={pickerRef}
        isOpen={open}
        onClose={()=> setOpen(false)}
        onChange={ts=> setValue(ts)}
        initialValue={value || Date.now()}
        variant='wheel'
        mode='date-time'
        disablePast
        dir='rtl'
      />
    </div>
  );
}
