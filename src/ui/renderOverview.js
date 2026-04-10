(function attachRenderOverview(globalObject) {
  const AppModules = (globalObject.AppModules = globalObject.AppModules || {});

  AppModules.renderOverview = function renderOverview({
    container,
    sectionSequence,
    cardsBySection,
    onCardSelected,
  }) {
    const fragment = document.createDocumentFragment();

    sectionSequence.forEach((section) => {
      const sectionElement = document.createElement("section");
      sectionElement.className = "overview-section";

      const grid = document.createElement("div");
      grid.className = "card-grid";

      cardsBySection[section].forEach((card) => {
        grid.append(createOverviewCard(card, onCardSelected));
      });

      sectionElement.append(grid);
      fragment.append(sectionElement);
    });

    container.replaceChildren(fragment);
  };

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
