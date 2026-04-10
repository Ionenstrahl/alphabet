(function attachQrScreenView(globalObject) {
  const AppModules = (globalObject.AppModules = globalObject.AppModules || {});

  AppModules.createQrScreenView = function createQrScreenView(
    { qrScreen },
    body = document.body
  ) {
    return {
      show() {
        setQrScreenVisibility(qrScreen, body, true);
      },
      hide() {
        setQrScreenVisibility(qrScreen, body, false);
      },
    };
  };

  function setQrScreenVisibility(qrScreen, body, isVisible) {
    qrScreen.classList.toggle("hidden", !isVisible);
    qrScreen.setAttribute("aria-hidden", isVisible ? "false" : "true");
    body.classList.toggle("card-open", isVisible);
  }
})(window);
