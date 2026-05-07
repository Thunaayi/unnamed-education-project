#!/usr/bin/env python3
"""
Test script to verify all OCR dependencies are installed correctly.
"""

try:
    import pytesseract
    print("✓ pytesseract imported successfully")
except ImportError as e:
    print(f"✗ pytesseract import failed: {e}")

try:
    import cv2
    print("✓ opencv-python imported successfully")
except ImportError as e:
    print(f"✗ opencv-python import failed: {e}")

try:
    from PIL import Image
    print("✓ Pillow imported successfully")
except ImportError as e:
    print(f"✗ Pillow import failed: {e}")

try:
    import pdf2image
    print("✓ pdf2image imported successfully")
except ImportError as e:
    print(f"✗ pdf2image import failed: {e}")

try:
    import numpy as np
    print("✓ numpy imported successfully")
except ImportError as e:
    print(f"✗ numpy import failed: {e}")

# Test Tesseract installation
try:
    import subprocess
    result = subprocess.run(['which', 'tesseract'], capture_output=True, text=True)
    if result.returncode == 0:
        print("✓ Tesseract OCR found at:", result.stdout.strip())
    else:
        print("✗ Tesseract OCR not found")
        print("  Install with: sudo apt install tesseract-ocr")
except Exception as e:
    print(f"✗ Error checking Tesseract: {e}")

print("\nIf all checks pass, you're ready to run the OCR script!")
print("Usage: python extract_questions.py")