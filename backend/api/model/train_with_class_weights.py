import matplotlib.pyplot as plt
import numpy as np
import tensorflow as tf
import keras
from tensorflow.keras import layers, models
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
import os
from sklearn.utils import class_weight

# Check for GPU
print("Num GPUs Available: ", len(tf.config.list_physical_devices('GPU')))
if tf.config.list_physical_devices('MPS'):
    print("MPS is available and will be used for acceleration.")

batch_size = 128
img_height = 128
img_width = 128
data_dir = 'multi_cancer'

# Create training and validation datasets
train_ds = tf.keras.utils.image_dataset_from_directory(
    data_dir,
    validation_split=0.2,
    subset="training",
    seed=123,
    image_size=(img_height, img_width),
    batch_size=batch_size,
    label_mode='categorical',
    color_mode='grayscale'
)

val_ds = tf.keras.utils.image_dataset_from_directory(
    data_dir,
    validation_split=0.2,
    subset="validation",
    seed=123,
    image_size=(img_height, img_width),
    batch_size=batch_size,
    label_mode='categorical',
    color_mode='grayscale'
)

# Grab class names from dataset
class_names = train_ds.class_names
print("Class names:", class_names)

# --- NEW: Calculate Class Weights ---
print("Calculating class weights...")
all_labels = []
class_counts = {}
# Iterate through the original directory to get total counts (approximation for training set)
for class_name in class_names:
    class_path = os.path.join(data_dir, class_name)
    if os.path.exists(class_path):
        count = len(os.listdir(class_path))
        class_counts[class_name] = count
        all_labels.extend([class_names.index(class_name)] * count)

print("Class counts (total):", class_counts)

class_weights_vals = class_weight.compute_class_weight(
    class_weight='balanced',
    classes=np.unique(all_labels),
    y=all_labels
)
class_weights = dict(enumerate(class_weights_vals))
print("Class weights:", class_weights)
# ------------------------------------

# Data Augmentation
data_augmentation = tf.keras.Sequential([
    layers.RandomFlip("horizontal"),
    layers.RandomRotation(0.1),
    layers.RandomZoom(0.1),
    layers.RandomTranslation(0.1, 0.1),
    layers.RandomContrast(0.1)
])

def preprocess_train(image, label):
    if image.shape[-1] == 1:
        image = tf.image.grayscale_to_rgb(image)
    x = data_augmentation(image)
    x = preprocess_input(x)
    return x, label

def preprocess_val(image, label):
    if image.shape[-1] == 1:
        image = tf.image.grayscale_to_rgb(image)
    x = preprocess_input(image)
    return x, label

AUTOTUNE = tf.data.AUTOTUNE
train_ds = train_ds.map(preprocess_train, num_parallel_calls=AUTOTUNE)
val_ds = val_ds.map(preprocess_val, num_parallel_calls=AUTOTUNE)

train_ds = train_ds.cache().shuffle(1000).prefetch(buffer_size=AUTOTUNE)
val_ds = val_ds.cache().prefetch(buffer_size=AUTOTUNE)

num_classes = len(class_names)

# Base model
base_model = keras.applications.MobileNetV2(
    input_shape=(128,128,3),
    include_top=False,
    weights='imagenet'
)

# Freeze layers
for layer in base_model.layers[:-30]:
    layer.trainable = False

inputs = keras.Input(shape=(128,128,3))
x = base_model(inputs, training=True)
x = keras.layers.GlobalAveragePooling2D()(x)
x = keras.layers.Dense(128, activation='relu', kernel_regularizer=keras.regularizers.l2(1e-4))(x)
x = keras.layers.Dropout(0.45)(x)
outputs = keras.layers.Dense(num_classes, activation='softmax', kernel_regularizer=keras.regularizers.l2(1e-4))(x)

model = keras.Model(inputs, outputs)

loss_fn = keras.losses.CategoricalCrossentropy(label_smoothing=0.1)
optimizer = keras.optimizers.Adam(learning_rate=3e-5)

model.compile(optimizer=optimizer, loss=loss_fn, metrics=['accuracy'])

early_stop = keras.callbacks.EarlyStopping(
    monitor='val_loss',
    patience=5,
    restore_best_weights=True
)

epochs = 10 
print("Starting training with class weights...")
history = model.fit(
    train_ds,
    validation_data=val_ds,
    epochs=epochs,
    callbacks=[early_stop],
    class_weight=class_weights 
)

model.save('cancer_model_weighted.keras')
print("Model saved to cancer_model_weighted.keras")
