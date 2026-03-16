import camelot
import pdfplumber


def _tables_from_camelot(pdf_path, flavor: str) -> list[str]:
    try:
        tables = camelot.read_pdf(pdf_path, pages="all", flavor=flavor)
    except Exception:
        return []

    return [{"page": int(t.page), "text": t.df.to_markdown()} for t in tables if not t.df.empty and t.df.shape[0] >= 2 and t.df.shape[1] >= 2]


def _tables_from_pdfplumber(pdf_path) -> list[dict]:
    table_texts = []
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page_idx, page in enumerate(pdf.pages, start=1):
                for table in page.extract_tables():
                    if not table:
                        continue
                    lines = ["\t".join([str(cell) if cell is not None else "" for cell in row]) for row in table]
                    table_texts.append({
                        "page": page_idx,
                        "text": "\n".join(lines)
                    })
    except Exception:
        pass

    return table_texts


def extract_tables(pdf_path):
    # Try Camelot first (stream -> lattice) as it often preserves table structure.
    for flavor in ("lattice", "stream"):
        tables = _tables_from_camelot(pdf_path, flavor)
        if tables:
            return tables

    # Fallback to pdfplumber if Camelot fails.
    return _tables_from_pdfplumber(pdf_path)
