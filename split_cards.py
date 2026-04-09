from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass
from pathlib import Path

from PIL import Image


SOURCE_DIR = Path("assets/images")
OUTPUT_DIR = SOURCE_DIR / "cards"
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


def split_image(path: Path) -> int:
    with Image.open(path).convert("RGBA") as image:
        base_name = slugify(path.stem)
        written = 0

        for card_index, slot_box in enumerate(SLOT_BOXES, start=1):
            card = image.crop((slot_box.left, slot_box.top, slot_box.right + 1, slot_box.bottom + 1))
            if not has_meaningful_content(card):
                continue

            target_path = OUTPUT_DIR / f"{base_name}-card-{card_index:02d}.png"
            card.save(target_path)
            written += 1

    return written


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for existing_file in OUTPUT_DIR.glob("*.png"):
        existing_file.unlink()

    image_paths = sorted(
        path
        for path in SOURCE_DIR.glob("*.png")
        if path.is_file() and path.parent != OUTPUT_DIR
    )

    total_cards = 0
    for image_path in image_paths:
        written = split_image(image_path)
        total_cards += written
        print(f"{image_path.name}: wrote {written} card images")

    print(f"Total written: {total_cards}")


if __name__ == "__main__":
    main()
