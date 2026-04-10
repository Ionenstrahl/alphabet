(function attachCardScreenView(globalObject) {
  const AppModules = (globalObject.AppModules = globalObject.AppModules || {});

  AppModules.createCardScreenView = function createCardScreenView(
    { cardScreen, cardImage, audio },
    body = document.body
  ) {
    return {
      show(card) {
        resetAudio(audio);
        updateCardImage(cardImage, card);
        setCardScreenVisibility(cardScreen, body, true);
      },
      hide() {
        resetAudio(audio);
        setCardScreenVisibility(cardScreen, body, false);
      },
      playSound(card) {
        if (!card) {
          return;
        }

        resetAudio(audio);
        audio.src = card.soundSrc;
        audio.play().catch(() => {});
      },
    };
  };

  function updateCardImage(cardImage, card) {
    cardImage.src = card.imageSrc;
    cardImage.alt = card.label;
  }

  function setCardScreenVisibility(cardScreen, body, isVisible) {
    cardScreen.classList.toggle("hidden", !isVisible);
    cardScreen.setAttribute("aria-hidden", isVisible ? "false" : "true");
    body.classList.toggle("card-open", isVisible);
  }

  function resetAudio(audio) {
    audio.pause();
    audio.currentTime = 0;
  }
})(window);
