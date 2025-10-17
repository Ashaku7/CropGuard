import { create } from 'zustand';

interface PestRisk {
  level: 'Low' | 'Medium' | 'High';
  color: string;
  reason: string;
}

interface LlmAnalysis {
  description: string;
  causes: string;
  treatment: string;
  prevention: string;
  tips: string;
}

interface AnalysisResult {
  disease: string;
  confidence: number;
  weather: WeatherData;
  pestRisk: PestRisk;
  llmAnalysis: LlmAnalysis;
  timestamp: string;
}

interface WeatherData {
  temp: number;
  humidity: number;
  rainfall?: number;
  location: string;
  description?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface CommunityPost {
  id: string;
  title: string;
  content: string;
  author: string;
  region: string;
  crop: string;
  date: string;
  verified: boolean;
}

interface AppState {
  // Image handling
  images: string[];
  setImages: (images: string[]) => void;
  clearImages: () => void;

  // Analysis results
  results: AnalysisResult | null;
  setResults: (results: AnalysisResult) => void;
  clearResults: () => void;

  // Error state
  analysisError: string | null;
  setAnalysisError: (message: string | null) => void;

  // Location
  userLocation: string;
  setUserLocation: (location: string) => void;

  // Weather data
  weather: WeatherData | null;
  setWeather: (weather: WeatherData) => void;

  // Loading states
  isAnalyzing: boolean;
  setIsAnalyzing: (isAnalyzing: boolean) => void;

  // Offline mode
  isOffline: boolean;
  setIsOffline: (isOffline: boolean) => void;

  // Chat for LLM
  chatMessages: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  clearChat: () => void;

  // History (for sync later)
  history: AnalysisResult[];
  addToHistory: (result: AnalysisResult) => void;

  // Roles & community
  role: 'farmer' | 'expert';
  setRole: (role: 'farmer' | 'expert') => void;
  communityPosts: CommunityPost[];
  addCommunityPost: (post: CommunityPost) => void;
}

export const useStore = create<AppState>((set) => ({
  // Initial state
  images: [],
  results: null,
  userLocation: 'Tamil Nadu',
  weather: null,
  isAnalyzing: false,
  isOffline: false,
  chatMessages: [],
  history: [],
  analysisError: null,
  role: 'farmer',
  communityPosts: [
    {
      id: '1',
      title: 'Effective Management of Late Blight in Tomatoes',
      content:
        'Farmers in coastal regions should apply Bordeaux mixture (1%) as a preventive measure during monsoon. Ensure proper spacing between plants for air circulation. Remove and destroy infected plant parts immediately.',
      author: 'Dr. Rajesh Kumar',
      region: 'Tamil Nadu',
      crop: 'Tomato',
      date: '2025-10-08',
      verified: true,
    },
    {
      id: '2',
      title: 'Bacterial Blight Control in Paddy Fields',
      content:
        'Use certified seeds and avoid excessive nitrogen application. Maintain 2-3 cm water level in fields. Apply Plantomycin during active tillering stage. Variety ADT-45 shows good resistance.',
      author: 'Dr. Priya Sharma',
      region: 'Tamil Nadu',
      crop: 'Rice',
      date: '2025-10-06',
      verified: true,
    },
    {
      id: '3',
      title: 'Winter Season Potato Disease Management',
      content:
        'Early blight is common in February-March. Start preventive sprays with Mancozeb 15 days after planting. Use certified seed tubers and practice crop rotation with legumes.',
      author: 'Agri. Officer Suresh Patel',
      region: 'Punjab',
      crop: 'Potato',
      date: '2025-10-05',
      verified: true,
    },
    {
      id: '4',
      title: 'Organic Pest Management Tips',
      content:
        'Neem oil spray (5ml per liter) is effective against many fungal diseases. Apply in early morning or evening. Combine with yellow sticky traps for insect control. Maintain soil health with compost.',
      author: 'Dr. Meena Iyer',
      region: 'Karnataka',
      crop: 'All Crops',
      date: '2025-10-03',
      verified: true,
    },
    {
      id: '5',
      title: 'Post-Monsoon Disease Prevention',
      content:
        'After heavy rains, ensure proper field drainage. Avoid working in wet fields to prevent disease spread. Apply fungicides only when foliage is dry. Monitor crops daily for early symptoms.',
      author: 'KVK Expert - Dr. Anil Verma',
      region: 'Maharashtra',
      crop: 'All Crops',
      date: '2025-10-01',
      verified: true,
    },
  ],

  // Actions
  setImages: (images) => set({ images }),
  clearImages: () => set({ images: [] }),

  setResults: (results) => set({ results }),
  clearResults: () => set({ results: null }),

  setAnalysisError: (message) => set({ analysisError: message }),

  setUserLocation: (userLocation) => set({ userLocation }),

  setWeather: (weather) => set({ weather }),

  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),

  setIsOffline: (isOffline) => set({ isOffline }),

  addChatMessage: (message) =>
    set((state) => ({ chatMessages: [...state.chatMessages, message] })),
  
  clearChat: () => set({ chatMessages: [] }),

  addToHistory: (result) =>
    set((state) => ({ history: [...state.history, result] })),

  setRole: (role) => set({ role }),
  addCommunityPost: (post) =>
    set((state) => ({ communityPosts: [post, ...state.communityPosts] })),
}));