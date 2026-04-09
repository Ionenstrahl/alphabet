from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass
from pathlib import Path

from PIL import Image


IMAGE_ROOT_DIR = Path("assets/images")
SOURCE_DIR = IMAGE_ROOT_DIR / "source-sheets"
OUTPUT_DIR = IMAGE_ROOT_DIR / "cards"
MIN_CONTENT_PIXELS = 2000


@dataclass(frozen=True)
class Box:
    left: int
    top: int
    right: int
    bottom: int

    @property
    def width(self) -> int:
        return self.right - self.left + 1

    @property
    def height(self) -> int:
        return self.bottom - self.top + 1


SLOT_BOXES = (
    Box(0, 0, 975, 1370),
    Box(1000, 0, 1990, 1370),
    Box(2015, 0, 3000, 1370),
    Box(3030, 0, 3999, 1370),
    Box(0, 1410, 975, 2788),
    Box(998, 1410, 1980, 2788),
    Box(2000, 1410, 3015, 2788),
    Box(3010, 1410, 3999, 2788),
)

CARD_NAMES_BY_SOURCE = {
    "karteikarten-fur-website": [
        "a_with_image",
        "b_with_image",
        "c_with_image",
        "d_with_image",
        "e_with_image",
        "f_with_image",
        "g_with_image",
        "h_with_image",
    ],
    "karteikarten-fur-website-1": [
        "i_with_image",
        "j_with_image",
        "k_with_image",
        "l_with_image",
        "m_with_image",
        "n_with_image",
        "o_with_image",
        "p_with_image",
    ],
    "karteikarten-fur-website-2": [
        "q_with_image",
        "r_with_image",
        "s_with_image",
        "t_with_image",
        "u_with_image",
        "v_with_image",
        "w_with_image",
        "x_with_image",
    ],
    "karteikarten-fur-website-3": [
        "y_with_image_yacht",
        "z_with_image",
        "au_with_image",
        "eu_with_image",
        "ei_with_image",
        "ch_with_image_dach",
        "sch_with_image",
        "sp_with_image",
    ],
    "karteikarten-fur-website-4": [
        "st_with_image",
        "ae_with_image",
        "oe_with_image",
        "ue_with_image",
        "ch_with_image_milch",
        None,
        None,
        None,
    ],
    "karteikarten-fur-website-5": [
        "a_without_image",
        "b_without_image",
        "c_without_image",
        "d_without_image",
        "e_without_image",
        "f_without_image",
        "g_without_image",
        "h_without_image",
    ],
    "karteikarten-fur-website-6": [
        "i_without_image",
        "j_without_image",
        "k_without_image",
        "l_without_image",
        "m_without_image",
        "n_without_image",
        "o_without_image",
        "p_without_image",
    ],
    "karteikarten-fur-website-7": [
        "q_without_image",
        "r_without_image",
        "s_without_image",
        "t_without_image",
        "u_without_image",
        "v_without_image",
        "w_without_image",
        "x_without_image",
    ],
    "karteikarten-fur-website-8": [
        "y_without_image",
        "z_without_image",
        "ae_without_image",
        "oe_without_image",
        "ue_without_image",
        "ei_without_image",
        "au_without_image",
        "eu_without_image",
    ],
    "karteikarten-fur-website-9": [
        "sch_without_image",
        "ch_without_image",
        "eszett_without_image",
        "sp_without_image",
        "st_without_image",
        "qu_without_image",
        None,
        None,
    ],
    "karteikarten-fur-website-10": [
        "y_with_image_yoga",
        "aeu_with_image",
        "eszett_with_image",
        "ie_with_image",
        None,
        None,
        "ie_without_image",
        "aeu_without_image",
    ],
}


def is_green(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    return a > 0 and g > 90 and r < 110 and b < 110 and g > r * 1.35 and g > b * 1.35


def is_near_white(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    return a > 0 and r > 240 and g > 240 and b > 240


def slugify(name: str) -> str:
    normalized = unicodedata.normalize("NFKD", name)
    ascii_name = normalized.encode("ascii", "ignore").decode("ascii")
    ascii_name = ascii_name.lower()
    ascii_name = re.sub(r"[^a-z0-9]+", "-", ascii_name).strip("-")
    return ascii_name or "image"


def has_meaningful_content(card: Image.Image) -> bool:
    pixels = card.load()
    width, height = card.size
    content_pixels = 0

    for y in range(height):
        for x in range(width):
            pixel = pixels[x, y]
            if is_green(pixel) or is_near_white(pixel):
                continue
            content_pixels += 1
            if content_pixels >= MIN_CONTENT_PIXELS:
                return True

    return False


def target_path_for(card_name: str) -> Path:
    cluster_dir = "with_image" if "_with_image" in card_name else "without_image"
    return OUTPUT_DIR / cluster_dir / f"{card_name}.png"


def split_image(path: Path) -> int:
    with Image.open(path).convert("RGBA") as image:
        base_name = slugify(path.stem)
        card_names = CARD_NAMES_BY_SOURCE[base_name]
        written = 0

        for card_name, slot_box in zip(card_names, SLOT_BOXES):
            if card_name is None:
                continue

            card = image.crop((slot_box.left, slot_box.top, slot_box.right + 1, slot_box.bottom + 1))
            if not has_meaningful_content(card):
                continue

            target_path = target_path_for(card_name)
            target_path.parent.mkdir(parents=True, exist_ok=True)
            card.save(target_path)
            written += 1

    return written


def main() -> None:
    if not SOURCE_DIR.exists() or not any(SOURCE_DIR.glob("*.png")):
        raise FileNotFoundError("No source sheets found in assets/images/source-sheets")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for existing_file in OUTPUT_DIR.rglob("*.png"):
        existing_file.unlink()

    image_paths = sorted(path for path in SOURCE_DIR.glob("*.png") if path.is_file())

    total_cards = 0
    for image_path in image_paths:
        written = split_image(image_path)
        total_cards += written
        print(f"{image_path.name}: wrote {written} card images")

    print(f"Total written: {total_cards}")


if __name__ == "__main__":
    main()
