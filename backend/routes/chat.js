const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Trail = require('../models/Trail');

// Verify API Key
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('Warning: GEMINI_API_KEY is not defined in environment variables. Chatbot features will be unavailable.');
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Base system instruction guidelines
const baseSystemInstruction = `You are SabraTrails Safety AI, an intelligent hiking safety assistant for the SabraTrails React Native app.
Your role is to guide explorers on hiking trails in the Sabaragamuwa region of Sri Lanka (Belihuloya, Kalupahana, Haputale, Badulla, Ohiya, Balangoda, Ella, etc.).

Strict Rules:
1. You MUST strictly base your recommendations and descriptions on the official list of trails provided in the context below. Do NOT make up or recommend any trails that are not in this list.
2. When users ask for recommendations (e.g. based on location, difficulty, climate, or duration), search the list, pick the best matching trails, and suggest them.
3. Provide safety recommendations, weather warnings, and leech protection protocols using the safety tips in the list.
4. Keep your answers concise, practical, and formatted for a mobile screen. Use short paragraphs, bullet points, and appropriate emojis.
5. If the query is unrelated to hiking, outdoor activities, or travel in Sri Lanka, politely redirect the conversation back to trail safety and exploration.`;

// POST /api/chat - Send message to Gemini and get response
router.post('/', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message body is required' });
    }

    if (!genAI) {
      return res.status(503).json({ error: 'Gemini AI service is currently unavailable. Please verify API key.' });
    }

    // 1. Fetch all trails from MongoDB
    const dbTrails = await Trail.find({});
    
    // 2. Format the trails database into context (with safe array checks for safetyTips)
    const trailsContext = dbTrails.map(t => {
      const safetyTipsStr = Array.isArray(t.safetyTips) ? t.safetyTips.join('; ') : '';
      return `* Trail: "${t.name}" (ID/Slug: "${t._id}")
        Location: ${t.location || 'Unknown'}
        Difficulty: ${t.difficulty || 'Moderate'}
        Elevation: ${t.elevation || 'N/A'}
        Duration: ${t.duration || 'N/A'}
        Climate: ${t.climate || 'N/A'}
        Description: ${t.description || ''}
        Safety Tips: ${safetyTipsStr}`;
    }).join('\n\n');

    // 3. Assemble dynamic system instruction incorporating DB trails context
    const dynamicSystemInstruction = `${baseSystemInstruction}

---
OFFICIAL DATABASE TRAILS (Stated below are the ONLY trails you can discuss and recommend):
${trailsContext}
---`;

    // 4. Initialize model with dynamic system instructions
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: dynamicSystemInstruction,
    });

    // 5. Format conversation history (ensuring it strictly begins with a 'user' turn for Gemini compliance)
    const formattedHistory = [];
    if (Array.isArray(history)) {
      const recentHistory = history.slice(-10);
      let foundFirstUser = false;
      
      for (const msg of recentHistory) {
        if (msg.sender === 'user') {
          foundFirstUser = true;
        }
        
        if (foundFirstUser && msg.sender && msg.text) {
          formattedHistory.push({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
          });
        }
      }
    }

    // 6. Start chat session and send prompt
    const chat = model.startChat({
      history: formattedHistory
    });

    console.log(`Sending user message to Gemini with dynamic database context...`);
    const result = await chat.sendMessage(message.trim());
    const response = await result.response;
    const responseText = response.text();

    res.json({
      reply: responseText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  } catch (error) {
    console.error('Error in Gemini Chat route with DB context:', error);
    
    // Bubble up a clean message (especially useful if the API Key is invalid or expired)
    const rawMessage = error.message || '';
    let userFriendlyError = 'Internal server error during chat query';
    
    if (rawMessage.toLowerCase().includes('key') || rawMessage.toLowerCase().includes('api')) {
      userFriendlyError = `Gemini API Error: The API key provided in .env is invalid or inactive. (${rawMessage})`;
    } else if (rawMessage) {
      userFriendlyError = `Gemini AI Error: ${rawMessage}`;
    }

    res.status(500).json({ error: userFriendlyError });
  }
});

module.exports = router;
