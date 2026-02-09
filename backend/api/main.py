from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import numpy as np
from PIL import Image, UnidentifiedImageError
import io
from tensorflow.keras.models import load_model
from tensorflow.keras.applications.resnet50 import preprocess_input
import os
import requests

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

# Dropbox direct download link
DROPBOX_URL = "https://www.dropbox.com/scl/fi/c4mrmwsy3doy38sxejdxf/cancer_model.keras?rlkey=mmmgdzv834uumeezb8g970fsj&e=1&st=9te75o13&dl=1"

def download_model(url: str, dest_path: str):
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    print(f"Downloading model from Dropbox to {dest_path}...")
    response = requests.get(url, stream=True)
    response.raise_for_status()  # Raise error if download fails

    with open(dest_path, "wb") as f:
        for chunk in response.iter_content(chunk_size=8192):
            if chunk:
                f.write(chunk)
    print("Download complete.")

def get_model():
    print("CWD:", os.getcwd())
    print("Files in /app:", os.listdir("/app"))
    print("Files in /app/model:", os.listdir("/app/model"))

    if not os.path.exists(MODEL_PATH):
        download_model(DROPBOX_URL, MODEL_PATH)

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



if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))  # Render sets PORT
    uvicorn.run(
        "main:app",      # replace "main:app" if your FastAPI app is named differently
        host="0.0.0.0",  # must listen on all interfaces
        port=port,
        reload=False     # disable reload in production
    )
