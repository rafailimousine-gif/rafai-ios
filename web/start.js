/* Rafai Limousine · injecté au tout début du chargement : l'appli iPhone gère elle-même la connexion Apple et les notifications. */
(function () {
  if (location.hostname !== 'booking.rafai-limousine.com') return;
  window.__rlNative = 'ios';
  try { delete window.PublicKeyCredential; } catch (e) {}
  try { if (window.PublicKeyCredential) window.PublicKeyCredential = undefined; } catch (e) {}
})();
