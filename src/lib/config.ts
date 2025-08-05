// Backend API configuration
export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

// API endpoints
export const API_ENDPOINTS = {
  // Document endpoints
  DOCUMENTS: {
    BASE: `${BACKEND_URL}/api/v1/documents`,
    GENERATE: `${BACKEND_URL}/api/v1/documents/generate`,
    USER_DOCUMENTS: `${BACKEND_URL}/api/v1/documents/user`,
    DOCUMENT: (id: string) => `${BACKEND_URL}/api/v1/documents/${id}`,
    TEMPLATES: `${BACKEND_URL}/api/v1/documents/templates`,
    CREATE_PAYMENT: (id: string) => `${BACKEND_URL}/api/v1/documents/${id}/create-payment`,
    VERIFY_PAYMENT: (id: string) => `${BACKEND_URL}/api/v1/documents/${id}/verify-payment`,
    DOWNLOAD: (id: string) => `${BACKEND_URL}/api/v1/documents/${id}/download`,
  },
  
  // AI Assistant endpoints
  AI_ASSISTANT: {
    CHAT: `${BACKEND_URL}/api/v1/ai/chat`,
    CHAT_STREAM: `${BACKEND_URL}/api/v1/ai/chat/stream`,
    SESSIONS: `${BACKEND_URL}/api/v1/ai/sessions`,
    SESSION: (id: string) => `${BACKEND_URL}/api/v1/ai/sessions/${id}`,
    MODELS: `${BACKEND_URL}/api/v1/ai/models`,
    UPLOAD_DOCUMENTS: `${BACKEND_URL}/api/v1/ai/upload-documents`,
    DOCUMENTS: (sessionId: string) => `${BACKEND_URL}/api/v1/ai/documents/${sessionId}`,
    DELETE_DOCUMENT: (documentId: string) => `${BACKEND_URL}/api/v1/ai/documents/${documentId}`,
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
    AVAILABILITY: (userId: string) => `${BACKEND_URL}/api/freelancers/availability/${userId}`,
    EARNINGS: (userId: string) => `${BACKEND_URL}/api/freelancers/earnings/${userId}`,
    CASES: (userId: string) => `${BACKEND_URL}/api/freelancers/cases/${userId}`,
    BOOKINGS: (userId: string) => `${BACKEND_URL}/api/freelancers/bookings/${userId}`,
    CONSULTATIONS: (userId: string) => `${BACKEND_URL}/api/freelancers/consultations/${userId}`,
    CONSULTATION: (consultationId: string) => `${BACKEND_URL}/api/freelancers/consultations/${consultationId}/details`,
    CONFIRM_CONSULTATION: (consultationId: string) => `${BACKEND_URL}/api/freelancers/consultations/${consultationId}/confirm`,
    COMPLETE_CONSULTATION: (consultationId: string) => `${BACKEND_URL}/api/freelancers/consultations/${consultationId}/complete`,
    CANCEL_CONSULTATION: (consultationId: string) => `${BACKEND_URL}/api/freelancers/consultations/${consultationId}/cancel`,
    UPDATE_CONSULTATION_NOTES: (consultationId: string) => `${BACKEND_URL}/api/freelancers/consultations/${consultationId}/notes`,
    RATINGS: (userId: string) => `${BACKEND_URL}/api/freelancers/ratings/${userId}`,
    UPDATE_PROFILE: (userId: string) => `${BACKEND_URL}/api/freelancers/update/${userId}`,
    UPDATE_CREDENTIALS: (userId: string) => `${BACKEND_URL}/api/freelancers/credentials/${userId}`,
    ACCEPT_CASE: (caseId: string) => `${BACKEND_URL}/api/freelancers/cases/${caseId}/accept`,
    DECLINE_CASE: (caseId: string) => `${BACKEND_URL}/api/freelancers/cases/${caseId}/decline`,
    COMPLETE_CASE: (caseId: string) => `${BACKEND_URL}/api/freelancers/cases/${caseId}/complete`,
    ANNOTATE_CASE: (caseId: string) => `${BACKEND_URL}/api/freelancers/cases/${caseId}/annotate`,
    WITHDRAW: (userId: string) => `${BACKEND_URL}/api/freelancers/withdraw/${userId}`,
    SEARCH: `${BACKEND_URL}/api/freelancers/search`,
    REGISTER: `${BACKEND_URL}/api/freelancers/register`,
  },
  
  // User endpoints
  USERS: {
    PROFILE: `${BACKEND_URL}/api/users/profile`,
    UPDATE: `${BACKEND_URL}/api/users/update`,
    SYNC: `${BACKEND_URL}/api/users/sync`,
    ONBOARDING: `${BACKEND_URL}/api/users/onboarding`,
  },
  
  // Profile endpoints
  PROFILE: {
    UPLOAD_IMAGE: `${BACKEND_URL}/api/profile/upload-image`,
    REMOVE_IMAGE: `${BACKEND_URL}/api/profile/remove-image`,
    GET_IMAGE: (userId: string) => `${BACKEND_URL}/api/profile/image/${userId}`,
  },
  
  // Case endpoints
  CASES: {
    CREATE: `${BACKEND_URL}/api/cases`,
    MY_CASES: `${BACKEND_URL}/api/cases/my`,
    CASE: (id: string) => `${BACKEND_URL}/api/cases/${id}`,
  },
  
  // Payment History endpoints
  PAYMENT_HISTORY: {
    LIST: `${BACKEND_URL}/api/payment-history`,
    STATS: `${BACKEND_URL}/api/payment-history/stats`,
  },
};

// Environment configuration
export const ENV_CONFIG = {
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  BACKEND_URL,
}; 