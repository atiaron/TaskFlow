const express = require('express');
const router = express.Router();

// Chat endpoint for TaskFlow AI
router.post('/send', async (req, res) => {
  console.log('🤖 Chat request received:', req.body);
  
  try {
    const { message, userId, context, chatHistory } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
    if (!CLAUDE_API_KEY) {
      console.error('❌ Claude API key not found');
      return res.status(500).json({ error: 'Claude API key not configured' });
    }

    console.log('🔑 Claude API Key found, length:', CLAUDE_API_KEY.length);
    console.log('🔑 Claude API Key preview:', CLAUDE_API_KEY.substring(0, 20) + '...');

    // Build system prompt
    const systemPrompt = `אתה TaskFlow AI, עוזר אישי חכם וידידותי לניהול משימות.

תפקידך:
- לעזור לניהול משימות יומיות  
- לענות בעברית בצורה ידידותית
- להבין בקשות בטקסט טבעי
- לתת עצות והנחיות מעשיות

כללי פעולה חשובים:
1. 🤔 אם הבקשה לא ברורה - שאל שאלות להבהרה
2. 🤔 אם חסרים פרטים (תאריך, שעה, מקום) - בקש הבהרות
3. 🤔 אם לא בטוח מה המשתמש רוצה - הצע אפשרויות
4. ✅ רק אם הבקשה ברורה ומפורטת - צור משימה ואמר "יצרתי לך המשימה: [שם המשימה]"
5. 💡 תמיד תן עצות איך לשפר את הניסוח או התכנון

דוגמאות:
- "צור משימה לקנות חלב" → שאל "באיזה תאריך ובאיזה שעה?"
- "צור משימה לקנות חלב היום עד 18:00" → צור משימה ואמר "יצרתי לך המשימה: קנות חלב"

זמן נוכחי: ${new Date().toLocaleString('he-IL')}
משתמש: ${userId || 'אורח'}

ענה בצורה טבעית וחמה.`;

    // Build messages array
    const messages = [];
    
    // Add context if provided
    if (context) {
      const contextMessage = `הקשר נוכחי:
${context.currentTasks && context.currentTasks.length > 0 
  ? `משימות קיימות:\n${context.currentTasks.map(t => 
      `- ${t.title} (${t.completed ? 'הושלם' : 'בתהליך'})`
    ).join('\n')}`
  : 'אין משימות קיימות'}`;
    
      messages.push({ role: 'assistant', content: contextMessage });
    }
    
    // Add chat history (last 10 messages)
    if (chatHistory && Array.isArray(chatHistory)) {
      const recentHistory = chatHistory.slice(-10);
      recentHistory.forEach(msg => {
        messages.push({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      });
    }
    
    // Add current message
    messages.push({ role: 'user', content: message });

    // Call Claude API
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': CLAUDE_API_KEY,
        'Content-Type': 'application/json',
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
      console.error('❌ Claude API error:', claudeResponse.status, errorText);
      
      // במקום להחזיר שגיאה, נחזיר תגובה מדומה לבדיקה
      console.log('🤖 Using fallback response for testing...');
      return res.json({
        response: `שלום! אני TaskFlow AI 🤖\n\nכרגע אני עובד במצב בדיקה מכיוון שיש בעיה זמנית עם שירות Claude.\n\nאבל אני יכול לעזור לך עם:\n• יצירת משימות\n• תכנון היום\n• ארגון פרויקטים\n\nמה תרצה לעשות היום?`,
        actions: [],
        timestamp: new Date().toISOString(),
        conversationId: 'default',
        mode: 'fallback'
      });
    }

    const claudeData = await claudeResponse.json();
    console.log('✅ Claude response received');

    // Extract response text
    const responseText = claudeData.content && claudeData.content[0] 
      ? claudeData.content[0].text 
      : 'מצטער, לא הצלחתי לענות על השאלה.';

    // Extract actions from both user message and Claude response
    const userActions = extractActions(responseText, message);
    const allActions = userActions;
    
    console.log('🔍 User message:', message);
    console.log('🔍 Response text:', responseText);
    console.log('🎯 All actions found:', allActions);

    // Return response
    res.json({
      response: responseText,
      actions: allActions,
      timestamp: new Date().toISOString(),
      conversationId: 'default'
    });

  } catch (error) {
    console.error('❌ Chat error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
});

// Enhanced TaskFlow Action Extraction Engine
function extractActions(responseText, userMessage = '') {
  const actions = [];
  
  console.log('🔍 Starting enhanced action extraction...');
  console.log('📝 User message:', userMessage.substring(0, 100) + '...');
  console.log('🤖 AI response:', responseText.substring(0, 200) + '...');
  
  // אם התגובה מכילה שאלות או בקשות להבהרה - לא ליצור פעולות
  const questionPatterns = [
    /\?/g,
    /איזה\s+/gi,
    /מתי\s+/gi,
    /איך\s+/gi,
    /מה\s+/gi,
    /איפה\s+/gi,
    /למה\s+/gi,
    /האם\s+/gi,
    /צריך\s+פרטים/gi,
    /תוכל\s+לפרט/gi,
    /רוצה\s+להבין/gi,
    /אשמח\s+לדעת/gi
  ];
  
  // בדוק אם יש שאלות או בקשות להבהרה
  const hasQuestions = questionPatterns.some(pattern => pattern.test(responseText));
  
  if (hasQuestions) {
    console.log('🤔 Claude is asking questions - not creating actions');
    return actions;
  }

  // Analyze both user message and AI response for better action detection
  const combinedText = userMessage + ' ' + responseText;

  // 1. CREATE_TASK - יצירת משימות (מורחב)
  const createTaskPatterns = [
    // Traditional patterns
    /יצרתי\s+לך\s+(?:את\s+)?המשימה\s*[:.]?\s*(.+)/gi,
    /יצרתי\s+עבורך\s+את\s+המשימה\s+הבאה\s*[:.]?\s*(?:משימה\s*[:.]?\s*)?(.+)/gi,
    /הוספתי\s+לך\s+משימה\s*[:.]?\s*(.+)/gi,
    /נרשמה?\s+לך\s+המשימה\s*[:.]?\s*(.+)/gi,
    /המשימה\s+נוצרה\s*[:.]?\s*(.+)/gi,
    /רשמתי\s+לך\s*[:.]?\s*(.+)/gi,
    
    // User intent patterns
    /(?:תוסיף|צור|יצור|תיצור)\s+(?:לי\s+)?משימה\s*[:.]?\s*(.+)/gi,
    /(?:רוצה|צריך)\s+(?:ליצור|לעשות|להוסיף)\s+משימה\s*[:.]?\s*(.+)/gi,
    /משימה\s+חדשה\s*[:.]?\s*(.+)/gi,
    
    // Natural language patterns
    /צריך\s+(?:לעשות|להכין|לטפל)\s+(.+)/gi,
    /חשוב\s+(?:לי\s+)?(?:לעשות|להכין|לטפל)\s+(.+)/gi,
    /אני\s+(?:רוצה|צריך|חייב)\s+(?:לעשות|להכין|לטפל)\s+(.+)/gi,
    
    // Confirmation patterns
    /✅\s*משימה\s*[:.]?\s*(.+)/gi,
    /הושלם[!.]?\s*משימה\s*[:.]?\s*(.+)/gi
  ];

  createTaskPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(combinedText)) !== null) {
      const taskTitle = match[1].trim()
        .replace(/[.!]$/, '')
        .replace(/^[-•]\s*/, '')
        .replace(/היום|מחר|השבוע/gi, ''); // Clean temporal words
      
      if (taskTitle.length > 3) {
        // Extract priority from context
        const priority = extractPriorityFromContext(combinedText, taskTitle);
        
        // Extract due date hints
        const dueDate = extractDueDateFromContext(combinedText, taskTitle);
        
        actions.push({
          type: 'create_task',
          data: {
            title: taskTitle,
            priority: priority,
            completed: false,
            dueDate: dueDate,
            createdAt: new Date(),
            updatedAt: new Date(),
            source: 'ai_conversation'
          },
          reasoning: `זיהיתי בקשה ליצירת משימה: "${taskTitle}" עם עדיפות ${priority}`,
          confidence: calculateConfidence(pattern, taskTitle)
        });
        console.log('✅ CREATE_TASK action extracted:', taskTitle, 'Priority:', priority);
      }
    }
  });

  // 2. UPDATE_TASK - עדכון משימות קיימות
  const updateTaskPatterns = [
    /(?:עדכן|שנה|תעדכן|תשנה)\s+(?:את\s+)?המשימה\s+(.+?)\s+(?:ל|עם|בתור)\s+(.+)/gi,
    /המשימה\s+(.+?)\s+(?:תהיה|צריכה להיות|משתנה ל)\s+(.+)/gi,
    /(?:שנה|עדכן)\s+(.+?)\s+ל(.+)/gi
  ];

  updateTaskPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(combinedText)) !== null) {
      const originalTask = match[1].trim();
      const newContent = match[2].trim();
      
      if (originalTask.length > 3 && newContent.length > 3) {
        actions.push({
          type: 'update_task',
          data: {
            originalTitle: originalTask,
            newTitle: newContent,
            updatedAt: new Date()
          },
          reasoning: `זיהיתי בקשה לעדכון משימה: "${originalTask}" ל"${newContent}"`,
          confidence: 0.8
        });
        console.log('🔄 UPDATE_TASK action extracted:', originalTask, '->', newContent);
      }
    }
  });

  // 3. DELETE_TASK - מחיקת משימות
  const deleteTaskPatterns = [
    /(?:מחק|תמחק|הסר|תסיר|בטל|תבטל)\s+(?:את\s+)?המשימה\s+(.+)/gi,
    /המשימה\s+(.+?)\s+(?:לא\s+)?(?:רלוונטית|נחוצה|חשובה)\s+יותר/gi,
    /(?:סיימתי|גמרתי|הושלם)\s+(?:את\s+)?המשימה\s+(.+)/gi
  ];

  deleteTaskPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(combinedText)) !== null) {
      const taskToDelete = match[1].trim();
      
      if (taskToDelete.length > 3) {
        actions.push({
          type: 'delete_task',
          data: {
            title: taskToDelete,
            reason: 'user_request',
            deletedAt: new Date()
          },
          reasoning: `זיהיתי בקשה למחיקת משימה: "${taskToDelete}"`,
          confidence: 0.9
        });
        console.log('�️ DELETE_TASK action extracted:', taskToDelete);
      }
    }
  });

  // 4. SEARCH_TASKS - חיפוש משימות
  const searchTaskPatterns = [
    /(?:חפש|מצא|תחפש|תמצא)\s+(?:את\s+)?(?:המשימות?\s+)?(.+)/gi,
    /(?:איפה|מה)\s+(?:המשימה|המשימות)\s+(?:של|עם|שקשורות?\s+ל)\s*(.+)/gi,
    /(?:הראה|תציג)\s+(?:לי\s+)?(?:את\s+)?המשימות?\s+(.+)/gi
  ];

  searchTaskPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(combinedText)) !== null) {
      const searchQuery = match[1].trim();
      
      if (searchQuery.length > 2) {
        actions.push({
          type: 'search_tasks',
          data: {
            query: searchQuery,
            searchType: 'text',
            timestamp: new Date()
          },
          reasoning: `זיהיתי בקשה לחיפוש משימות: "${searchQuery}"`,
          confidence: 0.7
        });
        console.log('� SEARCH_TASKS action extracted:', searchQuery);
      }
    }
  });

  // 5. PLAN_WEEK - תכנון שבועי
  const planWeekPatterns = [
    /(?:תכנן|תתכנן|בואו\s+נתכנן)\s+(?:את\s+)?(?:השבוע|השבוע\s+הקרוב|השבוע\s+הבא)/gi,
    /(?:תוכנית|תכנון)\s+שבועית?/gi,
    /איך\s+(?:לארגן|לתכנן)\s+(?:את\s+)?השבוע/gi,
    /רוצה\s+(?:לתכנן|תוכנית)\s+(?:לשבוע|השבוע)/gi
  ];

  planWeekPatterns.forEach(pattern => {
    if (pattern.test(combinedText)) {
      actions.push({
        type: 'plan_week',
        data: {
          startDate: getWeekStart(),
          endDate: getWeekEnd(),
          planType: 'weekly',
          timestamp: new Date()
        },
        reasoning: 'זיהיתי בקשה לתכנון שבועי',
        confidence: 0.9
      });
      console.log('📅 PLAN_WEEK action extracted');
    }
  });

  // 6. ANALYZE_PRODUCTIVITY - ניתוח פרודקטיביות
  const analyzeProductivityPatterns = [
    /(?:ניתוח|תנתח)\s+(?:את\s+)?(?:הפרודקטיביות|ההתקדמות)/gi,
    /איך\s+(?:אני\s+)?(?:מתקדם|הולך|עומד)/gi,
    /(?:סטטיסטיקות|נתונים)\s+(?:על|של)\s+(?:המשימות|ההתקדמות)/gi,
    /מה\s+(?:המצב|הסטטוס)\s+(?:של\s+)?המשימות/gi,
    /(?:דוח|סיכום)\s+(?:התקדמות|פרודקטיביות)/gi
  ];

  analyzeProductivityPatterns.forEach(pattern => {
    if (pattern.test(combinedText)) {
      actions.push({
        type: 'analyze_productivity',
        data: {
          analysisType: 'comprehensive',
          timeframe: 'week',
          timestamp: new Date()
        },
        reasoning: 'זיהיתי בקשה לניתוח פרודקטיביות',
        confidence: 0.8
      });
      console.log('📊 ANALYZE_PRODUCTIVITY action extracted');
    }
  });

  console.log(`🎯 Total enhanced actions extracted: ${actions.length}`);
  return actions;
}

// Helper functions for enhanced extraction
function extractPriorityFromContext(text, taskTitle) {
  const highPriorityWords = /(?:דחוף|חשוב|עדיפות\s+גבוהה|מיידי|עכשיו)/gi;
  const lowPriorityWords = /(?:לא\s+דחוף|בזמן\s+פנוי|עדיפות\s+נמוכה|כשיהיה\s+זמן)/gi;
  
  if (highPriorityWords.test(text)) return 'high';
  if (lowPriorityWords.test(text)) return 'low';
  return 'medium';
}

function extractDueDateFromContext(text, taskTitle) {
  const today = new Date();
  
  if (/היום|עכשיו|מיידי/gi.test(text)) {
    return today;
  }
  
  if (/מחר/gi.test(text)) {
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return tomorrow;
  }
  
  if (/השבוע|השבוע\s+הזה/gi.test(text)) {
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
    return endOfWeek;
  }
  
  return null; // No specific due date found
}

function calculateConfidence(pattern, content) {
  let confidence = 0.5;
  
  // Higher confidence for explicit task creation
  if (pattern.source.includes('יצרתי') || pattern.source.includes('הוספתי')) {
    confidence += 0.3;
  }
  
  // Higher confidence for longer, more specific content
  if (content.length > 10) {
    confidence += 0.1;
  }
  
  if (content.includes('ל') || content.includes('את')) {
    confidence += 0.1;
  }
  
  return Math.min(confidence, 1.0);
}

function getWeekStart() {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
  return startOfWeek;
}

function getWeekEnd() {
  const today = new Date();
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() - today.getDay() + 7); // Sunday
  return endOfWeek;
}

module.exports = router;

module.exports = router;
