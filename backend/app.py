import os
import io
import json
from typing import Tuple, Dict, Any

import numpy as np
from PIL import Image
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import requests

# Optional: import tensorflow lazily when needed to reduce cold start
import tensorflow as tf
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input as mobilenet_v2_preprocess

load_dotenv()

app = Flask(__name__)
CORS(app)

MODEL_PATH = os.getenv('MODEL_PATH', 'cropguard_model_fixed.keras')
LABELS_PATH = os.getenv('LABELS_PATH', 'labels.json')
PREPROCESS = os.getenv('PREPROCESS', 'mobilenet_v2')  # mobilenet_v2 | rescale_255 | normalize_-1_1 | none
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
OPENWEATHER_API_KEY = os.getenv('OPENWEATHER_API_KEY')

_model = None
_labels = None
_tflite_interpreter = None
_tflite_input_index = None
_tflite_output_index = None


def load_model_and_labels():
    global _model, _labels, _tflite_interpreter, _tflite_input_index, _tflite_output_index
    # Load labels
    if _labels is None:
        with open(LABELS_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
            # support either {"labels": [...]} or simple list
            _labels = data.get('labels', data)
    # Load model depending on format
    if MODEL_PATH.endswith('.tflite') and _tflite_interpreter is None:
        # Use TFLite interpreter
        from tensorflow.lite.python.interpreter import Interpreter
        _tflite_interpreter = Interpreter(model_path=MODEL_PATH)
        _tflite_interpreter.allocate_tensors()
        input_details = _tflite_interpreter.get_input_details()
        output_details = _tflite_interpreter.get_output_details()
        _tflite_input_index = input_details[0]['index']
        _tflite_output_index = output_details[0]['index']
    elif not MODEL_PATH.endswith('.tflite') and _model is None:
        # Keras model path (.keras/.h5)
        _model = tf.keras.models.load_model(MODEL_PATH, compile=False)


def _get_expected_input_size() -> Tuple[int, int]:
    """Infer the model's expected input HxW if possible."""
    if MODEL_PATH.endswith('.tflite') and _tflite_interpreter is not None:
        input_details = _tflite_interpreter.get_input_details()[0]
        shape = input_details['shape']
        # shape like (1, h, w, c)
        if len(shape) == 4:
            return int(shape[1]), int(shape[2])
    elif _model is not None:
        try:
            shape = _model.input_shape  # (None, h, w, c)
            if isinstance(shape, (list, tuple)) and len(shape) == 4:
                return int(shape[1]), int(shape[2])
        except Exception:
            pass
    return 224, 224


def preprocess_image(file_storage) -> np.ndarray:
    # Ensure consistent preprocessing matching training
    image = Image.open(file_storage.stream).convert('RGB')
    h, w = _get_expected_input_size()
    image = image.resize((w, h), Image.Resampling.BILINEAR)  # Use BILINEAR for consistency
    arr = np.array(image).astype('float32')
    
    # Always use MobileNetV2 preprocessing since it's the base model
    arr = mobilenet_v2_preprocess(arr)
    arr = np.expand_dims(arr, axis=0)
    return arr


def softmax(x: np.ndarray) -> np.ndarray:
    # More stable softmax implementation
    x_max = np.max(x, axis=-1, keepdims=True)
    exp_x = np.exp(x - x_max)
    return exp_x / np.sum(exp_x, axis=-1, keepdims=True)


def predict_image(file_storage) -> Tuple[str, float]:
    load_model_and_labels()
    input_tensor = preprocess_image(file_storage)
    # Branch on model format
    if MODEL_PATH.endswith('.tflite') and _tflite_interpreter is not None:
        # Handle possible quantized input
        input_details = _tflite_interpreter.get_input_details()[0]
        tensor = input_tensor.astype(np.float32)
        if input_details.get('dtype') in (np.uint8, np.int8):
            # Quantize input according to scale/zero_point
            scale, zero_point = input_details.get('quantization', (1.0, 0))
            if scale and scale > 0:
                tensor = (tensor / scale + zero_point).astype(input_details['dtype'])
        _tflite_interpreter.set_tensor(_tflite_input_index, tensor)
        _tflite_interpreter.invoke()
        preds = _tflite_interpreter.get_tensor(_tflite_output_index)
        # Dequantize outputs if needed
        output_details = _tflite_interpreter.get_output_details()[0]
        if output_details.get('dtype') in (np.uint8, np.int8):
            scale, zero_point = output_details.get('quantization', (1.0, 0))
            preds = (preds.astype(np.float32) - zero_point) * (scale if scale else 1.0)
    else:
        preds = _model.predict(input_tensor)
    if preds.ndim == 2:
        preds = preds[0]
    # If model already outputs probabilities (sum≈1 and within [0,1]), trust it; else apply softmax
    preds_np = np.array(preds).astype('float32')
    if np.all(preds_np >= 0.0) and np.all(preds_np <= 1.0) and 0.98 <= float(np.sum(preds_np)) <= 1.02:
        probs = preds_np
    else:
        probs = softmax(preds_np)
    idx = int(np.argmax(probs))
    disease = _labels[idx] if idx < len(_labels) else str(idx)
    confidence = float(probs[idx]) * 100.0
    return disease, confidence


def fetch_weather(lat: float, lon: float) -> Dict[str, Any]:
    url = f'https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={OPENWEATHER_API_KEY}&units=metric'
    resp = requests.get(url, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    return {
        'temp': round(data['main']['temp']),
        'humidity': data['main']['humidity'],
        'conditions': data['weather'][0]['description'],
        'location': data.get('name') or '',
    }


def assess_pest_risk(weather: Dict[str, Any]) -> Dict[str, Any]:
    temp = weather.get('temp', 0)
    humidity = weather.get('humidity', 0)
    # Simple heuristic; tune as needed
    if humidity > 80 and 20 <= temp <= 35:
        return {'level': 'High', 'color': 'red', 'reason': 'Warm and humid conditions favor disease spread.'}
    if humidity > 60 and 18 <= temp <= 35:
        return {'level': 'Medium', 'color': 'yellow', 'reason': 'Moderate risk due to humidity and temperature.'}
    return {'level': 'Low', 'color': 'green', 'reason': 'Current conditions are less favorable for disease.'}


def call_llm(disease: str, weather: Dict[str, Any]) -> Dict[str, str]:
    # Use Gemini via REST API
    if not GEMINI_API_KEY:
        return {
            'description': 'LLM not configured.',
            'causes': 'N/A',
            'treatment': 'N/A',
            'prevention': 'N/A',
            'tips': 'N/A',
        }

    prompt = (
        f"Given plant disease: {disease}, current weather: {weather}, provide a concise analysis in exactly this format:\n\n"
        "DESCRIPTION: Brief 1-2 sentence description of the disease.\n\n"
        "HOW IT ATTACKED: How the disease likely spread considering current weather conditions (1-2 sentences).\n\n"
        "TREATMENT: Specific recommended treatments (2-3 bullet points).\n\n"
        "PREVENTION: Prevention strategies (2-3 bullet points).\n\n"
        "CARE TIPS: Ongoing care tips (2-3 bullet points).\n\n"
        "Keep each section brief and actionable. Use simple language."
    )

    url = f'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}'
    body = {
        'contents': [
            {
                'parts': [
                    { 'text': 'You are an agricultural expert providing concise, practical advice.' },
                    { 'text': prompt }
                ]
            }
        ],
        'generationConfig': {
            'temperature': 0.3,
            'maxOutputTokens': 600,
            'topP': 0.8,
            'topK': 40
        }
    }

    try:
        r = requests.post(url, headers={'Content-Type': 'application/json'}, data=json.dumps(body), timeout=30)
        r.raise_for_status()
        data = r.json()
        text = data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')

        # Parse the structured response
        lines = text.strip().split('\n')
        sections = {
            'description': '',
            'causes': '',
            'treatment': '',
            'prevention': '',
            'tips': ''
        }

        current_section = None
        for line in lines:
            line = line.strip()
            if line.upper().startswith('DESCRIPTION:'):
                current_section = 'description'
                sections[current_section] = line.replace('DESCRIPTION:', '').strip()
            elif line.upper().startswith('HOW IT ATTACKED:'):
                current_section = 'causes'
                sections[current_section] = line.replace('HOW IT ATTACKED:', '').strip()
            elif line.upper().startswith('TREATMENT:'):
                current_section = 'treatment'
                sections[current_section] = line.replace('TREATMENT:', '').strip()
            elif line.upper().startswith('PREVENTION:'):
                current_section = 'prevention'
                sections[current_section] = line.replace('PREVENTION:', '').strip()
            elif line.upper().startswith('CARE TIPS:'):
                current_section = 'tips'
                sections[current_section] = line.replace('CARE TIPS:', '').strip()
            elif current_section and line:
                # Continue adding to current section
                if sections[current_section]:
                    sections[current_section] += ' ' + line
                else:
                    sections[current_section] = line

        # Clean up sections - remove extra whitespace and format bullets
        for key in sections:
            sections[key] = sections[key].strip()
            # Convert bullet points if they exist
            if '\n' in sections[key]:
                sections[key] = sections[key].replace('\n- ', '\n• ').replace('\n* ', '\n• ')

        return sections

    except Exception as e:
        return {
            'description': f'LLM error: {str(e)}',
            'causes': '',
            'treatment': '',
            'prevention': '',
            'tips': '',
        }


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'}), 200


@app.route('/predict', methods=['POST'])
def predict():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'image file is required'}), 400
        file = request.files['image']
        disease, confidence = predict_image(file)
        return jsonify({'disease': disease, 'confidence': round(confidence, 2)})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/debug', methods=['POST'])
def debug():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'image file is required'}), 400
        file = request.files['image']
        load_model_and_labels()
        input_tensor = preprocess_image(file)
        
        if MODEL_PATH.endswith('.tflite') and _tflite_interpreter is not None:
            input_details = _tflite_interpreter.get_input_details()[0]
            tensor = input_tensor.astype(np.float32)
            if input_details.get('dtype') in (np.uint8, np.int8):
                scale, zero_point = input_details.get('quantization', (1.0, 0))
                if scale and scale > 0:
                    tensor = (tensor / scale + zero_point).astype(input_details['dtype'])
            _tflite_interpreter.set_tensor(_tflite_input_index, tensor)
            _tflite_interpreter.invoke()
            preds = _tflite_interpreter.get_tensor(_tflite_output_index)
            output_details = _tflite_interpreter.get_output_details()[0]
            if output_details.get('dtype') in (np.uint8, np.int8):
                scale, zero_point = output_details.get('quantization', (1.0, 0))
                preds = (preds.astype(np.float32) - zero_point) * (scale if scale else 1.0)
        else:
            preds = _model.predict(input_tensor)
        
        if preds.ndim == 2:
            preds = preds[0]
        
        preds_np = np.array(preds).astype('float32')
        if np.all(preds_np >= 0.0) and np.all(preds_np <= 1.0) and 0.98 <= float(np.sum(preds_np)) <= 1.02:
            probs = preds_np
        else:
            probs = softmax(preds_np)
        
        # Get top 5 predictions
        top_indices = np.argsort(probs)[-5:][::-1]
        top_predictions = []
        for idx in top_indices:
            disease = _labels[idx] if idx < len(_labels) else f'Class_{idx}'
            confidence = float(probs[idx]) * 100.0
            top_predictions.append({'disease': disease, 'confidence': round(confidence, 2), 'index': int(idx)})
        
        return jsonify({
            'top_predictions': top_predictions,
            'total_classes': len(_labels),
            'labels': _labels[:10]  # First 10 labels for reference
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'image file is required'}), 400
        file = request.files['image']

        lat = request.form.get('latitude')
        lon = request.form.get('longitude')
        if lat is None or lon is None:
            return jsonify({'error': 'latitude and longitude are required'}), 400
        lat = float(lat)
        lon = float(lon)

        disease, confidence = predict_image(file)
        weather = fetch_weather(lat, lon)
        pest_risk = assess_pest_risk(weather)
        llm = call_llm(disease, weather)

        return jsonify({
            'disease': disease,
            'confidence': round(confidence, 2),
            'weather': weather,
            'pestRisk': pest_risk,
            'llmAnalysis': llm,
        })
    except requests.HTTPError as e:
        return jsonify({'error': f'Weather API error: {str(e)}'}), 502
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)


