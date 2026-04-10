(function attachCardRepository(globalObject) {
  const AppModules = (globalObject.AppModules = globalObject.AppModules || {});
  const {
    cardDefinitionsBySection,
    learningOrder,
    sectionMeta,
    sectionSequence,
  } = AppModules.cardDefinitions;
  const joinPath = AppModules.joinPath;
  const collator = new Intl.Collator("de", { sensitivity: "base" });
  const orderIndex = new Map(
    learningOrder.map((value, index) => [value, index])
  );

  AppModules.buildCardRepository = function buildCardRepository() {
    const cardsBySection = buildCardsBySection();
    const orderedSections = sectionSequence.slice();
    const cardsById = buildCardsById(cardsBySection);

    return {
      cardsBySection,
      sectionSequence: orderedSections,
      findById(cardId) {
        return findCardById(cardId, cardsById);
      },
      getNextCard(card) {
        return findNextCard(card, cardsBySection, orderedSections);
      },
      getRandomCardInSection(card) {
        return findRandomCardInSection(card, cardsBySection);
      },
    };
  };

  function buildCardsBySection() {
    return Object.fromEntries(sectionSequence.map(createSectionEntry));
  }

  function createSectionEntry(section) {
    return [
      section,
      buildCardsForSection(section, cardDefinitionsBySection[section]),
    ];
  }

  function buildCardsById(cardsBySection) {
    const allCards = Object.values(cardsBySection).flat();
    return new Map(allCards.map((card) => [card.id, card]));
  }

  function findCardById(cardId, cardsById) {
    return cardsById.get(cardId) ?? null;
  }

  function findNextCard(card, cardsBySection, orderedSections) {
    if (!card) {
      return null;
    }

    const cards = cardsBySection[card.section] ?? [];
    const nextCardInSection = getNextCardInSection(cards, card.id);
    if (nextCardInSection) {
      return nextCardInSection;
    }

    const nextSection = getNextSection(card.section, orderedSections);
    return cardsBySection[nextSection]?.[0] ?? null;
  }

  function getNextCardInSection(cards, currentCardId) {
    const currentIndex = cards.findIndex((item) => item.id === currentCardId);
    if (currentIndex < 0 || currentIndex >= cards.length - 1) {
      return null;
    }

    return cards[currentIndex + 1];
  }

  function getNextSection(currentSection, orderedSections) {
    const currentSectionIndex = orderedSections.indexOf(currentSection);
    return orderedSections[(currentSectionIndex + 1) % orderedSections.length];
  }

  function findRandomCardInSection(card, cardsBySection) {
    if (!card) {
      return null;
    }

    const cards = cardsBySection[card.section] ?? [];
    if (cards.length <= 1) {
      return card;
    }

    let randomCard = card;
    while (randomCard.id === card.id) {
      randomCard = getRandomCard(cards);
    }

    return randomCard;
  }

  function getRandomCard(cards) {
    const randomIndex = Math.floor(Math.random() * cards.length);
    return cards[randomIndex];
  }

  function buildCardsForSection(section, definitions) {
    const cards = definitions.map((definition) =>
      createCard(section, definition.file, definition.key)
    );

    return sortCards(cards);
  }

  function createCard(section, file, key) {
    const metadata = sectionMeta[section];

    return {
      id: `${section}:${file}`,
      section,
      file,
      key,
      imageSrc: joinPath(metadata.imagePath, `${file}.png`),
      soundSrc: joinPath(metadata.soundPath, `${file}.m4a`),
      label: `${metadata.title}: ${file}`,
    };
  }

  function sortCards(cards) {
    return cards.slice().sort((left, right) => {
      const orderDifference =
        getOrderPosition(left.key) - getOrderPosition(right.key);

      if (orderDifference !== 0) {
        return orderDifference;
      }

      return collator.compare(left.file, right.file);
    });
  }

  function getOrderPosition(key) {
    return orderIndex.get(key) ?? Number.MAX_SAFE_INTEGER;
  }
})(window);
