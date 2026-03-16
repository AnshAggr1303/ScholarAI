import fitz
import os


def extract_figures(pdf_path, output_folder):

    os.makedirs(output_folder, exist_ok=True)

    doc = fitz.open(pdf_path)
    image_paths = []

    for page_index in range(len(doc)):

        page = doc[page_index]
        images = page.get_images(full=True)

        for img_index, img in enumerate(images):

            xref = img[0]
            base_image = doc.extract_image(xref)

            # Filter out tiny images (logos, icons, watermarks)
            if base_image["width"] < 150 or base_image["height"] < 150:
                continue

            image_bytes = base_image["image"]

            file_path = f"{output_folder}/page{page_index}_img{img_index}.png"

            with open(file_path, "wb") as f:
                f.write(image_bytes)

            image_paths.append({
                "page": page_index + 1,
                "path": file_path
            })

    return image_paths