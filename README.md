# Image Compression Lab

A full-stack image compression system using K-Means clustering for color quantization. This project demonstrates how machine learning can be applied to reduce image size while maintaining acceptable visual quality.

## Overview

In modern applications, high-resolution images consume significant storage and bandwidth. This project addresses that problem by implementing lossy compression using K-Means clustering in RGB space.

Each pixel is treated as a data point and grouped into clusters. Pixels are then replaced with their cluster centroids, effectively reducing the number of unique colors in the image and achieving compression.

## Features

* Upload JPG/PNG images
* Run compression for multiple K values simultaneously (e.g., 4, 8, 16, 32)
* Compare key performance metrics:

  * Mean Squared Error (MSE)
  * Compression Ratio
  * Inertia (K-Means objective)
  * Compressed size
* Visual comparison of original vs compressed images
* Download compressed outputs
* Elbow Method visualization to determine optimal K

## Tech Stack

* Backend: Flask, Flask-CORS, NumPy, OpenCV, scikit-learn
* Frontend: React 18, Vite, Recharts

## Project Structure

Image Compression Lab/
├── api_server.py
├── backend_requirements.txt
├── model.py
├── README.md
└── frontend/
├── package.json
├── vite.config.js
├── index.html
└── src/

## How It Works

1. Load image using OpenCV
2. Convert image to RGB format
3. Flatten image into pixel vectors (N x 3)
4. Apply K-Means clustering
5. Replace each pixel with its cluster centroid
6. Reconstruct compressed image
7. Evaluate using MSE, compression ratio, and inertia

This workflow follows the standard K-Means compression pipeline described in the project report.

## Performance Metrics

* MSE (Mean Squared Error): Measures quality loss (lower is better)
* Compression Ratio: Original size / compressed size
* Inertia: Sum of squared distances from cluster centers (lower is better)

Trade-off:

* Higher K → Better quality, less compression
* Lower K → Higher compression, lower quality

## Elbow Method

The Elbow Method is used to determine the optimal number of clusters (K).
It plots inertia vs K and selects the point where improvement slows down significantly.

## Setup Instructions

### Prerequisites

* Python 3.10+
* Node.js 18+

### Backend Setup

```bash
pip install -r backend_requirements.txt
python api_server.py
```

Runs at: http://localhost:5000

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Runs at: http://localhost:5173

## API Endpoint

POST /api/analyze

Supports:

* Image upload
* Multiple K values
* JPEG quality control
* Elbow method analysis

## Results

* Significant reduction in image size using color quantization
* Clear trade-off between compression and visual quality
* Elbow method helps in selecting optimal K
* Performance metrics validate effectiveness of clustering approach

## Learning Outcomes

* Practical understanding of K-Means clustering
* Image representation in RGB vector space
* Trade-offs in lossy compression
* Real-world full-stack integration of ML + Web

## Future Improvements

* Add GPU acceleration for faster clustering
* Support large-scale batch processing
* Deploy as a cloud-based service
* Add more compression algorithms for comparison

## Author

Ayushi Shukla
Anshuman Ravi
National Institute of Technology Patna

## License

Add your preferred license (e.g., MIT)
