import os

from app.ingest.parser import parse_pdf
from app.ingest.chunker import chunk_text
from app.ingest.table_extractor import extract_tables
from app.ingest.figure_extractor import extract_figures
from app.ingest.image_captioner import caption_image


TEMP_IMAGE_FOLDER = "app/ingest/temp_images"


def process_pdf(pdf_path):

    all_chunks = []

    parsed = parse_pdf(pdf_path)

    title = parsed["title"]

    # ---------- TEXT ----------
    text_chunks = chunk_text(parsed)
    for c in text_chunks:
        all_chunks.append({"text": c, "type": "text"})

    # ---------- TABLES ----------
    tables = extract_tables(pdf_path)

    for table_obj in tables:
        page_num = table_obj.get("page")
        captions_str = ""
        if page_num:
            page_data = next((p for p in parsed["pages"] if p["page"] == page_num), None)
            if page_data and page_data.get("figure_table_captions"):
                captions_str = "\n".join(page_data["figure_table_captions"])

        chunk = f"""
Paper Title: {title}
Page: {page_num}

Captions found on this page:
{captions_str}

Table Content:
{table_obj["text"]}
"""
        all_chunks.append({"text": chunk, "type": "table"})

    # ---------- FIGURES ----------
    images = extract_figures(pdf_path, TEMP_IMAGE_FOLDER)

    for img in images:
        page_num = img["page"]
        captions_str = ""
        page_data = next((p for p in parsed["pages"] if p["page"] == page_num), None)
        if page_data and page_data.get("figure_table_captions"):
            captions_str = "\n".join(page_data["figure_table_captions"])

        caption = caption_image(img["path"])

        chunk = f"""
Paper Title: {title}
Page: {page_num}

Captions found on this page:
{captions_str}

Figure Description (from image):
{caption}
"""
        all_chunks.append({"text": chunk, "type": "figure"})

    return all_chunks