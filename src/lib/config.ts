// Backend API configuration
export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

// API endpoints
export const API_ENDPOINTS = {
  // Document endpoints
  DOCUMENTS: {
    GENERATE: `${BACKEND_URL}/api/v1/documents/generate`,
    USER_DOCUMENTS: `${BACKEND_URL}/api/v1/documents/user`,
    DOCUMENT: (id: string) => `${BACKEND_URL}/api/v1/documents/${id}`,
    TEMPLATES: `${BACKEND_URL}/api/v1/documents/templates`,
  },
  
  // AI Assistant endpoints
  AI_ASSISTANT: {
    CHAT: `${BACKEND_URL}/api/v1/ai/chat`,
    CHAT_STREAM: `${BACKEND_URL}/api/v1/ai/chat/stream`,
    SESSIONS: `${BACKEND_URL}/api/v1/ai/sessions`,
    SESSION: (id: string) => `${BACKEND_URL}/api/v1/ai/sessions/${id}`,
    MODELS: `${BACKEND_URL}/api/v1/ai/models`,
  },
  
  // Consultation endpoints
  CONSULTATIONS: {
    BOOK: `${BACKEND_URL}/api/consultations/book`,
    MY_CONSULTATIONS: `${BACKEND_URL}/api/consultations/my`,
    CONSULTATION: (id: string) => `${BACKEND_URL}/api/consultations/${id}`,
    FEEDBACK: (id: string) => `${BACKEND_URL}/api/consultations/${id}/feedback`,
  },
  
  // Freelancer endpoints
  FREELANCERS: {
    LIST: `${BACKEND_URL}/api/freelancers`,
    FREELANCER: (id: string) => `${BACKEND_URL}/api/freelancers/${id}`,
  },
  
  // User endpoints
  USERS: {
    PROFILE: `${BACKEND_URL}/api/users/profile`,
    UPDATE: `${BACKEND_URL}/api/users/update`,
  },
  
  // Case endpoints
  CASES: {
    CREATE: `${BACKEND_URL}/api/cases`,
    MY_CASES: `${BACKEND_URL}/api/cases/my`,
    CASE: (id: string) => `${BACKEND_URL}/api/cases/${id}`,
  },
};

// Environment configuration
export const ENV_CONFIG = {
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  BACKEND_URL,
}; 