/* RL Driver · injecté au tout début du chargement : la page sait qu'elle est dans l'appli iPhone (installée, GPS et notifications gérés par l'appli). */
(function () {
  if (location.hostname !== 'team.rafai-limousine.com') return;
  window.__rlNative = 'ios';
  try { Object.defineProperty(navigator, 'standalone', { get: function () { return true; }, configurable: true }); } catch (e) {}
})();
