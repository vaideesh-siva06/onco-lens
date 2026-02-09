from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import numpy as np
from PIL import Image, UnidentifiedImageError
import io
from tensorflow.keras.models import load_model
from tensorflow.keras.applications.resnet50 import preprocess_input
import os
import gdown 

os.environ['CUDA_VISIBLE_DEVICES'] = '-1' 

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://localhost:80",
    "http://localhost",
    "https://onco-lens.onrender.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://onco-lens.onrender.com"],        
    allow_credentials=True,
    allow_methods=["*"],        
    allow_headers=["*"],        
)

class_names = [
    'brain_glioma', 'brain_menin', 'brain_tumor', 'breast_benign', 'breast_malignant',
    'cervix_dyk', 'cervix_koc', 'cervix_mep', 'cervix_pab', 'colon_aca', 'colon_bnt',
    'kidney_normal', 'kidney_tumor', 'lung_aca', 'lung_bnt', 'lung_scc'
]

class_descriptions = {
    "brain_glioma": "Tumor from supportive glial cells in the brain; can be benign or malignant. (brain_glioma)",
    "brain_menin": "Meningioma — usually benign tumor of the protective membranes around the brain. (brain_menin)",
    "brain_tumor": "General brain tumor — abnormal cell growth in brain tissue. (brain_tumor)",
    "breast_benign": "Non‑cancerous breast tumor that does not invade surrounding tissue. (breast_benign)",
    "breast_malignant": "Cancerous breast tumor that can invade nearby tissue and spread. (breast_malignant)",
    "cervix_dyk": "Precancerous abnormal cervical cells (dyskaryosis) with potential to progress. (cervix_dyk)",
    "cervix_koc": "Keratinizing cervical squamous cell carcinoma — invasive type of cervical cancer. (cervix_koc)",
    "cervix_mep": "Benign transformation of cervical epithelial cells (metaplasia). (cervix_mep)",
    "cervix_pab": "Cervical papilloma — usually benign wart‑like growth. (cervix_pab)",
    "colon_aca": "Malignant colon adenocarcinoma — cancer from gland cells. (colon_aca)",
    "colon_bnt": "Benign colon tumor — non‑cancerous growth in colon tissue. (colon_bnt)",
    "kidney_normal": "Healthy kidney tissue with no abnormal growth. (kidney_normal)",
    "kidney_tumor": "Tumor in the kidney; may be benign or malignant. (kidney_tumor)",
    "lung_aca": "Lung adenocarcinoma — cancer arising from mucus‑producing cells. (lung_aca)",
    "lung_bnt": "Non‑cancerous lung tumor. (lung_bnt)",
    "lung_scc": "Lung squamous cell carcinoma — lung cancer from squamous cells. (lung_scc)"
}

# Path where the model should live
MODEL_PATH = "/app/model/cancer_model.keras"

# Google Drive direct download link
GDRIVE_URL = "https://drive.google.com/uc?export=download&id=1M7dfqb4WBLrXlbzGTion6XlD9BRoBvOP"

def get_model():
    print("CWD:", os.getcwd())
    print("Files in /app:", os.listdir("/app"))
    print("Files in /app/model:", os.listdir("/app/model"))

    # Download the model if it doesn't exist
    if not os.path.exists(MODEL_PATH):
        print(f"Model not found at {MODEL_PATH}. Downloading from Google Drive...")
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        gdown.download(GDRIVE_URL, MODEL_PATH, quiet=False)
        print("Download complete.")

    print("Loading model...")
    model = load_model(MODEL_PATH)
    print("Model loaded successfully.")
    return model


# Load once at startup
model = get_model()
print("Model loaded successfully!")

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
    except UnidentifiedImageError:
        return {"error": "Cannot identify image, it may be corrupted or unsupported format."}
    except Exception as e:
        return {"error": f"Error reading image: {e}"}

    try:
        # Convert grayscale to RGB
        if image.mode != "RGB":
            image = image.convert("RGB")
        
        # Resize to model input size
        image = image.resize((256, 256))  
        img_array = np.array(image)       
        img_array = np.expand_dims(img_array, axis=0)  
        img_array = preprocess_input(img_array.astype(np.float32))

        # Predict
        prediction = model.predict(img_array)
        pred_index = int(np.argmax(prediction[0]))
        pred_class_name = class_names[pred_index]
        pred_description = class_descriptions.get(pred_class_name, "")
        confidence = round(float(np.max(prediction[0]) * 100), 2)

        return {
            "prediction": pred_class_name,
            "description": pred_description,
            "confidence": confidence
        }

    except Exception as e:
        return {"error": f"Error processing image for prediction: {e}"}



PORT = int(os.environ.get("PORT", 8001))

if __name__ == '__main__':
    uvicorn.run(app, host="0.0.0.0", port=PORT)
