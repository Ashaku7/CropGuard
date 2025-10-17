# CropGuard

## Backend (Flask) Setup

1. Create a virtual environment and install dependencies:
```bash
cd backend
# CropGuard

🌾 Smart, simple crop-disease detection — setup in minutes

CropGuard detects plant diseases from photos, adds local weather context, and returns clear guidance.

## Quick setup

1) Start the backend

```powershell
cd backend
python -m venv .venv
. .venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

Create `backend/.env` (example):

```text
MODEL_PATH=cropguard_model_fixed.keras
LABELS_PATH=labels.json
OPENWEATHER_API_KEY=your_openweather_key
GEMINI_API_KEY=your_gemini_key  # optional
```

2) Start the frontend

```powershell
cd ..
npm install
npm run dev
```

Create `.env.local`:

```text
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_openweather_key
```

Open http://localhost:3000 and upload a crop image.

## Handy commands

Health check:
```powershell
curl http://localhost:5000/health
```

Analyze example:
```powershell
curl -X POST "http://localhost:5000/analyze" -F "image=@sample.jpg" -F "latitude=12.97" -F "longitude=77.59"
```

**Steps To Train The Model:**

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

**Built with ❤️ for Indian Farmers**