// Fichier généré à partir de web/start.js (ne pas modifier à la main)
enum Bridge {
    /// Injecté au tout début de chaque page du site de réservation : la page sait qu'elle est dans l'appli iPhone.
    static let start = #"""
/* Rafai Limousine · injecté au tout début du chargement : l'appli iPhone gère elle-même la connexion Apple et les notifications. */
(function () {
  if (location.hostname !== 'booking.rafai-limousine.com') return;
  window.__rlNative = 'ios';
  /* première ouverture : la langue de l'iPhone (français, anglais, arabe ou chinois) */
  try { if (!localStorage.getItem('rl_lang')) { var l = String(navigator.language || 'fr').slice(0, 2).toLowerCase(); localStorage.setItem('rl_lang', ['fr', 'en', 'ar', 'zh'].indexOf(l) >= 0 ? l : 'fr'); } } catch (e) {}
  try { delete window.PublicKeyCredential; } catch (e) {}
  try { if (window.PublicKeyCredential) window.PublicKeyCredential = undefined; } catch (e) {}
})();
"""#
}
