// Fichier généré à partir de web/start-driver.js (ne pas modifier à la main)
enum DriverBridge {
    /// Injecté au tout début de la page chauffeur : la page sait qu'elle est dans l'appli RL Driver.
    static let start = #"""
/* RL Driver · injecté au tout début du chargement : la page sait qu'elle est dans l'appli iPhone (installée, GPS et notifications gérés par l'appli). */
(function () {
  if (location.hostname !== 'team.rafai-limousine.com') return;
  window.__rlNative = 'ios';
  try { Object.defineProperty(navigator, 'standalone', { get: function () { return true; }, configurable: true }); } catch (e) {}
})();
"""#
}
