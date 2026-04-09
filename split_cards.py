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

CARD_OUTPUTS_BY_SOURCE = {
    "karteikarten-fur-website": [
        "with_image/a",
        "with_image/b",
        "with_image/c",
        "with_image/d",
        "with_image/e",
        "with_image/f",
        "with_image/g",
        "with_image/h",
    ],
    "karteikarten-fur-website-1": [
        "with_image/i",
        "with_image/j",
        "with_image/k",
        "with_image/l",
        "with_image/m",
        "with_image/n",
        "with_image/o",
        "with_image/p",
    ],
    "karteikarten-fur-website-2": [
        "with_image/q",
        "with_image/r",
        "with_image/s",
        "with_image/t",
        "with_image/u",
        "with_image/v",
        "with_image/w",
        "with_image/x",
    ],
    "karteikarten-fur-website-3": [
        "with_image/y_yacht",
        "with_image/z",
        "with_image/au",
        "with_image/eu",
        "with_image/ei",
        "with_image/ch_dach",
        "with_image/sch",
        "with_image/sp",
    ],
    "karteikarten-fur-website-4": [
        "with_image/st",
        "with_image/ae",
        "with_image/oe",
        "with_image/ue",
        "with_image/ch_milch",
        None,
        None,
        None,
    ],
    "karteikarten-fur-website-5": [
        "without_image/a",
        "without_image/b",
        "without_image/c",
        "without_image/d",
        "without_image/e",
        "without_image/f",
        "without_image/g",
        "without_image/h",
    ],
    "karteikarten-fur-website-6": [
        "without_image/i",
        "without_image/j",
        "without_image/k",
        "without_image/l",
        "without_image/m",
        "without_image/n",
        "without_image/o",
        "without_image/p",
    ],
    "karteikarten-fur-website-7": [
        "without_image/q",
        "without_image/r",
        "without_image/s",
        "without_image/t",
        "without_image/u",
        "without_image/v",
        "without_image/w",
        "without_image/x",
    ],
    "karteikarten-fur-website-8": [
        "without_image/y",
        "without_image/z",
        "without_image/ae",
        "without_image/oe",
        "without_image/ue",
        "without_image/ei",
        "without_image/au",
        "without_image/eu",
    ],
    "karteikarten-fur-website-9": [
        "without_image/sch",
        "without_image/ch",
        "without_image/eszett",
        "without_image/sp",
        "without_image/st",
        "without_image/qu",
        None,
        None,
    ],
    "karteikarten-fur-website-10": [
        "with_image/y_yoga",
        "with_image/aeu",
        "with_image/eszett",
        "with_image/ie",
        None,
        None,
        "without_image/ie",
        "without_image/aeu",
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


def target_path_for(relative_stem: str) -> Path:
    return OUTPUT_DIR / f"{relative_stem}.png"


def split_image(path: Path) -> int:
    with Image.open(path).convert("RGBA") as image:
        source_key = slugify(path.stem)
        outputs = CARD_OUTPUTS_BY_SOURCE[source_key]
        written = 0

        for relative_stem, slot_box in zip(outputs, SLOT_BOXES):
            if relative_stem is None:
                continue

            card = image.crop((slot_box.left, slot_box.top, slot_box.right + 1, slot_box.bottom + 1))
            if not has_meaningful_content(card):
                continue

            target_path = target_path_for(relative_stem)
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
