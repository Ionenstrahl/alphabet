from __future__ import annotations

import shutil
import unicodedata
from pathlib import Path


IMAGE_ROOT_DIR = Path("assets/images")
SOURCE_SHEETS_DIR = IMAGE_ROOT_DIR / "source-sheets"
CARD_ROOT_DIR = IMAGE_ROOT_DIR / "cards"
SOUND_ROOT_DIR = Path("assets/sounds")

SOUND_NAME_MAP = {
    "a": "without_image/a",
    "apfel": "with_image/a",
    "ae": "without_image/ae",
    "aepfel": "with_image/ae",
    "aeu": "without_image/aeu",
    "haeuser": "with_image/aeu",
    "au": "without_image/au",
    "auto": "with_image/au",
    "b": "without_image/b",
    "baum": "with_image/b",
    "brief": "with_image/ie",
    "c": "without_image/c",
    "ch": "without_image/ch",
    "computer": "with_image/c",
    "d": "without_image/d",
    "dach": "with_image/ch_dach",
    "dorf": "with_image/d",
    "e": "without_image/e",
    "ei": "without_image/ei",
    "eimer": "with_image/ei",
    "elefant": "with_image/e",
    "es": "without_image/s",
    "eu": "without_image/eu",
    "euro": "with_image/eu",
    "f": "without_image/f",
    "fisch": "with_image/f",
    "g": "without_image/g",
    "geld": "with_image/g",
    "h": "without_image/h",
    "haus": "with_image/h",
    "haeuser": "with_image/aeu",
    "hexe": "with_image/x",
    "i": "without_image/i",
    "ie": "without_image/ie",
    "insel": "with_image/i",
    "j": "without_image/j",
    "junge": "with_image/j",
    "k": "without_image/k",
    "katze": "with_image/k",
    "l": "without_image/l",
    "lampe": "with_image/l",
    "m": "without_image/m",
    "maus": "with_image/m",
    "milch": "with_image/ch_milch",
    "n": "without_image/n",
    "nase": "with_image/n",
    "o": "without_image/o",
    "oe": "without_image/oe",
    "oel": "with_image/oe",
    "ohr": "with_image/o",
    "p": "without_image/p",
    "pass": "with_image/p",
    "q": "without_image/q",
    "qu": "without_image/qu",
    "qualle": "with_image/q",
    "r": "without_image/r",
    "rose": "with_image/r",
    "s": "without_image/s",
    "sch": "without_image/sch",
    "schokolade": "with_image/sch",
    "sonne": "with_image/s",
    "sp": "without_image/sp",
    "spinne": "with_image/sp",
    "ss": "without_image/eszett",
    "st": "without_image/st",
    "stern": "with_image/st",
    "strasse": "with_image/eszett",
    "t": "without_image/t",
    "tisch": "with_image/t",
    "tuer": "with_image/ue",
    "u": "without_image/u",
    "ue": "without_image/ue",
    "uhr": "with_image/u",
    "v": "without_image/v",
    "vogel": "with_image/v",
    "w": "without_image/w",
    "wasser": "with_image/w",
    "x": "without_image/x",
    "y": "without_image/y",
    "yacht": "with_image/y_yacht",
    "yoga": "with_image/y_yoga",
    "z": "without_image/z",
    "zitrone": "with_image/z",
}


def ascii_slug(value: str) -> str:
    replacements = {
        "\u00c4": "Ae",
        "\u00e4": "ae",
        "\u00d6": "Oe",
        "\u00f6": "oe",
        "\u00dc": "Ue",
        "\u00fc": "ue",
        "\u1e9e": "ss",
        "\u00df": "ss",
    }
    normalized = unicodedata.normalize("NFC", value)
    for source, target in replacements.items():
        normalized = normalized.replace(source, target)
    normalized = unicodedata.normalize("NFKD", normalized)
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
    return "".join(character for character in ascii_value.lower() if character.isalnum())


def simplify_clustered_name(stem: str) -> str:
    stem = stem.replace("_with_image_", "_")
    stem = stem.replace("_with_image", "")
    stem = stem.replace("_without_image", "")
    return stem


def move_source_sheets() -> int:
    source_paths = list(IMAGE_ROOT_DIR.glob("Karteikarten f\u00fcr Website*.png"))
    if not source_paths:
        return 0

    SOURCE_SHEETS_DIR.mkdir(parents=True, exist_ok=True)
    moved = 0

    for source_path in source_paths:
        target_path = SOURCE_SHEETS_DIR / source_path.name
        if source_path.resolve() == target_path.resolve():
            continue
        if target_path.exists():
            source_path.unlink()
        else:
            shutil.move(str(source_path), str(target_path))
        moved += 1

    return moved


def target_image_path(cluster_name: str, stem: str) -> Path:
    return CARD_ROOT_DIR / cluster_name / f"{simplify_clustered_name(stem)}.png"


def normalize_images() -> int:
    moved = 0
    cluster_dirs = (CARD_ROOT_DIR / "with_image", CARD_ROOT_DIR / "without_image")
    for cluster_dir in cluster_dirs:
        cluster_dir.mkdir(parents=True, exist_ok=True)

    flat_images = [path for path in CARD_ROOT_DIR.glob("*.png") if path.is_file()]
    clustered_images = [path for cluster_dir in cluster_dirs for path in cluster_dir.glob("*.png") if path.is_file()]
    image_paths = flat_images + clustered_images
    if not image_paths:
        raise RuntimeError("No card images found in assets/images/cards")

    for image_path in image_paths:
        if image_path.parent == CARD_ROOT_DIR:
            if "_with_image" in image_path.stem:
                cluster_name = "with_image"
            elif "_without_image" in image_path.stem:
                cluster_name = "without_image"
            else:
                raise RuntimeError(f"Cannot infer cluster from {image_path.name}")
        else:
            cluster_name = image_path.parent.name

        target_path = target_image_path(cluster_name, image_path.stem)
        if image_path.resolve() != target_path.resolve():
            if target_path.exists():
                target_path.unlink()
            shutil.move(str(image_path), str(target_path))
        moved += 1

    return moved


def target_sound_path(relative_stem: str) -> Path:
    return SOUND_ROOT_DIR / f"{relative_stem}.m4a"


def normalize_sounds() -> int:
    moved = 0
    cluster_dirs = (SOUND_ROOT_DIR / "with_image", SOUND_ROOT_DIR / "without_image")
    for cluster_dir in cluster_dirs:
        cluster_dir.mkdir(parents=True, exist_ok=True)

    root_sounds = [path for path in SOUND_ROOT_DIR.glob("*.m4a") if path.is_file()]
    clustered_sounds = [path for cluster_dir in cluster_dirs for path in cluster_dir.glob("*.m4a") if path.is_file()]
    sound_paths = root_sounds + clustered_sounds
    if not sound_paths:
        raise RuntimeError("No sounds found in assets/sounds")

    for sound_path in sound_paths:
        if sound_path.parent == SOUND_ROOT_DIR:
            canonical_name = ascii_slug(sound_path.stem)
            relative_stem = SOUND_NAME_MAP[canonical_name]
        else:
            relative_stem = f"{sound_path.parent.name}/{simplify_clustered_name(sound_path.stem)}"

        target_path = target_sound_path(relative_stem)
        if sound_path.resolve() != target_path.resolve():
            if target_path.exists():
                target_path.unlink()
            shutil.move(str(sound_path), str(target_path))
        moved += 1

    return moved


def verify_assets() -> None:
    for cluster_name in ("with_image", "without_image"):
        image_names = {
            path.stem
            for path in (CARD_ROOT_DIR / cluster_name).glob("*.png")
            if path.is_file()
        }
        sound_names = {
            path.stem
            for path in (SOUND_ROOT_DIR / cluster_name).glob("*.m4a")
            if path.is_file()
        }
        if image_names != sound_names:
            missing_sounds = sorted(image_names - sound_names)
            missing_images = sorted(sound_names - image_names)
            raise RuntimeError(
                f"{cluster_name}: mismatched assets; missing sounds={missing_sounds}, missing images={missing_images}"
            )


def main() -> None:
    moved_sheets = move_source_sheets()
    normalized_images = normalize_images()
    normalized_sounds = normalize_sounds()
    verify_assets()
    print(f"Moved source sheets: {moved_sheets}")
    print(f"Normalized images: {normalized_images}")
    print(f"Normalized sounds: {normalized_sounds}")
    print("Assets verified")


if __name__ == "__main__":
    main()
