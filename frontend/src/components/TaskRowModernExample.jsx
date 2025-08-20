import React, { useState, useCallback } from 'react';
import TaskRowModern from './TaskRowModern';

const initial = [
  { id:'t1', title:'לסיים אפיון מודרניזציה', completed:false, starred:true, priority:'p1', meta:'מסמך סטטוס + חלוקת שלבים', badges:[{id:'b1', label:'היום'}, {id:'b2', label:'P1'}] },
  { id:'t2', title:'להוסיף תמיכת Swipe', completed:false, starred:false, priority:'p2', meta:'בדיקת RTL + תנועת קפיץ', badges:[{id:'b3', label:'מחר'}] },
  { id:'t3', title:'Refactor TaskList Provider', completed:true, starred:false, priority:'p3', meta:'ניקוי useEffects ושיפור memo', badges:[{id:'b4', label:'הושלם'}] }
];

export default function TaskRowModernExample(){
  const [tasks,setTasks] = useState(initial);
  const update = useCallback((id, patch)=> setTasks(ts => ts.map(t=> t.id===id? {...t, ...patch}: t)), []);
  const remove = useCallback(id => setTasks(ts => ts.filter(t=> t.id!==id)), []);

  return (
    <div style={{padding:24}}>
      <h3>TaskRowModern – דוגמת אינטראקציה</h3>
      <div role='list' style={{display:'flex', flexDirection:'column', gap:12}}>
        {tasks.map(t => (
          <TaskRowModern
            key={t.id}
            task={t}
            onToggleComplete={(id)=> update(id, { completed: !tasks.find(x=> x.id===id).completed })}
            onToggleStar={(id)=> update(id, { starred: !tasks.find(x=> x.id===id).starred })}
            onDelete={remove}
            onOpenDetails={(task)=> console.log('Details:', task)}
          />
        ))}
      </div>
    </div>
  );
}
