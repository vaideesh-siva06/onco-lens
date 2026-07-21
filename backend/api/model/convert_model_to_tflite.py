import tensorflow as tf

model = tf.keras.models.load_model("cancer_model.keras")

converter = tf.lite.TFLiteConverter.from_keras_model(model)

# Add this
converter.target_spec.supported_ops = [
    tf.lite.OpsSet.TFLITE_BUILTINS
]

tflite_model = converter.convert()

with open("cancer_model.tflite", "wb") as f:
    f.write(tflite_model)

print("Done!")