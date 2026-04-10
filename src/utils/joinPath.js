(function attachJoinPath(globalObject) {
  const AppModules = (globalObject.AppModules = globalObject.AppModules || {});

  AppModules.joinPath = function joinPath(pathParts, fileName) {
    return [...pathParts, fileName].map(encodeURIComponent).join("/");
  };
})(window);
