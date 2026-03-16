import fitz
import re


FIGURE_TABLE_RE = re.compile(r"^(Figure|Fig\.|Table)\s*\d+", re.IGNORECASE)


def _extract_figure_table_captions(text: str) -> list[str]:
    """Pull out lines that look like figure/table captions (e.g., "Figure 1:")."""

    captions = []
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        if FIGURE_TABLE_RE.match(line):
            captions.append(line)
    return captions


def parse_pdf(pdf_path):

    doc = fitz.open(pdf_path)

    # Prefer the PDF metadata title when available.
    title = doc.metadata.get("title") if doc.metadata else None
    pages = []

    for page_num, page in enumerate(doc):

        # Use the block layout to preserve reading order (helps with multi-column papers).
        blocks = sorted(page.get_text("blocks"), key=lambda b: (round(b[1]), round(b[0])))
        text = "\n".join([b[4].strip() for b in blocks if b[4].strip()])

        if page_num == 0 and not title:
            # Use the first non-empty, non-numeric line as a fallback title.
            lines = [l.strip() for l in text.splitlines() if l.strip()]
            for line in lines:
                if len(line) > 5 and not re.fullmatch(r"\d+", line):
                    title = line
                    break

            # Fallback to the first line if no better candidate is found.
            if not title and lines:
                title = lines[0]

        captions = _extract_figure_table_captions(text)

        pages.append({
            "page": page_num + 1,
            "text": text,
            "figure_table_captions": captions,
        })

    return {
        "title": title,
        "pages": pages
    }