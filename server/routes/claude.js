const express = require('express');
const router = express.Router();

// Function Calling Handler
const handleFunctionCalling = (claudeResponse) => {
  try {
    console.log('🧠 Checking if Claude response is JSON action...');
    
    const responseText = claudeResponse.content[0].text;
    console.log('📝 Claude raw response:', responseText);
    
    // נסה לפרש כJSON
    const parsedJson = JSON.parse(responseText);
    
    // בדוק שזה action תקני
    if (parsedJson.action && parsedJson.payload) {
      console.log('✅ Valid JSON action detected:', parsedJson);
      
      // ולידציה של סוגי פעולות
      const validActions = ['create_task', 'update_task', 'delete_task', 'schedule_reminder'];
      
      if (!validActions.includes(parsedJson.action)) {
        throw new Error(`Invalid action type: ${parsedJson.action}`);
      }
      
      // ולידציה לפי סוג פעולה
      switch (parsedJson.action) {
        case 'create_task':
          if (!parsedJson.payload.title || parsedJson.payload.title.trim() === '') {
            throw new Error('Task title is required');
          }
          break;
          
        case 'update_task':
          if (!parsedJson.payload.taskId) {
            throw new Error('Task ID is required for update');
          }
          break;
          
        case 'delete_task':
          if (!parsedJson.payload.taskId) {
            throw new Error('Task ID is required for deletion');
          }
          break;
      }
      
      return {
        isAction: true,
        action: parsedJson,
        message: generateActionMessage(parsedJson)
      };
    }
    
    return { isAction: false };
    
  } catch (error) {
    console.log('📝 Not a JSON action, treating as regular text');
    return { isAction: false };
  }
};

// יצירת הודעה ידידותית לפעולה
const generateActionMessage = (action) => {
  switch (action.action) {
    case 'create_task':
      return `✅ יצרתי לך את המשימה "${action.payload.title}"!`;
      
    case 'update_task':
      return `🔄 עדכנתי את המשימה בהצלחה!`;
      
    case 'delete_task':
      return `🗑️ מחקתי את המשימה!`;
      
    case 'schedule_reminder':
      return `⏰ יצרתי לך תזכורת!`;
      
    default:
      return `✅ הפעולה בוצעה בהצלחה!`;
  }
};

// שיפור ה-prompt לFunction Calling
const buildSystemPrompt = (enableFunctionCalling = false) => {
  const currentTime = new Date().toLocaleString('he-IL', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  if (enableFunctionCalling) {
    return `
אתה TaskFlow AI, עוזר אישי חכם וידידותי של atiaron.

⚡ מצב Function Calling מופעל!

🎯 כשatiaron מבקש ליצור/עדכן/למחוק משימה - החזר רקJSON במבנה הבא:

{
  "action": "create_task",
  "payload": {
    "title": "כותרת המשימה", 
    "description": "תיאור המשימה",
    "priority": "low|medium|high",
    "dueDate": "YYYY-MM-DD",
    "tags": ["תג1", "תג2"],
    "estimatedTime": 30
  }
}

📅 זיהוי תאריכים חכם:
- "מחר" → ${getTomorrowDate()}
- "השבוע" → תאריך בשבוע הקרוב  
- "החודש" → תאריך בחודש הקרוב
- "היום" → ${getTodayDate()}

🎨 דוגמאות מדויקות:

atiaron: "צור לי משימה לקנות חלב מחר"
אתה: {"action": "create_task", "payload": {"title": "לקנות חלב", "description": "קניית חלב מהחנות", "dueDate": "${getTomorrowDate()}", "tags": ["קניות"], "priority": "medium"}}

atiaron: "הוסף משימה דחופה להתקשר לרופא"
אתה: {"action": "create_task", "payload": {"title": "להתקשר לרופא", "description": "תיאום תור אצל הרופא", "priority": "high", "tags": ["בריאות"]}}

❗ חשוב: אם זה לא בקשה ליצור/עדכן/למחוק משימה - ענה טקסט רגיל בעברית!

זמן נוכחי: ${currentTime}
משתמש: atiaron
`;
  } else {
    return `
אתה עוזר אישי חכם וידידותי של atiaron בניהול משימות.

תפקידך:
- לעזור לניהול משימות יומיות
- לענות בעברית בצורה ידידותית
- להבין בקשות בטקסט טבעי
- לתת עצות והנחיות מעשיות

זמן נוכחי: ${currentTime}
משתמש: atiaron

ענה בצורה טבעית וחמה.
`;
  }
};

// פונקציות עזר לתאריכים
const getTodayDate = () => {
  return new Date().toISOString().split('T')[0];
};

const getTomorrowDate = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

// Route עדכני לClaude
router.post('/', async (req, res) => {
  try {
    const { messages, system, enableFunctionCalling = false } = req.body;
    
    console.log('🚀 Claude API Request:');
    console.log('- Messages count:', messages?.length || 0);
    console.log('- Function Calling:', enableFunctionCalling ? 'ENABLED' : 'DISABLED');
    console.log('- User:', 'atiaron');
    console.log('- Time:', new Date().toLocaleString('he-IL'));

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ 
        error: 'Invalid request: messages array is required' 
      });
    }

    // בנה system prompt מותאם
    const systemPrompt = system || buildSystemPrompt(enableFunctionCalling);
    
    console.log('📤 Sending to Claude API...');
    
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1500,
        system: systemPrompt,
        messages: messages
      })
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('❌ Claude API Error:', claudeResponse.status, errorText);
      return res.status(500).json({ 
        error: 'Claude API error',
        details: `Status: ${claudeResponse.status}`
      });
    }

    const claudeData = await claudeResponse.json();
    console.log('✅ Claude response received');

    // 🎯 בדוק אם זה Function Calling
    if (enableFunctionCalling) {
      const functionResult = handleFunctionCalling(claudeData);
      
      if (functionResult.isAction) {
        console.log('🎬 Function Calling detected!');
        return res.json({
          type: 'action_success',
          message: functionResult.message,
          actions: [functionResult.action],
          originalResponse: claudeData
        });
      }
    }

    // טקסט רגיל
    console.log('📝 Regular text response');
    res.json(claudeData);

  } catch (error) {
    console.error('❌ Server Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

module.exports = router;