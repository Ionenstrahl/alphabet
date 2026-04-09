from __future__ import annotations

import shutil
import unicodedata
from pathlib import Path

IMAGE_ROOT_DIR = Path("assets/images")
SOURCE_SHEETS_DIR = IMAGE_ROOT_DIR / "source-sheets"
CARD_ROOT_DIR = IMAGE_ROOT_DIR / "cards"
SOUND_ROOT_DIR = Path("assets/sounds")

SOUND_NAME_MAP = {
    "a": "a_without_image",
    "apfel": "a_with_image",
    "ae": "ae_without_image",
    "aepfel": "ae_with_image",
    "au": "au_without_image",
    "auto": "au_with_image",
    "aeu": "aeu_without_image",
    "haeuser": "aeu_with_image",
    "b": "b_without_image",
    "baum": "b_with_image",
    "brief": "ie_with_image",
    "c": "c_without_image",
    "ch": "ch_without_image",
    "computer": "c_with_image",
    "d": "d_without_image",
    "dach": "ch_with_image_dach",
    "dorf": "d_with_image",
    "e": "e_without_image",
    "ei": "ei_without_image",
    "eimer": "ei_with_image",
    "elefant": "e_with_image",
    "es": "s_without_image",
    "eu": "eu_without_image",
    "euro": "eu_with_image",
    "f": "f_without_image",
    "fisch": "f_with_image",
    "g": "g_without_image",
    "geld": "g_with_image",
    "h": "h_without_image",
    "haus": "h_with_image",
    "hexe": "x_with_image",
    "i": "i_without_image",
    "ie": "ie_without_image",
    "insel": "i_with_image",
    "j": "j_without_image",
    "junge": "j_with_image",
    "k": "k_without_image",
    "katze": "k_with_image",
    "l": "l_without_image",
    "lampe": "l_with_image",
    "m": "m_without_image",
    "maus": "m_with_image",
    "milch": "ch_with_image_milch",
    "n": "n_without_image",
    "nase": "n_with_image",
    "o": "o_without_image",
    "oe": "oe_without_image",
    "oel": "oe_with_image",
    "ohr": "o_with_image",
    "p": "p_without_image",
    "pass": "p_with_image",
    "q": "q_without_image",
    "qu": "qu_without_image",
    "qualle": "q_with_image",
    "r": "r_without_image",
    "rose": "r_with_image",
    "s": "s_without_image",
    "sch": "sch_without_image",
    "schokolade": "sch_with_image",
    "sonne": "s_with_image",
    "sp": "sp_without_image",
    "spinne": "sp_with_image",
    "ss": "eszett_without_image",
    "st": "st_without_image",
    "stern": "st_with_image",
    "strasse": "eszett_with_image",
    "t": "t_without_image",
    "tisch": "t_with_image",
    "tuer": "ue_with_image",
    "u": "u_without_image",
    "ue": "ue_without_image",
    "uhr": "u_with_image",
    "v": "v_without_image",
    "vogel": "v_with_image",
    "w": "w_without_image",
    "wasser": "w_with_image",
    "x": "x_without_image",
    "y": "y_without_image",
    "yacht": "y_with_image_yacht",
    "yoga": "y_with_image_yoga",
    "z": "z_without_image",
    "zitrone": "z_with_image",
}


def ascii_slug(value: str) -> str:
    normalized = unicodedata.normalize("NFC", value)
    normalized = (
        normalized.replace("Ä", "Ae")
        .replace("ä", "ae")
        .replace("Ö", "Oe")
        .replace("ö", "oe")
        .replace("Ü", "Ue")
        .replace("ü", "ue")
        .replace("ẞ", "ss")
        .replace("ß", "ss")
    )
    normalized = unicodedata.normalize("NFKD", normalized)
    normalized = (
        normalized.replace("Ä", "Ae")
        .replace("ä", "ae")
        .replace("Ö", "Oe")
        .replace("ö", "oe")
        .replace("Ü", "Ue")
        .replace("ü", "ue")
        .replace("ẞ", "ss")
        .replace("ß", "ss")
    )
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
    return "".join(character for character in ascii_value.lower() if character.isalnum())


def move_source_sheets() -> int:
    source_paths = list(IMAGE_ROOT_DIR.glob("Karteikarten für Website*.png"))
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


def target_image_path(card_name: str) -> Path:
    cluster_dir = "with_image" if "_with_image" in card_name else "without_image"
    return CARD_ROOT_DIR / cluster_dir / f"{card_name}.png"


def normalize_images() -> int:
    moved = 0
    for cluster_dir in (CARD_ROOT_DIR / "with_image", CARD_ROOT_DIR / "without_image"):
        cluster_dir.mkdir(parents=True, exist_ok=True)

    image_paths = [path for path in CARD_ROOT_DIR.glob("*.png") if path.is_file()]
    if not image_paths:
        raise RuntimeError("No flat card images found in assets/images/cards")

    for image_path in image_paths:
        target_path = target_image_path(image_path.stem)
        if image_path.resolve() != target_path.resolve():
            if target_path.exists():
                target_path.unlink()
            shutil.move(str(image_path), str(target_path))
        moved += 1

    return moved


def target_sound_path(card_name: str) -> Path:
    cluster_dir = "with_image" if "_with_image" in card_name else "without_image"
    return SOUND_ROOT_DIR / cluster_dir / f"{card_name}.m4a"


def normalize_sounds() -> int:
    for cluster_dir in (SOUND_ROOT_DIR / "with_image", SOUND_ROOT_DIR / "without_image"):
        cluster_dir.mkdir(parents=True, exist_ok=True)
        for existing_file in cluster_dir.glob("*.m4a"):
            existing_file.unlink()

    sound_paths = [path for path in SOUND_ROOT_DIR.glob("*.m4a") if path.is_file()]
    if not sound_paths:
        raise RuntimeError("No root-level source sounds found in assets/sounds")

    moved = 0
    for sound_path in sound_paths:
        canonical_name = ascii_slug(sound_path.stem)
        target_card_name = SOUND_NAME_MAP[canonical_name]
        target_path = target_sound_path(target_card_name)
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
    moved_sounds = normalize_sounds()
    verify_assets()
    print(f"Moved source sheets: {moved_sheets}")
    print(f"Normalized images: {normalized_images}")
    print(f"Normalized sounds: {moved_sounds}")
    print("Assets verified")


if __name__ == "__main__":
    main()
