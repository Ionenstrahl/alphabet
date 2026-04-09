const learningOrder = [
  "a",
  "ae",
  "aeu",
  "au",
  "b",
  "c",
  "d",
  "e",
  "ei",
  "eu",
  "f",
  "g",
  "h",
  "i",
  "ie",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "oe",
  "p",
  "q",
  "qu",
  "r",
  "s",
  "sp",
  "st",
  "t",
  "u",
  "ue",
  "v",
  "w",
  "x",
  "y",
  "z",
  "sch",
  "ch",
  "eszett",
];

const sectionSequence = ["with_image", "without_image"];
const sectionMeta = {
  with_image: {
    title: "Mit Bild",
    basePath: ["assets", "images", "cards", "with_image"],
    soundPath: ["assets", "sounds", "with_image"],
  },
  without_image: {
    title: "Ohne Bild",
    basePath: ["assets", "images", "cards", "without_image"],
    soundPath: ["assets", "sounds", "without_image"],
  },
};

const withImageCards = [
  { file: "Apfel", key: "a" },
  { file: "A\u0308pfel", key: "ae" },
  { file: "Ha\u0308user", key: "aeu" },
  { file: "Auto", key: "au" },
  { file: "Baum", key: "b" },
  { file: "Computer", key: "c" },
  { file: "Dorf", key: "d" },
  { file: "Elefant", key: "e" },
  { file: "Eimer", key: "ei" },
  { file: "Euro", key: "eu" },
  { file: "Fisch", key: "f" },
  { file: "Geld", key: "g" },
  { file: "Haus", key: "h" },
  { file: "Insel", key: "i" },
  { file: "Brief", key: "ie" },
  { file: "Junge", key: "j" },
  { file: "Katze", key: "k" },
  { file: "Lampe", key: "l" },
  { file: "Maus", key: "m" },
  { file: "Nase", key: "n" },
  { file: "Ohr", key: "o" },
  { file: "O\u0308l", key: "oe" },
  { file: "Pass", key: "p" },
  { file: "Qualle", key: "q" },
  { file: "Rose", key: "r" },
  { file: "Sonne", key: "s" },
  { file: "Spinne", key: "sp" },
  { file: "Stern", key: "st" },
  { file: "Tisch", key: "t" },
  { file: "Uhr", key: "u" },
  { file: "Tu\u0308r", key: "ue" },
  { file: "Vogel", key: "v" },
  { file: "Wasser", key: "w" },
  { file: "Hexe", key: "x" },
  { file: "Yacht", key: "y" },
  { file: "Yoga", key: "y" },
  { file: "Zitrone", key: "z" },
  { file: "Schokolade", key: "sch" },
  { file: "Dach", key: "ch" },
  { file: "Milch", key: "ch" },
  { file: "Stra\u00DFe", key: "eszett" },
];

const withoutImageCards = [
  "a",
  "ae",
  "aeu",
  "au",
  "b",
  "c",
  "d",
  "e",
  "ei",
  "eu",
  "f",
  "g",
  "h",
  "i",
  "ie",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "oe",
  "p",
  "q",
  "qu",
  "r",
  "s",
  "sp",
  "st",
  "t",
  "u",
  "ue",
  "v",
  "w",
  "x",
  "y",
  "z",
  "sch",
  "ch",
  "eszett",
].map((file) => ({ file, key: file }));

const collator = new Intl.Collator("de", { sensitivity: "base" });
const orderIndex = new Map(learningOrder.map((value, index) => [value, index]));

const cardsBySection = {
  with_image: sortCards(
    withImageCards.map((card) => createCard("with_image", card.file, card.key))
  ),
  without_image: sortCards(
    withoutImageCards.map((card) =>
      createCard("without_image", card.file, card.key)
    )
  ),
};

const cardMap = new Map(
  Object.values(cardsBySection)
    .flat()
    .map((card) => [card.id, card])
);

const overviewContent = document.querySelector("#overview-content");
const cardScreen = document.querySelector("#card-screen");
const cardImage = document.querySelector("#card-image");
const cardButton = document.querySelector("#card-button");
const closeButton = document.querySelector("#close-button");
const nextButton = document.querySelector("#next-button");
const randomButton = document.querySelector("#random-button");
const audio = document.querySelector("#card-audio");

let currentCard = null;
let lastSwipeHandled = false;
let touchStart = null;

renderOverview();
syncFromHash();

window.addEventListener("hashchange", syncFromHash);

cardButton.addEventListener("click", () => {
  if (lastSwipeHandled) {
    lastSwipeHandled = false;
    return;
  }

  playSound(currentCard);
});

closeButton.addEventListener("click", showOverview);
nextButton.addEventListener("click", () => showCard(getNextCard(currentCard)));
randomButton.addEventListener("click", () =>
  showCard(getRandomCardInSection(currentCard))
);

cardScreen.addEventListener(
  "touchstart",
  (event) => {
    if (event.touches.length !== 1) {
      touchStart = null;
      return;
    }

    const target = event.target;
    if (target instanceof Element && target.closest(".icon-button")) {
      touchStart = null;
      return;
    }

    const touch = event.touches[0];
    touchStart = { x: touch.clientX, y: touch.clientY };
    lastSwipeHandled = false;
  },
  { passive: true }
);

cardScreen.addEventListener("touchend", (event) => {
  if (!touchStart || event.changedTouches.length !== 1) {
    touchStart = null;
    return;
  }

  const touch = event.changedTouches[0];
  const deltaX = touch.clientX - touchStart.x;
  const deltaY = touch.clientY - touchStart.y;
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);

  touchStart = null;

  if (Math.max(absX, absY) < 48) {
    return;
  }

  if (absY > absX && deltaY < -48) {
    lastSwipeHandled = true;
    showOverview();
    return;
  }

  if (absX > absY && deltaX < -48) {
    lastSwipeHandled = true;
    showCard(getNextCard(currentCard));
    return;
  }

  if (absX > absY && deltaX > 48) {
    lastSwipeHandled = true;
    showCard(getRandomCardInSection(currentCard));
  }
});

window.addEventListener("keydown", (event) => {
  if (!currentCard) {
    return;
  }

  if (event.key === "Escape" || event.key === "ArrowUp") {
    event.preventDefault();
    showOverview();
    return;
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    showCard(getNextCard(currentCard));
    return;
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    showCard(getRandomCardInSection(currentCard));
  }
});

function createCard(section, file, key) {
  const sectionInfo = sectionMeta[section];
  return {
    id: `${section}:${file}`,
    section,
    file,
    key,
    imageSrc: joinPath(sectionInfo.basePath, `${file}.png`),
    soundSrc: joinPath(sectionInfo.soundPath, `${file}.m4a`),
    label: `${sectionInfo.title}: ${file}`,
  };
}

function sortCards(cards) {
  return cards.slice().sort((left, right) => {
    const orderGap = getOrderPosition(left.key) - getOrderPosition(right.key);
    if (orderGap !== 0) {
      return orderGap;
    }

    return collator.compare(left.file, right.file);
  });
}

function renderOverview() {
  const fragment = document.createDocumentFragment();

  sectionSequence.forEach((section) => {
    const sectionElement = document.createElement("section");
    sectionElement.className = "overview-section";

    const heading = document.createElement("h2");
    heading.textContent = sectionMeta[section].title;
    sectionElement.append(heading);

    const grid = document.createElement("div");
    grid.className = "card-grid";

    cardsBySection[section].forEach((card) => {
      const button = document.createElement("button");
      button.className = "grid-card";
      button.type = "button";
      button.setAttribute("aria-label", card.label);
      button.addEventListener("click", () => showCard(card));

      const image = document.createElement("img");
      image.src = card.imageSrc;
      image.alt = "";
      image.loading = "lazy";

      button.append(image);
      grid.append(button);
    });

    sectionElement.append(grid);
    fragment.append(sectionElement);
  });

  overviewContent.replaceChildren(fragment);
}

function showCard(card) {
  if (!card) {
    return;
  }

  const hash = getHashForCard(card);
  if (window.location.hash !== hash) {
    window.location.hash = hash;
    return;
  }

  currentCard = card;
  audio.pause();
  audio.currentTime = 0;
  cardImage.src = card.imageSrc;
  cardImage.alt = card.label;
  cardScreen.classList.remove("hidden");
  cardScreen.setAttribute("aria-hidden", "false");
  document.body.classList.add("card-open");
}

function showOverview() {
  if (window.location.hash) {
    window.location.hash = "";
    return;
  }

  currentCard = null;
  audio.pause();
  audio.currentTime = 0;
  cardScreen.classList.add("hidden");
  cardScreen.setAttribute("aria-hidden", "true");
  document.body.classList.remove("card-open");
}

function playSound(card) {
  if (!card) {
    return;
  }

  audio.pause();
  audio.currentTime = 0;
  audio.src = card.soundSrc;
  audio.play().catch(() => {});
}

function getNextCard(card) {
  if (!card) {
    return null;
  }

  const cards = cardsBySection[card.section];
  const currentIndex = cards.findIndex((item) => item.id === card.id);

  if (currentIndex >= 0 && currentIndex < cards.length - 1) {
    return cards[currentIndex + 1];
  }

  const currentSectionIndex = sectionSequence.indexOf(card.section);
  const nextSection =
    sectionSequence[(currentSectionIndex + 1) % sectionSequence.length];
  return cardsBySection[nextSection][0] ?? null;
}

function getRandomCardInSection(card) {
  if (!card) {
    return null;
  }

  const cards = cardsBySection[card.section];
  if (cards.length <= 1) {
    return card;
  }

  let nextCard = card;
  while (nextCard.id === card.id) {
    const randomIndex = Math.floor(Math.random() * cards.length);
    nextCard = cards[randomIndex];
  }

  return nextCard;
}

function syncFromHash() {
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) {
    showOverview();
    return;
  }

  const [section, encodedFile] = hash.split("/");
  const file = decodeURIComponent(encodedFile ?? "");
  const card = cardMap.get(`${section}:${file}`);

  if (!card) {
    showOverview();
    return;
  }

  currentCard = card;
  audio.pause();
  audio.currentTime = 0;
  cardImage.src = card.imageSrc;
  cardImage.alt = card.label;
  cardScreen.classList.remove("hidden");
  cardScreen.setAttribute("aria-hidden", "false");
  document.body.classList.add("card-open");
}

function getHashForCard(card) {
  return `#${card.section}/${encodeURIComponent(card.file)}`;
}

function getOrderPosition(key) {
  return orderIndex.get(key) ?? Number.MAX_SAFE_INTEGER;
}

function joinPath(parts, file) {
  return [...parts, file].map(encodeURIComponent).join("/");
}
