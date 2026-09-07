import Groq from 'groq-sdk';

// Singleton Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export default groq;
