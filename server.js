import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import Anthropic from '@anthropic-ai/sdk'
import axios from 'axios'

const app = express()
app.use(cors({ origin: 'http://localhost:3000' }))
app.use(express.json())

// Claude proxy
const claude = new Anthropic({
  apiKey: process.env.REACT_APP_CLAUDE_API_KEY
})

app.post('/api/claude', async (req, res) => {
  try {
    console.log('📨 Getting Claude request:', req.body)
    
    const completion = await claude.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      messages: req.body.messages,
      system: req.body.system
    })
    
    console.log('✅ Claude responded successfully')
    res.json(completion)
  } catch (error) {
    console.error('❌ Claude error:', error)
    res.status(500).json({ error: 'Claude API error' })
  }
})

// Google OAuth proxy
app.post('/api/auth/google', async (req, res) => {
  try {
    const { code } = req.body
    console.log('📨 Getting Google auth request')
    
    const tokenRes = await axios.post(
      'https://oauth2.googleapis.com/token',
      {
        code,
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: 'http://localhost:3000',
        grant_type: 'authorization_code'
      }
    )
    
    console.log('✅ Google auth successful')
    res.json(tokenRes.data)
  } catch (error) {
    console.error('❌ Google auth error:', error)
    res.status(500).json({ error: 'Google auth error' })
  }
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running! 🚀' })
})

const PORT = 4000
app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`)
  console.log(`📡 CORS enabled for http://localhost:3000`)
})