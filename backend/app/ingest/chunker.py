import re

CHUNK_SIZE = 500  # approximate maximum words per chunk


CAPTION_RE = re.compile(r"^(Figure|Fig\.|Table)\s*\d+", re.IGNORECASE)


def _is_caption_line(text: str) -> bool:
    return bool(CAPTION_RE.match(text.strip()))


def _split_into_paragraphs(text: str) -> list[str]:
    """Split text into paragraph-like blocks."""

    raw_paragraphs = re.split(r"\n\s*\n", text)

    clean_paragraphs = []
    for p in raw_paragraphs:
        normalized = re.sub(r"\s+", " ", p).strip()
        if normalized:
            clean_paragraphs.append(normalized)

    return clean_paragraphs


def _chunk_text(text: str, max_words: int) -> list[str]:
    words = text.split()
    if len(words) <= max_words:
        return [text]

    chunks = []
    for i in range(0, len(words), max_words):
        chunks.append(" ".join(words[i : i + max_words]))
    return chunks


def chunk_text(parsed_pdf):

    chunks = []

    title = parsed_pdf["title"]

    for page in parsed_pdf["pages"]:

        text = page["text"]
        page_number = page["page"]

        paragraphs = _split_into_paragraphs(text)

        for para in paragraphs:

            # Skip extremely short fragments (headers/footers/noise).
            # Keep short captions (e.g., 'Table 1' or 'Figure 2') by using a smaller threshold.
            if len(para) < 20 and not _is_caption_line(para):
                continue

            for subchunk in _chunk_text(para, CHUNK_SIZE):
                chunk = f"""
Paper Title: {title}
Page: {page_number}

Content:
{subchunk}
"""

                chunks.append(chunk)

    return chunks