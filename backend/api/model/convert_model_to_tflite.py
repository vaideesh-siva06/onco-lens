import tensorflow as tf

model = tf.keras.models.load_model(
    "./cancer_model.keras",
    compile=False
)

converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]

tflite_model = converter.convert()

with open("./cancer_model.tflite", "wb") as f:
    f.write(tflite_model)

print("Done!")