(function attachCreateApp(globalObject) {
  const AppModules = (globalObject.AppModules = globalObject.AppModules || {});
  const SWIPE_THRESHOLD = 48;

  AppModules.createApp = function createApp(
    windowRef = window,
    documentRef = document
  ) {
    const repository = AppModules.buildCardRepository();
    const elements = AppModules.getElements(documentRef);
    const cardScreenView = AppModules.createCardScreenView(
      elements,
      documentRef.body
    );
    const { createCardHash, createCardId, parseCardHash } = AppModules.cardHash;

    let currentCard = null;
    let lastSwipeHandled = false;
    let touchStart = null;

    return {
      start() {
        AppModules.renderOverview({
          container: elements.overviewContent,
          sectionSequence: repository.sectionSequence,
          cardsBySection: repository.cardsBySection,
          onCardSelected: openCard,
        });

        syncFromLocationHash();
        registerEventListeners();
      },
    };

    function registerEventListeners() {
      windowRef.addEventListener("hashchange", syncFromLocationHash);
      windowRef.addEventListener("keydown", handleKeyDown);

      elements.cardButton.addEventListener("click", handleCardButtonClick);
      elements.closeButton.addEventListener("click", closeCard);
      elements.nextButton.addEventListener("click", showNextCard);
      elements.randomButton.addEventListener("click", showRandomCard);
      elements.cardScreen.addEventListener("touchstart", handleTouchStart, {
        passive: true,
      });
      elements.cardScreen.addEventListener("touchend", handleTouchEnd);
    }

    function handleCardButtonClick() {
      if (lastSwipeHandled) {
        lastSwipeHandled = false;
        return;
      }

      cardScreenView.playSound(currentCard);
    }

    function handleTouchStart(event) {
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
    }

    function handleTouchEnd(event) {
      if (!touchStart || event.changedTouches.length !== 1) {
        touchStart = null;
        return;
      }

      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - touchStart.x;
      const deltaY = touch.clientY - touchStart.y;
      const absoluteX = Math.abs(deltaX);
      const absoluteY = Math.abs(deltaY);

      touchStart = null;

      if (Math.max(absoluteX, absoluteY) < SWIPE_THRESHOLD) {
        return;
      }

      if (absoluteY > absoluteX && deltaY < -SWIPE_THRESHOLD) {
        lastSwipeHandled = true;
        closeCard();
        return;
      }

      if (absoluteX > absoluteY && deltaX < -SWIPE_THRESHOLD) {
        lastSwipeHandled = true;
        showNextCard();
        return;
      }

      if (absoluteX > absoluteY && deltaX > SWIPE_THRESHOLD) {
        lastSwipeHandled = true;
        showRandomCard();
      }
    }

    function handleKeyDown(event) {
      if (!currentCard) {
        return;
      }

      if (event.key === "Escape" || event.key === "ArrowUp") {
        event.preventDefault();
        closeCard();
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showNextCard();
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        showRandomCard();
      }
    }

    function showNextCard() {
      openCard(repository.getNextCard(currentCard));
    }

    function showRandomCard() {
      openCard(repository.getRandomCardInSection(currentCard));
    }

    function openCard(card) {
      if (!card) {
        return;
      }

      const hash = createCardHash(card);
      if (windowRef.location.hash !== hash) {
        windowRef.location.hash = hash;
        return;
      }

      currentCard = card;
      cardScreenView.show(card);
    }

    function closeCard() {
      if (windowRef.location.hash) {
        windowRef.location.hash = "";
        return;
      }

      currentCard = null;
      cardScreenView.hide();
    }

    function syncFromLocationHash() {
      const route = parseCardHash(windowRef.location.hash);
      if (!route) {
        currentCard = null;
        cardScreenView.hide();
        return;
      }

      const card = repository.findById(createCardId(route));
      if (!card) {
        windowRef.location.hash = "";
        return;
      }

      currentCard = card;
      cardScreenView.show(card);
    }
  };
})(window);
