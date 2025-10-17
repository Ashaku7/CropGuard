# CropGuard

## Backend (Flask) Setup

1. Create a virtual environment and install dependencies:
```bash
cd backend
python -m venv .venv
. .venv/Scripts/activate  # Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

2. Create `.env` with your keys:
```
GEMINI_API_KEY=your_key_here
# CropGuard

AI-powered crop disease detection, context-aware recommendations, and weather-based pest-risk alerts.

This repository contains a Next.js frontend and a Flask-based backend that runs image classification (Keras or TFLite), fetches local weather, computes a simple pest-risk heuristic, and optionally calls an LLM (Gemini) for concise treatment/prevention advice.

If you're preparing this project for GitHub, this README explains how the pieces fit together, how to run the app locally, model notes, environment variables, and deployment suggestions.

---

## Table of contents

- Project overview
- Quick start
  - Backend (Flask)
  - Frontend (Next.js)
- API reference
- Model & labels
- Environment variables
- Deployment notes
- Development tips
- Contributing
- License

---

## Project overview

CropGuard aims to help farmers identify crop diseases from photos quickly and take action. Key features:

- Fast image upload (file or camera) via the Next.js frontend
- Backend inference supporting Keras (.h5/.keras) and TFLite models
- Local weather lookup (OpenWeatherMap) and a pest-risk heuristic
- Optional LLM-based analysis (Gemini) to return a short description, likely causes, treatments and prevention tips
- Chat-like assistant UI for follow-up questions (frontend)

The repository layout (important files):

- `app/` — Next.js frontend (app router)
- `backend/` — Flask API, model files, `labels.json`, and `requirements.txt`
- `lib/`, `utils/`, `components/` — frontend helpers, services and components
- `public/` — static assets (models can be placed here for TF.js use)

---

## Quick start

Follow these steps to run the project locally. You can run frontend and backend on the same machine; the frontend expects the backend to run on port 5000 by default.

### 1) Backend (Flask + model)

Open PowerShell and run:

```powershell
cd backend
python -m venv .venv
. .venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create a `.env` file in `backend/` (example):

```text
GEMINI_API_KEY=your_gemini_api_key_here
OPENWEATHER_API_KEY=your_openweather_api_key_here
MODEL_PATH=cropguard_model_fixed.keras
LABELS_PATH=labels.json
PREPROCESS=mobilenet_v2
```

Place your model and `labels.json` into `backend/` and run the server:

```powershell
python app.py
```

The backend will listen on http://0.0.0.0:5000 by default.

Endpoints:

- `GET /health` — health check
- `POST /predict` — form-data: `image` → returns `{ disease, confidence }`
- `POST /analyze` — form-data: `image`, `latitude`, `longitude` → returns `{ disease, confidence, weather, pestRisk, llmAnalysis }`

### 2) Frontend (Next.js)

From the repository root open PowerShell:

```powershell
npm install
npm run dev
```

Create `.env.local` in the project root with these values (adjust as needed):

```text
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_key_here
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_openweather_key_here
```

Open http://localhost:3000 to use the app. The UI supports image upload, analysis progress, and an interactive results page.

---

## API reference (backend)

POST /predict

- Request: form-data { image: file }
- Response: { disease: string, confidence: number }

POST /analyze

- Request: form-data { image: file, latitude: number, longitude: number }
- Response: {
    disease: string,
    confidence: number,
    weather: { temp, humidity, conditions, location },
    pestRisk: { level, color, reason },
    llmAnalysis: { description, causes, treatment, prevention, tips }
}

GET /health

- Response: { status: 'ok' }

---

## Model & labels

- The provided `backend/labels.json` contains class labels produced from your training runs (15 classes in the included file).
- The backend supports Keras models (saved with `.h5` or the newer `.keras` format) and TFLite models (`.tflite`).
- Expected input: RGB image resized to 224×224 and preprocessed with MobileNetV2 preprocessing by default.

Converting a Keras model to TFLite (optional):

```python
import tensorflow as tf
model = tf.keras.models.load_model('your_model.h5')
converter = tf.lite.TFLiteConverter.from_keras_model(model)
tflite_model = converter.convert()
with open('model.tflite', 'wb') as f:
    f.write(tflite_model)
```

Place `model.tflite` in `backend/` and update `MODEL_PATH` in `.env`.

---

## Environment variables

Backend (`backend/.env`):

- MODEL_PATH — model path relative to backend (default `cropguard_model_fixed.keras`)
- LABELS_PATH — labels file path (default `labels.json`)
- GEMINI_API_KEY — optional, for LLM analysis (keep server-side only)
- OPENWEATHER_API_KEY — optional but recommended for weather and pest risk
- PREPROCESS — preprocessing mode (mobilenet_v2 | rescale_255 | normalize_-1_1 | none)

Frontend (`.env.local`):

- NEXT_PUBLIC_API_URL — backend base URL (default http://localhost:5000)
- NEXT_PUBLIC_GEMINI_API_KEY — optional, used by the chat UI if implemented client-side (recommended: keep LLM calls server-side)
- NEXT_PUBLIC_OPENWEATHER_API_KEY — optional, used by frontend weather helpers if present

Security note: never commit secrets. Keep LLM keys and other secrets in server-side environment variables.

---

## Deployment notes

- Frontend: Vercel is recommended for Next.js. Add environment variables in the Vercel dashboard.
- Backend: the included `backend/Dockerfile` can be used to containerize the Flask app. Serve the container behind a small reverse proxy (NGINX) and use a process manager if not using containers.
- If using the Gemini LLM in production, proxy LLM requests from the backend so the API key remains server-side.

Performance tips:

- Use a TFLite model for lower memory usage and faster inference on CPU. If you have GPU access, keep a Keras/TensorFlow serving solution on a GPU-enabled host.
- Optimize models for size and latency (quantization or pruning) if targeting low-resource devices.

---

## Development tips

- Use small images (≤2MB) during development to speed up uploads and inference.
- If you change model classes, keep `labels.json` in sync with the model output order.
- Test the backend independently using curl or a minimal Python script that uploads an image to `/analyze`.

Example curl (PowerShell-friendly):

```powershell
curl -X POST "http://localhost:5000/analyze" -F "image=@sample.jpg" -F "latitude=12.97" -F "longitude=77.59"
```

---

## Suggested next steps (small improvements)

- Move any LLM calls to a secure server-side route so API keys never reach clients.
- Add unit tests for backend prediction and preprocessing functions (happy path + malformed image).
- Add CI workflows for linting, type checking, and running fast tests.
- Consider converting and shipping a TF.js model in `public/models/` for purely client-side inference (offline-capable PWA).

---

## Contributing

Contributions are welcome. Typical workflow:

1. Fork the repo
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit and push
4. Open a pull request describing your changes

Be sure not to commit secrets or large model files. Use Git LFS for large model files if you need them in the repo.

---

## License

MIT

---

## Acknowledgements

- PlantVillage / Kaggle dataset contributors
- TensorFlow and the open-source ML community
- Next.js and TailwindCSS teams

---

If you'd like, I can also:

- Add a short CONTRIBUTING.md and .gitignore entries for model files
- Add example tests for the Flask preprocessing/prediction functions
- Create a small GitHub Actions workflow to run linting and tests on pull requests

Tell me which of the above you'd like next.

```

#### **Option B: Train Your Own Model**

**Requirements:**
- Python 3.8+
- TensorFlow 2.x
- Dataset of crop disease images

**Steps:**
1. Collect and label crop disease images
2. Train model using TensorFlow/Keras in Python
3. Convert to TensorFlow.js format:
```bash
tensorflowjs_converter \
  --input_format=keras \
  path/to/model.h5 \
  path/to/output/directory
```
4. Place converted files in `public/models/`
5. Update disease labels in `data/diseases.ts` to match your model's classes

---

### **Phase 3: Add Offline Support (PWA)**

#### 1. **Install Next-PWA**
```bash
npm install next-pwa
```

#### 2. **Create `next.config.js`**
```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
});

module.exports = withPWA({
  // Your Next.js config
});
```

#### 3. **Create Web App Manifest**
Create `public/manifest.json`:
```json
{
  "name": "CropGuard",
  "short_name": "CropGuard",
  "description": "AI-Powered Crop Disease Detection",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#16a34a",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

#### 4. **Add IndexedDB for Offline Storage**
Install Dexie.js for easy IndexedDB management:
```bash
npm install dexie
```

Create `lib/offline-db.ts`:
```typescript
import Dexie, { Table } from 'dexie';

interface AnalysisCache {
  id?: number;
  diseaseId: string;
  timestamp: string;
  synced: boolean;
  data: any;
}

class OfflineDatabase extends Dexie {
  analyses!: Table<AnalysisCache>;

  constructor() {
    super('CropGuardDB');
    this.version(1).stores({
      analyses: '++id, diseaseId, timestamp, synced'
    });
  }
}

export const db = new OfflineDatabase();
```

---

### **Phase 4: Backend Integration (Optional)**

#### **Setup Backend (Flask or Node.js)**

**Option A: Flask Backend**
```python
# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import pymongo

app = Flask(__name__)
CORS(app)

# MongoDB connection
client = pymongo.MongoClient("your_mongodb_uri")
db = client.CropGuard

@app.route('/api/save-analysis', methods=['POST'])
def save_analysis():
    data = request.json
    result = db.analyses.insert_one(data)
    return jsonify({"id": str(result.inserted_id)})

@app.route('/api/community-posts', methods=['GET'])
def get_posts():
    posts = list(db.posts.find({}, {'_id': 0}))
    return jsonify(posts)

if __name__ == '__main__':
    app.run(debug=True)
```

**Option B: Next.js API Routes**
Create `app/api/save-analysis/route.ts`:
```typescript
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export async function POST(request: Request) {
  const data = await request.json();
  
  const client = new MongoClient(process.env.MONGODB_URI!);
  await client.connect();
  
  const db = client.db('CropGuard');
  const result = await db.collection('analyses').insertOne(data);
  
  await client.close();
  
  return NextResponse.json({ id: result.insertedId });
}
```

#### **Setup MongoDB Atlas**
1. Go to: https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Add to `.env.local`:
```bash
MONGODB_URI=your_mongodb_connection_string
```

---

### **Phase 5: Deploy to Production**

#### **Deploy on Vercel (Recommended)**

**Step 1:** Install Vercel CLI
```bash
npm install -g vercel
```

**Step 2:** Login to Vercel
```bash
vercel login
```

**Step 3:** Deploy
```bash
vercel
```

**Step 4:** Add Environment Variables
- Go to Vercel dashboard
- Navigate to your project → Settings → Environment Variables
- Add all keys from `.env.local`:
  - `NEXT_PUBLIC_GEMINI_API_KEY`
  - `NEXT_PUBLIC_OPENWEATHER_API_KEY`
  - `MONGODB_URI` (if using backend)

**Step 5:** Deploy to Production
```bash
vercel --prod
```

#### **Alternative: Deploy on Firebase Hosting**

**Step 1:** Install Firebase CLI
```bash
npm install -g firebase-tools
```

**Step 2:** Initialize Firebase
```bash
firebase init hosting
```

**Step 3:** Build and Deploy
```bash
npm run build
firebase deploy
```

---

## 📁 Project Structure

```
CropGuard/
├── app/
│   ├── community/
│   │   └── page.tsx          # Community feed page
│   ├── dashboard/
│   │   └── page.tsx          # Analytics dashboard
│   ├── results/
│   │   └── page.tsx          # Results with AI chat
│   ├── scan/
│   │   └── page.tsx          # Image preview & analysis
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Home page
│   └── globals.css           # Global styles
├── components/               # Reusable components (future)
├── data/
│   └── diseases.ts          # Disease database
├── lib/
│   ├── ai-model.ts          # AI model service
│   ├── chat-service.ts      # Gemini chat service
│   ├── store.ts             # Zustand state management
│   └── weather-service.ts   # Weather API service
├── utils/
│   └── helpers.ts           # Helper functions
├── public/
│   └── models/              # AI model files (future)
├── .env.local               # Environment variables
├── package.json
├── next.config.js
└── tsconfig.json
```

---

## 🛠️ Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

---

## 🌟 Features Roadmap

### **Completed**
- ✅ Image upload with validation
- ✅ Mock AI disease detection
- ✅ Regional recommendations
- ✅ Weather-based pest alerts
- ✅ AI chat assistant UI
- ✅ Community feed
- ✅ Analytics dashboard

### **In Progress**
- 🔄 Real AI model integration
- 🔄 API key integration (Gemini, OpenWeather)
- 🔄 Backend setup

### **Planned**
- ⏳ Offline PWA support
- ⏳ Multi-language support (Hindi, Tamil, Telugu, etc.)
- ⏳ Push notifications for pest alerts
- ⏳ User authentication
- ⏳ History and report tracking
- ⏳ Expert verification system
- ⏳ Interactive map with Leaflet.js
- ⏳ SMS/WhatsApp integration for alerts
- ⏳ Mobile app (React Native)

---

## 🐛 Known Issues & Limitations

1. **Mock AI Model**: Currently returns random predictions
2. **Weather Data**: Hardcoded until API key is added
3. **Chat Assistant**: Requires Gemini API key to function
4. **Community Posts**: Static data, needs backend integration
5. **Dashboard**: Mock analytics, needs real data from MongoDB
6. **No Authentication**: All features are publicly accessible
7. **Limited Disease Database**: Only 3 diseases currently

---

## 📚 Resources & Documentation

### **APIs Used**
- [Gemini API Docs](https://ai.google.dev/docs)
- [OpenWeatherMap API](https://openweathermap.org/api)
- [TensorFlow.js](https://www.tensorflow.org/js)

### **Datasets**
- [PlantVillage Dataset](https://www.kaggle.com/datasets/emmarex/plantdisease)
- [Plant Disease Recognition Dataset](https://www.kaggle.com/datasets/vipoooool/new-plant-diseases-dataset)

### **Government Resources**
- [ICAR - Indian Council of Agricultural Research](https://icar.org.in/)
- [KVK - Krishi Vigyan Kendra](https://kvk.icar.gov.in/)
- [TNAU - Tamil Nadu Agricultural University](https://www.tnau.ac.in/)

---

## 🤝 Contributing

Want to improve CropGuard? Here's how:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the MIT License.

---

## 📧 Contact & Support

For questions or support:
- Create an issue on GitHub
- Email: support@CropGuard.com (if applicable)

---

## 🙏 Acknowledgments

- Agricultural experts from KVK centers
- PlantVillage dataset contributors
- TensorFlow.js community
- Next.js and Vercel teams

---

**Built with ❤️ for Indian Farmers**