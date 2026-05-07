#!/usr/bin/env python3
"""
Debug script to check OCR extraction for individual images.
"""

import os
import pytesseract
from PIL import Image
import cv2
import numpy as np

def preprocess_image(image_path):
    """Preprocess image for better OCR results"""
    try:
        image = cv2.imread(image_path)
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        return Image.fromarray(thresh)
    except Exception as e:
        print(f"Error preprocessing {image_path}: {e}")
        return None

def extract_text(image_path):
    """Extract text from image with debug info"""
    print(f"\n=== Processing: {image_path} ===")

    if not os.path.exists(image_path):
        print("File does not exist!")
        return ""

    # Get file size
    size = os.path.getsize(image_path)
    print(f"File size: {size} bytes")

    try:
        # Try to open with PIL first
        img = Image.open(image_path)
        print(f"Image format: {img.format}, size: {img.size}, mode: {img.mode}")
        img.close()

        # Preprocess
        processed = preprocess_image(image_path)
        if processed is None:
            return ""

        # Extract text
        text = pytesseract.image_to_string(processed, lang='eng')
        text = text.strip()

        print(f"Extracted text length: {len(text)} characters")
        if len(text) < 200:
            print(f"Raw text: '{text}'")
        else:
            print(f"Text preview: '{text[:200]}...'")

        return text

    except Exception as e:
        print(f"Error extracting text: {e}")
        return ""

def main():
    images_folder = "images"

    if not os.path.exists(images_folder):
        print(f"Images folder '{images_folder}' not found!")
        return

    files = [f for f in os.listdir(images_folder) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    print(f"Found {len(files)} image files: {files}")

    for file in sorted(files):
        file_path = os.path.join(images_folder, file)
        text = extract_text(file_path)

        if not text:
            print("❌ NO TEXT EXTRACTED")
        elif len(text) < 50:
            print("⚠️  VERY LITTLE TEXT EXTRACTED")
        else:
            print("✅ TEXT EXTRACTED SUCCESSFULLY")

if __name__ == "__main__":
    main()