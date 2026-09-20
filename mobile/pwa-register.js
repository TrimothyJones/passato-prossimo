(function registerPassatoServiceWorker(global) {
  if (!("serviceWorker" in global.navigator)) return;

  global.addEventListener("load", () => {
    global.navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.warn("Passato Prossimo offline support could not start.", error);
    });
  });
})(window);
