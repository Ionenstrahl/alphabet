(function attachCreateApp(globalObject) {
  const AppModules = (globalObject.AppModules = globalObject.AppModules || {});
  const SWIPE_THRESHOLD = 48;
  const VIEW_CARD = "card";
  const VIEW_QR = "qr";
  const ACTION_CLOSE = "close";
  const ACTION_NEXT = "next";
  const ACTION_RANDOM = "random";
  const HASH_SYNC_HIDE = "hide";
  const HASH_SYNC_CLEAR = "clear";
  const QR_HASH = "#qr";

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
    const qrScreenView = AppModules.createQrScreenView(elements, documentRef.body);
    const { createCardHash, createCardId, parseCardHash } = AppModules.cardHash;
    const state = createAppState();

    return {
      start,
    };

    function start() {
      renderOverview();
      syncFromLocationHash();
      registerEventListeners();
    }

    function renderOverview() {
      AppModules.renderOverview({
        container: elements.overviewContent,
        sectionSequence: repository.sectionSequence,
        cardsBySection: repository.cardsBySection,
        onCardSelected: openCard,
      });
    }

    function registerEventListeners() {
      registerWindowListeners();
      registerCardScreenListeners();
    }

    function registerWindowListeners() {
      windowRef.addEventListener("hashchange", syncFromLocationHash);
      windowRef.addEventListener("keydown", handleKeyDown);
    }

    function registerCardScreenListeners() {
      elements.openQrButton.addEventListener("click", openQr);
      elements.cardButton.addEventListener("click", handleCardButtonClick);
      elements.closeButton.addEventListener("click", closeCard);
      elements.nextButton.addEventListener("click", showNextCard);
      elements.randomButton.addEventListener("click", showRandomCard);
      elements.qrCloseButton.addEventListener("click", closeCard);
      elements.cardScreen.addEventListener("touchstart", handleTouchStart, {
        passive: true,
      });
      elements.cardScreen.addEventListener("touchend", handleTouchEnd);
      elements.qrScreen.addEventListener("touchstart", handleTouchStart, {
        passive: true,
      });
      elements.qrScreen.addEventListener("touchend", handleTouchEnd);
    }

    function handleCardButtonClick() {
      if (consumeSwipeHandledFlag(state)) {
        return;
      }

      cardScreenView.playSound(state.currentCard);
    }

    function handleTouchStart(event) {
      state.touchStart = getTouchStartPoint(event);
      if (!state.touchStart) {
        return;
      }

      state.lastSwipeHandled = false;
    }

    function handleTouchEnd(event) {
      const action = getSwipeAction(state.touchStart, event.changedTouches);
      state.touchStart = null;

      if (!action) {
        return;
      }

      state.lastSwipeHandled = true;
      performNavigationAction(action);
    }

    function handleKeyDown(event) {
      const action = getKeyboardAction(event, state.currentView, state.currentCard);
      if (action) {
        event.preventDefault();
        performNavigationAction(action);
      }
    }

    function performNavigationAction(action) {
      if (action === ACTION_CLOSE) {
        closeCard();
        return;
      }

      if (action === ACTION_NEXT) {
        showNextCard();
        return;
      }

      if (action === ACTION_RANDOM) {
        showRandomCard();
      }
    }

    function showNextCard() {
      openCard(repository.getNextCard(state.currentCard));
    }

    function showRandomCard() {
      openCard(repository.getRandomCardInSection(state.currentCard));
    }

    function openCard(card) {
      if (!card) {
        return;
      }

      storeOverviewScrollPosition();

      if (syncLocationHashToCard(card)) {
        return;
      }

      showCard(card);
    }

    function openQr() {
      storeOverviewScrollPosition();

      if (syncLocationHash(QR_HASH)) {
        return;
      }

      showQr();
    }

    function closeCard() {
      if (clearLocationHash()) {
        return;
      }

      hideCurrentScreen();
    }

    function syncFromLocationHash() {
      const syncedRoute = getRouteFromCurrentHash();
      if (syncedRoute === HASH_SYNC_HIDE) {
        hideCurrentScreen();
        return;
      }

      if (syncedRoute === HASH_SYNC_CLEAR) {
        windowRef.location.hash = "";
        return;
      }

      if (syncedRoute.type === VIEW_QR) {
        showQr();
        return;
      }

      showCard(syncedRoute.card);
    }

    function syncLocationHashToCard(card) {
      return syncLocationHash(createCardHash(card));
    }

    function syncLocationHash(hash) {
      if (windowRef.location.hash === hash) {
        return false;
      }

      windowRef.location.hash = hash;
      return true;
    }

    function clearLocationHash() {
      if (!windowRef.location.hash) {
        return false;
      }

      windowRef.location.hash = "";
      return true;
    }

    function getRouteFromCurrentHash() {
      if (windowRef.location.hash === QR_HASH) {
        return { type: VIEW_QR };
      }

      const route = parseCardHash(windowRef.location.hash);
      if (!route) {
        return HASH_SYNC_HIDE;
      }

      const card = repository.findById(createCardId(route));
      if (!card) {
        return HASH_SYNC_CLEAR;
      }

      return {
        type: VIEW_CARD,
        card,
      };
    }

    function showCard(card) {
      state.currentView = VIEW_CARD;
      state.currentCard = card;
      qrScreenView.hide();
      cardScreenView.show(card);
    }

    function showQr() {
      state.currentView = VIEW_QR;
      state.currentCard = null;
      cardScreenView.hide();
      qrScreenView.show();
    }

    function hideCurrentScreen() {
      state.currentView = null;
      state.currentCard = null;
      qrScreenView.hide();
      cardScreenView.hide();
      restoreOverviewScrollPosition();
    }

    function storeOverviewScrollPosition() {
      if (state.currentView) {
        return;
      }

      state.overviewScrollPosition = windowRef.scrollY;
    }

    function restoreOverviewScrollPosition() {
      if (state.overviewScrollPosition === null) {
        return;
      }

      const scrollPosition = state.overviewScrollPosition;
      state.overviewScrollPosition = null;

      windowRef.requestAnimationFrame(() => {
        windowRef.scrollTo(0, scrollPosition);
      });
    }
  };

  function createAppState() {
    return {
      currentView: null,
      currentCard: null,
      overviewScrollPosition: null,
      lastSwipeHandled: false,
      touchStart: null,
    };
  }

  function consumeSwipeHandledFlag(state) {
    if (!state.lastSwipeHandled) {
      return false;
    }

    state.lastSwipeHandled = false;
    return true;
  }

  function getTouchStartPoint(event) {
    if (event.touches.length !== 1 || isIgnoredTouchTarget(event.target)) {
      return null;
    }

    return getTouchPoint(event.touches[0]);
  }

  function isIgnoredTouchTarget(target) {
    return target instanceof Element && target.closest(".icon-button");
  }

  function getTouchPoint(touch) {
    return {
      x: touch.clientX,
      y: touch.clientY,
    };
  }

  function getSwipeAction(touchStart, changedTouches) {
    if (!touchStart || changedTouches.length !== 1) {
      return null;
    }

    const swipeDelta = createSwipeDelta(touchStart, changedTouches[0]);
    if (!isSwipePastThreshold(swipeDelta)) {
      return null;
    }

    if (isCloseSwipe(swipeDelta)) {
      return ACTION_CLOSE;
    }

    if (isNextSwipe(swipeDelta)) {
      return ACTION_NEXT;
    }

    if (isRandomSwipe(swipeDelta)) {
      return ACTION_RANDOM;
    }

    return null;
  }

  function createSwipeDelta(touchStart, touch) {
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;

    return {
      deltaX,
      deltaY,
      absoluteX: Math.abs(deltaX),
      absoluteY: Math.abs(deltaY),
    };
  }

  function isSwipePastThreshold({ absoluteX, absoluteY }) {
    return Math.max(absoluteX, absoluteY) >= SWIPE_THRESHOLD;
  }

  function isCloseSwipe({ absoluteX, absoluteY, deltaY }) {
    return absoluteY > absoluteX && deltaY < -SWIPE_THRESHOLD;
  }

  function isNextSwipe({ absoluteX, absoluteY, deltaX }) {
    return absoluteX > absoluteY && deltaX < -SWIPE_THRESHOLD;
  }

  function isRandomSwipe({ absoluteX, absoluteY, deltaX }) {
    return absoluteX > absoluteY && deltaX > SWIPE_THRESHOLD;
  }

  function getKeyboardAction(event, currentView, currentCard) {
    if (!currentView) {
      return null;
    }

    if (event.key === "Escape" || event.key === "ArrowUp") {
      return ACTION_CLOSE;
    }

    if (currentView !== VIEW_CARD || !currentCard) {
      return null;
    }

    if (event.key === "ArrowLeft") {
      return ACTION_NEXT;
    }

    if (event.key === "ArrowRight") {
      return ACTION_RANDOM;
    }

    return null;
  }
})(window);
