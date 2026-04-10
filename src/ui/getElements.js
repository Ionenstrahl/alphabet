(function attachGetElements(globalObject) {
  const AppModules = (globalObject.AppModules = globalObject.AppModules || {});

  AppModules.getElements = function getElements(root = document) {
    return {
      overviewContent: getRequiredElement(root, "#overview-content"),
      openQrButton: getRequiredElement(root, "#open-qr-button"),
      cardScreen: getRequiredElement(root, "#card-screen"),
      cardImage: getRequiredElement(root, "#card-image"),
      cardButton: getRequiredElement(root, "#card-button"),
      closeButton: getRequiredElement(root, "#close-button"),
      nextButton: getRequiredElement(root, "#next-button"),
      randomButton: getRequiredElement(root, "#random-button"),
      qrScreen: getRequiredElement(root, "#qr-screen"),
      qrCloseButton: getRequiredElement(root, "#qr-close-button"),
      audio: getRequiredElement(root, "#card-audio"),
    };
  };

  function getRequiredElement(root, selector) {
    const element = root.querySelector(selector);

    if (!element) {
      throw new Error(`Missing required element: ${selector}`);
    }

    return element;
  }
})(window);
