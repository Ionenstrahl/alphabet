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
    const cardsBySection = Object.fromEntries(
      sectionSequence.map((section) => [
        section,
        buildCardsForSection(section, cardDefinitionsBySection[section]),
      ])
    );

    const allCards = Object.values(cardsBySection).flat();
    const cardsById = new Map(allCards.map((card) => [card.id, card]));

    return {
      cardsBySection,
      sectionSequence: sectionSequence.slice(),
      findById(cardId) {
        return cardsById.get(cardId) ?? null;
      },
      getNextCard(card) {
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
      },
      getRandomCardInSection(card) {
        if (!card) {
          return null;
        }

        const cards = cardsBySection[card.section];
        if (cards.length <= 1) {
          return card;
        }

        let randomCard = card;
        while (randomCard.id === card.id) {
          const randomIndex = Math.floor(Math.random() * cards.length);
          randomCard = cards[randomIndex];
        }

        return randomCard;
      },
    };
  };

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
