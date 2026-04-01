import numpy as np
import cv2
import matplotlib.pyplot as plt
from sklearn.cluster import KMeans
import os

# =========================
# LOAD IMAGE
# =========================
image_path = "image.jpg"   # change image name
img = cv2.imread(image_path)

if img is None:
    print("Error: Image not found")
    exit()

img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

# =========================
# PREPROCESSING
# =========================
pixel_data = img.reshape((-1, 3))
pixel_data = np.float32(pixel_data)

# =========================
# FUNCTIONS
# =========================

def compress_image(k):
    kmeans = KMeans(n_clusters=k, random_state=0, n_init=10)
    labels = kmeans.fit_predict(pixel_data)

    centers = np.uint8(kmeans.cluster_centers_)
    compressed_data = centers[labels]
    compressed_image = compressed_data.reshape(img.shape)

    return compressed_image, kmeans.inertia_

def calculate_mse(original, compressed):
    return np.mean((original.astype(float) - compressed.astype(float)) ** 2)

def save_temp_image(image, filename):
    cv2.imwrite(filename, cv2.cvtColor(image, cv2.COLOR_RGB2BGR))
    return os.path.getsize(filename)

# =========================
# MULTIPLE K VALUES
# =========================
k_values = [2, 4, 8, 16, 32]

results = []
images = []

original_size = os.path.getsize(image_path)

for k in k_values:
    comp_img, inertia = compress_image(k)

    mse = calculate_mse(img, comp_img)

    temp_file = f"compressed_{k}.jpg"
    comp_size = save_temp_image(comp_img, temp_file)

    ratio = original_size / comp_size

    results.append((k, mse, ratio, inertia))
    images.append(comp_img)

# =========================
# DISPLAY IMAGES
# =========================
plt.figure(figsize=(12, 8))

# Original
plt.subplot(2, 3, 1)
plt.imshow(img)
plt.title("Original")
plt.axis('off')

# Compressed images
for i, k in enumerate(k_values):
    plt.subplot(2, 3, i + 2)
    plt.imshow(images[i])
    plt.title(f"K = {k}")
    plt.axis('off')

plt.tight_layout()
plt.show()

# =========================
# PRINT RESULTS
# =========================
print("\n===== RESULTS =====")
print("K\tMSE\t\tCompression Ratio\tInertia")

for r in results:
    print(f"{r[0]}\t{r[1]:.2f}\t\t{r[2]:.2f}\t\t\t{r[3]:.2f}")

# =========================
# ELBOW METHOD GRAPH
# =========================
k_range = range(1, 11)
inertia_values = []

for k in k_range:
    kmeans = KMeans(n_clusters=k, random_state=0, n_init=10)
    kmeans.fit(pixel_data)
    inertia_values.append(kmeans.inertia_)

plt.figure()
plt.plot(k_range, inertia_values, marker='o')
plt.title("Elbow Method")
plt.xlabel("Number of Clusters (K)")
plt.ylabel("Inertia")
plt.show()