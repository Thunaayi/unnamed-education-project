# Question Extraction Tool

This tool extracts exam questions from images (JPG, PNG, PDF) using OCR and structures them into JSON format.

## Setup

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Install Tesseract OCR:**
   - **Ubuntu/Debian:** `sudo apt-get install tesseract-ocr`
   - **macOS:** `brew install tesseract`
   - **Windows:** Download from [GitHub releases](https://github.com/UB-Mannheim/tesseract/wiki)

3. **Install poppler (for PDF processing):**
   - **Ubuntu/Debian:** `sudo apt-get install poppler-utils`
   - **macOS:** `brew install poppler`
   - **Windows:** Usually included with pdf2image

## Usage

1. **Place your images in the `images/` folder:**
   - Supported formats: JPG, PNG, PDF, BMP, TIFF
   - PDFs will be processed page by page

2. **Run the extraction script:**
   ```bash
   python extract_questions.py
   ```

3. **Check the output:**
   - Results saved to `extracted_questions.json`
   - Each question includes: question_text, marks, topic, difficulty, source, raw_text

## Command Line Options

```bash
python extract_questions.py --folder custom_images --output my_questions.json
```

- `--folder`: Specify custom images folder (default: images)
- `--output`: Specify output JSON file (default: extracted_questions.json)

## Output Format

```json
[
  {
    "question_text": "Extracted question text here...",
    "marks": 5,
    "topic": "Physics",
    "difficulty": "medium",
    "source": "exam_paper_2023.jpg",
    "raw_text": "Full extracted text from OCR..."
  }
]
```

## Customization

The `parse_question_text()` method contains basic parsing logic. You may need to customize it based on your specific question formats:

- **Marks extraction:** Currently looks for "marks: X" or "[X marks]"
- **Topic detection:** Searches for subject keywords
- **Difficulty:** Looks for easy/hard indicators

Modify the parsing logic in `extract_questions.py` to match your document formats.

## Troubleshooting

- **Low OCR accuracy:** Try preprocessing images (cleaner scans work better)
- **PDF errors:** Ensure poppler is installed
- **Tesseract not found:** Set the path in the script: `pytesseract.pytesseract.tesseract_cmd = r'/path/to/tesseract'`

## Example Workflow

1. Scan exam papers or take photos
2. Save images to `images/` folder
3. Run `python extract_questions.py`
4. Review `extracted_questions.json`
5. Manually clean up or adjust parsed data
6. Import into your database