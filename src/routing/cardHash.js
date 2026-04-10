(function attachCardHash(globalObject) {
  const AppModules = (globalObject.AppModules = globalObject.AppModules || {});

  AppModules.cardHash = {
    createCardHash(card) {
      return `#${card.section}/${encodeURIComponent(card.file)}`;
    },
    parseCardHash(hash) {
      const normalizedHash = hash.replace(/^#/, "");
      if (!normalizedHash) {
        return null;
      }

      const [section, encodedFile] = normalizedHash.split("/");
      if (!section || !encodedFile) {
        return null;
      }

      return {
        section,
        file: decodeURIComponent(encodedFile),
      };
    },
    createCardId(route) {
      return `${route.section}:${route.file}`;
    },
  };
})(window);
