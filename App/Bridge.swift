// Fichier généré à partir de web/start.js (ne pas modifier à la main)
enum Bridge {
    /// Injecté au tout début de chaque page du site de réservation : la page sait qu'elle est dans l'appli iPhone.
    static let start = #"""
/* Rafai Limousine · injecté au tout début du chargement : l'appli iPhone gère elle-même la connexion Apple et les notifications. */
(function () {
  if (location.hostname !== 'booking.rafai-limousine.com') return;
  window.__rlNative = 'ios';
  try { delete window.PublicKeyCredential; } catch (e) {}
  try { if (window.PublicKeyCredential) window.PublicKeyCredential = undefined; } catch (e) {}
})();
"""#
}
