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

// Analisis sentimen sederhana (Bahasa Indonesia)
function simpleSentimentAnalysis(text) {
  const positiveWords = ['senang', 'bahagia', 'baik', 'bagus', 'hebat', 'luar biasa', 'mantap', 'suka', 'nikmat', 'puas', 'bersyukur', 'terima kasih', 'ceria', 'semangat', 'lega'];
  const negativeWords = ['sedih', 'buruk', 'jelek', 'marah', 'kesal', 'frustasi', 'cemas', 'khawatir', 'stres', 'depresi', 'kecewa', 'sakit', 'sepi', 'lelah', 'capek', 'bingung', 'takut'];

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
            content: "Analisis sentimen dari teks berikut dan jawab hanya dengan satu kata dalam bahasa Inggris: positive, negative, atau neutral."
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
        content: `Anda adalah seorang ahli kesehatan mental profesional (psikolog AI) di platform UniSphere. Tugas Anda adalah memberikan dukungan emosional yang mendalam, profesional, namun tetap hangat dan empati. 

Gunakan pengetahuan psikologi untuk:
1. Mengakui dan memvalidasi perasaan pengguna dengan tepat (active listening).
2. Memberikan analisis tenang dan suportif terhadap masalah mereka.
3. YANG PALING PENTING: Selalu berikan setidaknya satu atau dua aktivitas atau latihan praktis yang spesifik untuk meredakan stres/kecemasan sesuai dengan kondisi yang dialami user (misal: teknik pernapasan 4-7-8, grounding 5-4-3-2-1, journaling, atau aktivitas fisik ringan).

Pastikan respon Anda ringkas, terstruktur dengan baik, dan selalu menggunakan Bahasa Indonesia yang sopan dan menenangkan. Hindari diagnosa medis formal, fokus pada dukungan kesejahteraan emosional.`
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
    // Only set apiFailed if it's a real network/auth error, not just a model error
    if (error.message.includes('failed') || error.message.includes('API')) {
      apiFailed = true;
    }
    return getFallbackResponse(userMessage);
  }
};

function getFallbackResponse(userMessage) {
  const lowerMessage = userMessage.toLowerCase();

  if (lowerMessage.includes('stres') || lowerMessage.includes('tertekan') || lowerMessage.includes('pusing')) {
    return "Saya mengerti Anda sedang merasa stres. Hal ini sangat wajar terjadi. Sudahkah Anda mencoba menarik napas dalam-dalam atau beristirahat sejenak?";
  } else if (lowerMessage.includes('sedih') || lowerMessage.includes('kecewa') || lowerMessage.includes('menangis')) {
    return "Saya turut sedih mendengarnya. Ingatlah bahwa perasaan sulit ini bersifat sementara. Anda tidak sendirian di sini.";
  } else if (lowerMessage.includes('cemas') || lowerMessage.includes('khawatir') || lowerMessage.includes('takut')) {
    return "Kecemasan memang bisa terasa berat, tapi saya di sini untuk mendengarkan. Cobalah fokus pada pernapasan Anda secara perlahan.";
  } else if (lowerMessage.includes('senang') || lowerMessage.includes('bahagia') || lowerMessage.includes('hebat')) {
    return "Senang sekali mendengarnya! Teruslah pelihara energi positif ini ya.";
  }
  return "Saya di sini untuk mendengarkan Anda. Bisa ceritakan lebih lanjut apa yang sedang Anda rasakan?";
}
