(function attachRenderOverview(globalObject) {
  const AppModules = (globalObject.AppModules = globalObject.AppModules || {});

  AppModules.renderOverview = function renderOverview({
    container,
    sectionSequence,
    cardsBySection,
    onCardSelected,
  }) {
    container.replaceChildren(
      createOverviewFragment(sectionSequence, cardsBySection, onCardSelected)
    );
  };

  function createOverviewFragment(sectionSequence, cardsBySection, onCardSelected) {
    const fragment = document.createDocumentFragment();

    sectionSequence.forEach((section) => {
      fragment.append(
        createOverviewSection(cardsBySection[section], onCardSelected)
      );
    });

    return fragment;
  }

  function createOverviewSection(cards, onCardSelected) {
    const sectionElement = document.createElement("section");
    sectionElement.className = "overview-section";
    sectionElement.append(createCardGrid(cards, onCardSelected));
    return sectionElement;
  }

  function createCardGrid(cards, onCardSelected) {
    const grid = document.createElement("div");
    grid.className = "card-grid";

    cards.forEach((card) => {
      grid.append(createOverviewCard(card, onCardSelected));
    });

    return grid;
  }

  function createOverviewCard(card, onCardSelected) {
    const button = document.createElement("button");
    button.className = "grid-card";
    button.type = "button";
    button.setAttribute("aria-label", card.label);
    button.addEventListener("click", () => onCardSelected(card));

    const image = document.createElement("img");
    image.src = card.imageSrc;
    image.alt = "";
    image.loading = "lazy";

    button.append(image);

    return button;
  }
})(window);
