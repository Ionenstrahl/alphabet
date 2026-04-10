(function attachCardScreenView(globalObject) {
  const AppModules = (globalObject.AppModules = globalObject.AppModules || {});

  AppModules.createCardScreenView = function createCardScreenView(
    { cardScreen, cardImage, audio },
    body = document.body
  ) {
    return {
      show(card) {
        stopAudio(audio);
        cardImage.src = card.imageSrc;
        cardImage.alt = card.label;
        cardScreen.classList.remove("hidden");
        cardScreen.setAttribute("aria-hidden", "false");
        body.classList.add("card-open");
      },
      hide() {
        stopAudio(audio);
        cardScreen.classList.add("hidden");
        cardScreen.setAttribute("aria-hidden", "true");
        body.classList.remove("card-open");
      },
      playSound(card) {
        if (!card) {
          return;
        }

        stopAudio(audio);
        audio.src = card.soundSrc;
        audio.play().catch(() => {});
      },
    };
  };

  function stopAudio(audio) {
    audio.pause();
    audio.currentTime = 0;
  }
})(window);
