"""
BSEK 9th Grade Math — Structured Exam Question Extractor
=========================================================
Parses BSEK exam paper images (one page per JPG) into a fully structured
JSON format:

    Year → Metadata → Sections (A / B / C) → Individual Questions

Filename convention:  BSEK-9th-{YEAR}-p{PAGE}.jpg
Output:               structured_questions.json

Key design decisions
────────────────────
• OCR output is normalised before section detection so that mid-word
  spaces inserted by Tesseract (e.g. "MU LTIPLE") don't break patterns.
• Two MCQ option formats are handled:
    2024 style  →  options prefixed with  *option_text
    2025 style  →  options labelled       (A) opt  (B) opt  …
• Section detection uses many overlapping patterns + a structural
  fallback (look for roman-numeral MCQs near the top of the text).
"""

import os
import json
import re
import argparse
import pytesseract
from PIL import Image
import cv2
import numpy as np
from typing import Dict, List, Optional, Tuple, Any
from collections import defaultdict


# ── Roman-numeral → integer map (used for MCQ ordering) ───────────────────────
ROMAN_TO_INT: Dict[str, int] = {
    "i": 1,   "ii": 2,  "iii": 3,  "iv": 4,   "v": 5,
    "vi": 6,  "vii": 7, "viii": 8, "ix": 9,   "x": 10,
    "xi": 11, "xii": 12,"xiii": 13,"xiv": 14,  "xv": 15,
    "xvi": 16,"xvii": 17,"xviii": 18,"xix": 19, "xx": 20,
}

# ── Topic keyword patterns ─────────────────────────────────────────────────────
TOPIC_PATTERNS: List[Tuple[str, List[str]]] = [
    ("Logarithms",          [r"log", r"logarithm", r"characteristic", r"mantissa", r"antilog"]),
    ("Complex Numbers",     [r"conjugate", r"complex", r"z_?1|z_?2", r"\bi\b.*real", r"argand"]),
    ("Sets & HCF/LCM",      [r"h\.?c\.?f", r"l\.?c\.?m", r"union", r"intersection", r"subset"]),
    ("Absolute Value",      [r"\|.*?\|", r"solution set.*\|", r"modulus"]),
    ("Polynomials",         [r"polynomial", r"factor\s+theorem", r"perfect square", r"degree of"]),
    ("Algebra",             [r"factori[sz]e", r"simultaneous", r"quadratic\s*formula",
                             r"complete\s+square", r"expression"]),
    ("Geometry",            [r"triangle", r"congruent", r"parallelogram", r"bisector",
                             r"altitude", r"concurrent", r"hypotenuse", r"right angle",
                             r"right angled", r"isosceles", r"equilateral", r"scalene",
                             r"apollonius", r"quadrilateral"]),
    ("Coordinate Geometry", [r"quadrant", r"coordinate", r"mid.?point", r"radius",
                              r"circle", r"collinear", r"distance formula", r"located in"]),
    ("Trigonometry",        [r"\bsine?\b", r"\bcosine?\b", r"\btangent\b", r"trig"]),
    ("Statistics",          [r"mean|median|mode|variance|standard deviation", r"frequency"]),
    ("Matrices",            [r"matrix|matrices|determinant|singular"]),
    ("Arithmetic",          [r"commutative", r"associative", r"distributive",
                             r"multiplicative inverse", r"additive inverse", r"property"]),
    ("Number System",       [r"real part", r"imaginary", r"rational", r"irrational",
                             r"additive inverse", r"scientific notation"]),
]


# ══════════════════════════════════════════════════════════════════════════════
class StructuredExamExtractor:
    """End-to-end pipeline: images → structured JSON, one entry per exam year."""

    def __init__(self, images_folder: str = "images"):
        self.images_folder = images_folder
        self.output_file = "structured_questions.json"

    # ── 1. OCR ────────────────────────────────────────────────────────────────

    def preprocess_image(self, image_path: str) -> Image.Image:
        """Upscale + adaptive-threshold a scanned exam page for Tesseract."""
        img = cv2.imread(image_path)
        if img is None:
            raise FileNotFoundError(f"Cannot read: {image_path}")

        h, w = img.shape[:2]
        if w < 1400:
            img = cv2.resize(img, None, fx=1400 / w, fy=1400 / w,
                             interpolation=cv2.INTER_CUBIC)

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        denoised = cv2.fastNlMeansDenoising(gray, h=10)
        thresh = cv2.adaptiveThreshold(
            denoised, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY, 15, 4,
        )
        return Image.fromarray(thresh)

    def ocr_image(self, image_path: str) -> str:
        """Run Tesseract OCR (PSM 4 = single column) on one image."""
        try:
            processed = self.preprocess_image(image_path)
            config = "--psm 4 --oem 3"
            text = pytesseract.image_to_string(processed, lang="eng", config=config)
            return text.strip()
        except Exception as exc:
            print(f"    ⚠️  OCR error ({image_path}): {exc}")
            return ""

    # ── 2. TEXT NORMALISATION ─────────────────────────────────────────────────

    @staticmethod
    def normalise(text: str) -> str:
        """
        Collapse mid-word spaces, unify quote/dash variants, lower-case.
        This is applied only for *pattern matching*, not for storing the text.

        Example:  "MU LTIPLE CHOICE" → "multiple choice"
                  "SHORT- ANSWER"    → "short-answer"
                  "\u201cA\u201d"   → '"a"'
        """
        # Unify fancy quotes/dashes
        text = text.replace("\u201c", '"').replace("\u201d", '"')
        text = text.replace("\u2018", "'").replace("\u2019", "'")
        text = text.replace("\u2013", "-").replace("\u2014", "-")

        # Remove noise characters that Tesseract injects for non-latin content
        text = re.sub(r"[^\x00-\x7F]", " ", text)

        # Lower-case
        text = text.lower()

        # Collapse multiple spaces to one
        text = re.sub(r"[ \t]+", " ", text)

        # Merge single-char 'broken' words (e.g. "m u l t i p l e" → "multiple")
        # Strategy: if a sequence of single chars separated by spaces is 4+ long,
        # join them.  This handles OCR splitting like "M U L T I P L E".
        def _rejoin(m: re.Match) -> str:
            letters = m.group(0).split()
            if len(letters) >= 4:
                return "".join(letters)
            return m.group(0)
        text = re.sub(r"(?<!\w)([a-z] ){3,}[a-z](?!\w)", _rejoin, text)

        return text

    # ── 3. FILENAME PARSING ───────────────────────────────────────────────────

    @staticmethod
    def parse_filename(filename: str) -> Optional[Tuple[int, int]]:
        """'BSEK-9th-2024-p2.jpg' → (2024, 2)  or  None."""
        m = re.match(
            r"BSEK-9th-(\d{4})-p(\d+)\.(jpg|jpeg|png|bmp|tiff?)$",
            filename, re.IGNORECASE,
        )
        return (int(m.group(1)), int(m.group(2))) if m else None

    # ── 4. EXAM METADATA ──────────────────────────────────────────────────────

    @staticmethod
    def extract_metadata(text: str, year: int) -> Dict[str, Any]:
        """Extract total marks, time, group from raw OCR text."""
        meta: Dict[str, Any] = {
            "year": year,
            "subject": "Mathematics",
            "board": "BSEK",
            "grade": 9,
            "group": "Science",
            "total_marks": 75,
            "time_hours": 3,
        }
        m = re.search(r"max\.?\s*marks?:?\s*(\d+)", text, re.IGNORECASE)
        if m:
            meta["total_marks"] = int(m.group(1))
        m = re.search(r"time:?\s*(\d+)\s*hour", text, re.IGNORECASE)
        if m:
            meta["time_hours"] = int(m.group(1))
        if re.search(r"arts?\s*group|humanities", text, re.IGNORECASE):
            meta["group"] = "Arts"
        return meta

    # ── 5. SECTION DETECTION ─────────────────────────────────────────────────
    #
    # We search for section boundaries in the *normalised* text.
    # Using many overlapping patterns to survive heavy OCR noise.

    SECTION_PATTERNS: Dict[str, List[str]] = {
        "A": [
            # "SECTION "A" MULTIPLE CHOICE QUESTIONS"
            r'section\s*"?a"?\s*.*?multiple',
            r'section\s*"?a"?',
            r'multiple\s*c[h]?[0o]ice\s*q',
            r'multiple\s*choice',
            r'\bmcq',
            # 2025 bilingual header contains this pattern
            r'multiple\s*c\d\s*\d\s*\d\s*\d\s*q',  # "C1 0:08 Q"
            r'compulsory',
        ],
        "B": [
            r'section\s*"?b"?\s*.*?short',
            r'section\s*"?b"?',
            r'short[- ]*answer\s*q',
            r'answer\s*any\s*six',
            r'answer\s*any\s*\(?\s*6\s*\)?',
            # 2025 OCR mangled: "seeTion*g" → normalise → "seetiong"
            # But also catches: "section b"
            r'short[- ]*answer',
            r'attempt\s*any\s*six',
        ],
        "C": [
            r'section\s*"?c"?\s*.*?detail',
            r'section\s*"?c"?',
            r'detailed[- ]*answer',
            r'descriptive[- ]*answer',
            r'attempt\s*any\s*three',
            r'attempt\s*any\s*\(?\s*3\s*\)?',
        ],
    }

    def find_section_positions(self, raw_text: str) -> Dict[str, int]:
        """
        Search normalised text for section boundaries, but return positions
        in the *original* raw text (by mapping character offsets).
        """
        norm = self.normalise(raw_text)

        # Build a char-offset map: norm[i] roughly corresponds to raw[i]
        # (normalisation changes chars but not length much; we use a simpler
        # approach: search in norm and use the found position directly in raw.)
        positions: Dict[str, int] = {}
        for letter, patterns in self.SECTION_PATTERNS.items():
            for pat in patterns:
                m = re.search(pat, norm)
                if m:
                    positions[letter] = m.start()
                    break

        # ── Structural fallback for Section A ─────────────────────────────────
        # If we didn't find Section A but there are roman-numeral MCQ markers
        # in the first 30 % of the text, treat the very start as Section A.
        if "A" not in positions:
            first_third = raw_text[: len(raw_text) // 3]
            if re.search(r"\([ivx]{1,6}\w{0,3}\)", first_third, re.IGNORECASE):
                positions["A"] = 0

        return positions

    def split_into_sections(self, full_text: str) -> Dict[str, str]:
        """Slice full exam text into per-section strings."""
        positions = self.find_section_positions(full_text)
        if not positions:
            return {"raw": full_text}

        ordered = sorted(positions.items(), key=lambda x: x[1])
        sections: Dict[str, str] = {}
        for idx, (letter, start) in enumerate(ordered):
            end = ordered[idx + 1][1] if idx + 1 < len(ordered) else len(full_text)
            sections[letter] = full_text[start:end].strip()
        return sections

    # ── 6. MCQ PARSING ────────────────────────────────────────────────────────

    # Matches sub-question labels in both formats:
    #   (i)  (xiv)  (aii)  (xivpx   ← OCR noise variants
    MCQ_SPLIT_RE = re.compile(r"\(([ivxIVX]{1,6})\w{0,3}\)\s*", re.IGNORECASE)

    # Instruction sub-clauses in the NOTE block use (i)(ii)(iii) too —
    # these keywords identify them so we can filter them out.
    _INSTRUCTION_KEYWORDS = [
        "attempt all", "do not copy", "each question carries",
        "write only the answer", "according to the question paper",
        "against the proper", "all questions carry", "not copy down",
    ]

    def _is_instruction(self, text: str) -> bool:
        lower = text.lower()
        return any(kw in lower for kw in self._INSTRUCTION_KEYWORDS)

    def parse_section_a(self, text: str) -> List[Dict]:
        """Split Section A text into individual MCQ question dicts."""
        parts = self.MCQ_SPLIT_RE.split(text)
        # parts = [preamble, 'i', body, 'ii', body, …]

        raw_questions: List[Dict] = []
        i = 1
        while i < len(parts) - 1:
            label = parts[i].lower().strip()
            body = parts[i + 1] if i + 1 < len(parts) else ""
            if label in ROMAN_TO_INT:
                q = self._parse_single_mcq(label, body)
                if q and not self._is_instruction(q["question_text"]):
                    raw_questions.append(q)
            i += 2

        # Deduplicate: NOTE block reuses (i)(ii)(iii), real MCQs also use them.
        # For each numeral, keep the entry with the most options (real questions
        # always have options; instructions never do).
        seen: Dict[str, Dict] = {}
        for q in raw_questions:
            num = q["number"]
            prev = seen.get(num)
            if prev is None or len(q.get("options", [])) > len(prev.get("options", [])):
                seen[num] = q

        return sorted(seen.values(), key=lambda x: x["order"])

    def _parse_single_mcq(self, label: str, body: str) -> Optional[Dict]:
        """
        Convert one MCQ body string into a structured dict.

        Handles both formats seen in the papers:

          2024  →  options separated by  *  (star-prefix format)
                   correct answer marked with  ✓  or  V  at end of option

          2025  →  options labelled  (A)  (B)  (C)  (D)
                   correct answer marked inline with  ✓  or at line-end V
        """
        body = body.strip()
        if not body:
            return None

        question_text = ""
        options: List[str] = []
        correct_answer: Optional[str] = None

        # ── 2025 format: (A) … (B) … (C) … (D) … ────────────────────────────
        if re.search(r"\([A-D]\)", body):
            sub = re.split(r"\(([A-D])\)\s*", body)
            # sub = [question_text, 'A', opt_body, 'B', opt_body, …]
            question_text = sub[0].strip()
            j = 1
            while j < len(sub) - 1:
                opt_body = sub[j + 1] if j + 1 < len(sub) else ""
                # Clean up – strip trailing option label or next question bleed
                opt_body = opt_body.split("\n")[0].strip()
                is_correct = bool(re.search(r"[✓√]\s*$|\bv\s*$|\bV\s*$", opt_body))
                opt_clean = re.sub(r"\s*[✓√Vv]\s*$", "", opt_body).strip()
                # Also strip OCR artefacts like trailing letters/brackets
                opt_clean = re.sub(r"\s*\[[A-D]\]\s*$", "", opt_clean).strip()
                if opt_clean:
                    options.append(opt_clean)
                    if is_correct:
                        correct_answer = opt_clean
                j += 2

        # ── 2024 format: options prefixed with * ─────────────────────────────
        else:
            star_parts = re.split(r"(?<!\w)\*(?!\*)", body)
            if len(star_parts) >= 2:
                question_text = star_parts[0].strip()
                for opt_raw in star_parts[1:]:
                    opt_raw = opt_raw.strip()
                    # Correct answer markers seen in BSEK OCR output:
                    #   ✓ √  — actual checkmark
                    #   V¥   — OCR artefact for ✓ (most common in 2024)
                    #   ¥    — yen sign misread as checkmark
                    #   V    — 'V' at end of option text
                    #   "    — closing smart-quote OCR rendering of tick
                    is_correct = bool(re.search(
                        r'[✓√¥]\s*$|V¥\s*$|\bV\s*$|["\u201d]\s*$', opt_raw
                    ))
                    opt_clean = re.sub(r'\s*[✓√V¥"\u201d]+\s*$', "", opt_raw).strip()
                    opt_clean = opt_clean.split("\n")[0].strip()
                    if opt_clean:
                        options.append(opt_clean)
                        if is_correct:
                            correct_answer = opt_clean
            else:
                # No option markers found — keep whole body as question text
                question_text = body

        # Clean up whitespace/newlines in question text
        question_text = re.sub(r"\s+", " ", question_text).strip()

        return {
            "number": label,
            "order": ROMAN_TO_INT.get(label, 0),
            "question_text": question_text,
            "options": options,
            "correct_answer": correct_answer,
            "marks": 1,
            "topic": self._infer_topic(question_text),
        }

    # ── 7. SECTION B / C PARSING ─────────────────────────────────────────────

    def parse_written_section(self, text: str, section: str) -> List[Dict]:
        """
        Split Section B (short answer) or C (detailed answer) text into
        individually numbered question dicts.

        BSEK numbering:  Section B → Q2–Q11 ,  Section C → Q12–Q16
        """
        # Allow up to 3 noise characters (e.g. "; " or '"') before the number
        # so that OCR artefacts at line-starts don't swallow questions.
        pattern = re.compile(
            r'(?:^|\n)[^a-zA-Z\d\n]{0,4}(\d{1,2})[.,]\s+(.+?)'
            r'(?=\n[^a-zA-Z\d\n]{0,4}\d{1,2}[.,]\s+|\Z)',
            re.DOTALL,
        )
        questions: List[Dict] = []

        for m in pattern.finditer(text):
            num = int(m.group(1))
            # Filter by expected question number range when section is known.
            # section=None means "no filter" (used when B+C text is combined).
            if section == "B" and not (2 <= num <= 11):
                continue
            if section == "C" and not (12 <= num <= 20):
                continue
            # Skip implausibly small numbers that are likely OCR noise (page #s etc.)
            if num < 2:
                continue
            raw = re.sub(r"\s+", " ", m.group(2)).strip()

            or_parts = re.split(r"\bOR\b", raw, flags=re.IGNORECASE)
            primary = or_parts[0].strip()
            alternative = or_parts[1].strip() if len(or_parts) > 1 else None

            marks_per_q = {"B": 5, "C": 10}.get(section, 5)

            questions.append({
                "number": num,
                "question_text": primary,
                "marks": marks_per_q,
                "topic": self._infer_topic(primary),
                "has_alternative": alternative is not None,
                "alternative_text": alternative,
            })

        return questions

    # ── 8. TOPIC INFERENCE ────────────────────────────────────────────────────

    @staticmethod
    def _infer_topic(text: str) -> str:
        """Return the best-matching topic string, or '' if none found."""
        lower = text.lower()
        for topic, patterns in TOPIC_PATTERNS:
            for pat in patterns:
                if re.search(pat, lower):
                    return topic
        return ""

    # ── 9. MAIN ORCHESTRATION ─────────────────────────────────────────────────

    def process_all(self) -> List[Dict]:
        """
        1. Discover images, group by year.
        2. OCR each page in page order.
        3. Parse each year's text into structured sections.
        4. Return list of structured exam dicts.
        """
        year_pages: Dict[int, Dict[int, str]] = defaultdict(dict)
        valid_exts = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif"}

        print(f"\n🔎  Scanning: {self.images_folder}\n")
        for fname in sorted(os.listdir(self.images_folder)):
            fpath = os.path.join(self.images_folder, fname)
            if not os.path.isfile(fpath):
                continue
            if os.path.splitext(fname)[1].lower() not in valid_exts:
                continue

            parsed = self.parse_filename(fname)
            if parsed:
                year, page = parsed
                year_pages[year][page] = fpath
                print(f"  ✔  {fname}  →  year={year}  page={page}")
            else:
                print(f"  ⚠️  Skipping (unexpected filename): {fname}")

        if not year_pages:
            print("\n❌  No valid images found. "
                  "Filenames must match BSEK-9th-{YEAR}-p{N}.jpg")
            return []

        exams: List[Dict] = []
        for year in sorted(year_pages):
            pages = year_pages[year]
            print(f"\n{'━'*54}")
            print(f"  📋  Year {year}  —  {len(pages)} page(s) found")
            print(f"{'━'*54}")
            exams.append(self._process_exam(year, pages))
        return exams

    def _process_exam(self, year: int, pages: Dict[int, str]) -> Dict:
        """OCR all pages for one year, then parse into structured sections."""

        # ── OCR ───────────────────────────────────────────────────────────────
        page_texts: Dict[int, str] = {}
        for pg in sorted(pages):
            path = pages[pg]
            print(f"\n  🔍  OCR page {pg}: {os.path.basename(path)}")
            text = self.ocr_image(path)
            page_texts[pg] = text
            preview = text[:80].replace("\n", " ")
            print(f"      {len(text):>5} chars  →  \"{preview}…\"")

        # Concatenate pages with a visible sentinel (helps Section C not bleed)
        full_text = "\n\n[PAGE BREAK]\n\n".join(
            page_texts[p] for p in sorted(page_texts)
        )

        # ── Metadata ──────────────────────────────────────────────────────────
        meta = self.extract_metadata(full_text, year)
        meta["source_files"] = [os.path.basename(pages[p]) for p in sorted(pages)]
        meta["pages_found"] = sorted(pages.keys())

        if pages:
            max_pg = max(pages.keys())
            missing = [p for p in range(1, max_pg + 1) if p not in pages]
            if missing:
                meta["missing_pages"] = missing
                print(f"\n  ⚠️   Missing pages: {missing}")

        # ── Section splitting ─────────────────────────────────────────────────
        section_texts = self.split_into_sections(full_text)
        print(f"\n  📂  Sections detected: {list(section_texts.keys())}")

        # ── Parse sections ────────────────────────────────────────────────────
        sections: Dict[str, Any] = {}

        if "A" in section_texts:
            mcqs = self.parse_section_a(section_texts["A"])
            sections["A"] = {
                "type": "mcq",
                "label": "Multiple Choice Questions",
                "marks": 15,
                "instruction": "Attempt all questions. Each carries 1 mark.",
                "questions_count": len(mcqs),
                "questions": mcqs,
            }
            print(f"  ✅  Section A → {len(mcqs)} MCQs")

        if "B" in section_texts:
            c_missing = "C" not in section_texts
            # When Section C has no separate text block, parse the combined B+C
            # text with section=None (no number filter) then split by Q number.
            parse_sec = None if c_missing else "B"
            all_written = self.parse_written_section(section_texts["B"], parse_sec)

            if c_missing:
                short_qs  = [q for q in all_written if q["number"] <= 11]
                detail_qs = [q for q in all_written if q["number"] >= 12]
                # Fix marks for each bucket
                for q in short_qs:  q["marks"] = 5
                for q in detail_qs: q["marks"] = 10
            else:
                short_qs  = all_written
                detail_qs = []

            sections["B"] = {
                "type": "short_answer",
                "label": "Short Answer Questions",
                "marks": 30,
                "instruction": "Answer any SIX (6) questions. All carry equal marks.",
                "questions_count": len(short_qs),
                "questions": short_qs,
            }
            print(f"  ✅  Section B → {len(short_qs)} short-answer questions")

            if detail_qs and "C" not in section_texts:
                # Re-parse with section='C' so marks are 10 per question
                for q in detail_qs:
                    q["marks"] = 10
                sections["C"] = {
                    "type": "detailed_answer",
                    "label": "Detailed Answer Questions",
                    "marks": 30,
                    "instruction": "Attempt any THREE (3) questions. All carry equal marks.",
                    "questions_count": len(detail_qs),
                    "questions": detail_qs,
                    "note": "Section boundary inferred from question numbering (Q12+).",
                }
                print(f"  ✅  Section C → {len(detail_qs)} detailed questions (inferred)")

        if "C" in section_texts:
            detailed_qs = self.parse_written_section(section_texts["C"], "C")
            sections["C"] = {
                "type": "detailed_answer",
                "label": "Detailed Answer Questions",
                "marks": 30,
                "instruction": "Attempt any THREE (3) questions. All carry equal marks.",
                "questions_count": len(detailed_qs),
                "questions": detailed_qs,
            }
            print(f"  ✅  Section C → {len(detailed_qs)} detailed questions")

        if "raw" in section_texts:
            sections["raw"] = {
                "type": "unparsed",
                "note": "Section boundaries could not be detected — manual review needed.",
                "raw_text": section_texts["raw"],
            }
            print("  ⚠️   Could not detect section boundaries → stored as raw text.")

        meta["sections"] = sections
        return meta

    # ── 10. OUTPUT ────────────────────────────────────────────────────────────

    def save(self, exams: List[Dict], output_file: Optional[str] = None) -> None:
        out = output_file or self.output_file
        with open(out, "w", encoding="utf-8") as f:
            json.dump(exams, f, indent=2, ensure_ascii=False)
        print(f"\n💾  Saved → {out}  ({len(exams)} exam year(s))")


# ══════════════════════════════════════════════════════════════════════════════
def main() -> None:
    parser = argparse.ArgumentParser(
        description="BSEK 9th Grade — Structured Exam Question Extractor"
    )
    parser.add_argument("--folder", default="images",
                        help="Folder containing exam page images (default: images/)")
    parser.add_argument("--output", default="structured_questions.json",
                        help="Output JSON file (default: structured_questions.json)")
    args = parser.parse_args()

    print("╔══════════════════════════════════════════════════════╗")
    print("║   BSEK 9th Grade — Structured Question Extractor     ║")
    print("╚══════════════════════════════════════════════════════╝")

    extractor = StructuredExamExtractor(args.folder)
    extractor.output_file = args.output

    exams = extractor.process_all()
    if not exams:
        return

    extractor.save(exams)

    print("\n" + "━" * 54)
    print("  📊  Final summary")
    print("━" * 54)
    for exam in exams:
        year = exam.get("year", "?")
        sections = exam.get("sections", {})
        missing = exam.get("missing_pages", [])
        total_q = sum(
            s.get("questions_count", 0)
            for s in sections.values()
            if isinstance(s, dict) and s.get("type") != "unparsed"
        )
        row = f"  {year}: {total_q} questions  |  sections: {list(sections.keys())}"
        if missing:
            row += f"  |  ⚠️  missing pages: {missing}"
        print(row)
    print()


if __name__ == "__main__":
    main()