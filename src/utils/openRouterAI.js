// src/utils/openRouterAI.js

const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const MODEL = import.meta.env.VITE_OPENROUTER_MODEL || "google/gemini-2.0-flash-exp:free";
const BASE_URL = "https://openrouter.ai/api/v1";

// Track if API has failed
let apiFailed = false;

if (!API_KEY || API_KEY.includes('xxxxxxxxxx')) {
  console.warn('OpenRouter API key is not configured. AI features will use fallback responses.');
}

export const resetApiFailure = () => {
  apiFailed = false;
};

// Simple fallback sentiment analysis
function simpleSentimentAnalysis(text) {
  const positiveWords = ['happy', 'good', 'great', 'excellent', 'wonderful', 'amazing', 'fantastic', 'love', 'like', 'enjoy', 'pleased', 'satisfied', 'blessed', 'grateful', 'thankful', 'joy', 'excited', 'thrilled', 'delighted'];
  const negativeWords = ['sad', 'bad', 'terrible', 'awful', 'hate', 'dislike', 'angry', 'frustrated', 'anxious', 'worried', 'stressed', 'depressed', 'upset', 'disappointed', 'hurt', 'lonely', 'overwhelmed', 'struggling', 'tired', 'exhausted'];

  let positiveCount = 0;
  let negativeCount = 0;
  
  const words = text.toLowerCase().split(/\s+/);
  words.forEach(word => {
    if (positiveWords.includes(word)) positiveCount++;
    if (negativeWords.includes(word)) negativeCount++;
  });
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

export const analyzeSentiment = async (text) => {
  if (apiFailed || !API_KEY || API_KEY.includes('xxxxxxxxxx')) {
    return simpleSentimentAnalysis(text);
  }

  try {
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin, // Required for OpenRouter
        "X-Title": "UniSphere", // Optional for OpenRouter
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "system",
            content: "Analyze the sentiment of the following text and respond with only one word: positive, negative, or neutral."
          },
          {
            role: "user",
            content: text
          }
        ],
        temperature: 0.1,
      })
    });

    if (!response.ok) throw new Error('API request failed');

    const data = await response.json();
    const sentiment = data.choices[0].message.content.trim().toLowerCase();

    if (['positive', 'negative', 'neutral'].includes(sentiment)) {
      return sentiment;
    }
    return 'neutral';
  } catch (error) {
    console.error('OpenRouter Sentiment Analysis Error:', error);
    apiFailed = true;
    return simpleSentimentAnalysis(text);
  }
};

export const generateEmpatheticResponse = async (userMessage, conversationHistory = []) => {
  if (apiFailed || !API_KEY || API_KEY.includes('xxxxxxxxxx')) {
    return getFallbackResponse(userMessage);
  }

  try {
    const messages = [
      {
        role: "system",
        content: "You are an empathetic AI mental health support assistant. Respond in a compassionate, understanding, and supportive way. Keep responses concise but meaningful. Focus on acknowledging the user's feelings and providing helpful guidance."
      }
    ];

    // Add conversation history
    conversationHistory.forEach(turn => {
      messages.push({
        role: turn.sender === 'user' ? 'user' : 'assistant',
        content: turn.text
      });
    });

    // Add current message
    messages.push({
      role: "user",
      content: userMessage
    });

    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin,
        "X-Title": "UniSphere",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: messages,
        temperature: 0.7,
      })
    });

    if (!response.ok) throw new Error('API request failed');

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('OpenRouter Chat Error:', error);
    apiFailed = true;
    return getFallbackResponse(userMessage);
  }
};

function getFallbackResponse(userMessage) {
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes('stressed') || lowerMessage.includes('stress') || lowerMessage.includes('overwhelm')) {
    return "I can sense you're feeling stressed. It's completely normal to feel this way. Have you tried taking a few deep breaths or going for a short walk?";
  } else if (lowerMessage.includes('sad') || lowerMessage.includes('depress') || lowerMessage.includes('unhappy')) {
    return "I'm sorry you're feeling down. Remember that difficult emotions are temporary. Have you considered talking to someone you trust?";
  } else if (lowerMessage.includes('anxious') || lowerMessage.includes('worry')) {
    return "Anxiety can be overwhelming, but you're not alone. Try to focus on your breathing and take things one step at a time.";
  } else if (lowerMessage.includes('happy') || lowerMessage.includes('great')) {
    return "I'm glad to hear something positive! It's wonderful that you're feeling good.";
  }
  return "I'm here to listen. Could you tell me more about what you're feeling?";
}
