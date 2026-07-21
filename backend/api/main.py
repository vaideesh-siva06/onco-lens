import os
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

import uvicorn
import numpy as np
from PIL import Image, UnidentifiedImageError
import io
import requests
# import tensorflow as tf
# from tensorflow.keras.applications.resnet50 import preprocess_input

import tflite_runtime.interpreter as tflite


app = FastAPI()


# -----------------------------
# CORS
# -----------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost",
        "http://localhost:80",
        "https://onco-lens-sxrc.onrender.com",
        "https://onco-lens.vaideesh4.workers.dev"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# Classes
# -----------------------------

class_names = [
    'brain_glioma',
    'brain_menin',
    'brain_tumor',
    'breast_benign',
    'breast_malignant',
    'cervix_dyk',
    'cervix_koc',
    'cervix_mep',
    'cervix_pab',
    'colon_aca',
    'colon_bnt',
    'kidney_normal',
    'kidney_tumor',
    'lung_aca',
    'lung_bnt',
    'lung_scc'
]


class_descriptions = {
    "brain_glioma": "Tumor from supportive glial cells in the brain.",
    "brain_menin": "Meningioma — tumor of the protective membranes around the brain.",
    "brain_tumor": "General brain tumor classification.",
    "breast_benign": "Non-cancerous breast tumor.",
    "breast_malignant": "Cancerous breast tumor.",
    "cervix_dyk": "Precancerous cervical cell abnormality.",
    "cervix_koc": "Cervical squamous cell carcinoma.",
    "cervix_mep": "Cervical epithelial metaplasia.",
    "cervix_pab": "Cervical papilloma.",
    "colon_aca": "Colon adenocarcinoma.",
    "colon_bnt": "Benign colon tumor.",
    "kidney_normal": "Healthy kidney tissue.",
    "kidney_tumor": "Kidney tumor.",
    "lung_aca": "Lung adenocarcinoma.",
    "lung_bnt": "Benign lung tumor.",
    "lung_scc": "Lung squamous cell carcinoma."
}


# -----------------------------
# Model
# -----------------------------

MODEL_PATH = "/app/model/cancer_model.tflite"


DROPBOX_URL = "YOUR_TFLITE_DROPBOX_URL"


def download_model(url: str, dest_path: str):
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)

    print("Downloading TFLite model...")

    response = requests.get(url, stream=True)
    response.raise_for_status()

    with open(dest_path, "wb") as f:
        for chunk in response.iter_content(chunk_size=8192):
            if chunk:
                f.write(chunk)

    print("Download complete")


interpreter = None


def get_model():

    global interpreter

    if interpreter is not None:
        return interpreter


    print("Files:", os.listdir("/app/model"))


    if not os.path.exists(MODEL_PATH):
        download_model(
            DROPBOX_URL,
            MODEL_PATH
        )


    print("Loading TFLite model...")


    interpreter = tf.lite.Interpreter(
        model_path=MODEL_PATH
    )

    interpreter.allocate_tensors()


    print("TFLite model loaded")


    return interpreter



# -----------------------------
# Prediction
# -----------------------------

@app.post("/predict")
async def predict(file: UploadFile = File(...)):

    try:

        model = get_model()

        contents = await file.read()

        image = Image.open(
            io.BytesIO(contents)
        )


    except UnidentifiedImageError:

        return {
            "error": "Invalid image file"
        }


    except Exception as e:

        return {
            "error": f"Image loading error: {e}"
        }


    try:

        # Convert image
        if image.mode != "RGB":
            image = image.convert("RGB")


        # Resize
        image = image.resize(
            (256, 256)
        )


        img_array = np.array(image)


        img_array = np.expand_dims(
            img_array,
            axis=0
        )


        # img_array = preprocess_input(
        #     img_array.astype(np.float32)
        # )

        img_array = img_array.astype(np.float32)

        img_array = (img_array - 127.5) / 127.5


        # -----------------------------
        # TFLite inference
        # -----------------------------

        input_details = model.get_input_details()
        output_details = model.get_output_details()


        model.set_tensor(
            input_details[0]["index"],
            img_array
        )


        model.invoke()


        prediction = model.get_tensor(
            output_details[0]["index"]
        )


        pred_index = int(
            np.argmax(prediction[0])
        )


        pred_class_name = class_names[pred_index]


        confidence = round(
            float(np.max(prediction[0]) * 100),
            2
        )


        return {
            "prediction": pred_class_name,
            "description": class_descriptions.get(
                pred_class_name,
                ""
            ),
            "confidence": confidence
        }


    except Exception as e:

        return {
            "error": f"Prediction error: {e}"
        }



# -----------------------------
# Run
# -----------------------------

if __name__ == "__main__":

    port = int(
        os.environ.get("PORT", 8000)
    )

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=False
    )