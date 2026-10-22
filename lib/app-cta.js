// Show Android CTA banner and PC promo card based on user agent
(function () {
  var ua = navigator.userAgent || "";
  var isAndroid = /Android/i.test(ua);
  var isMobileUA = /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
  var isStandalone = false;

  try {
    isStandalone =
      (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
      (window.matchMedia && window.matchMedia("(display-mode: fullscreen)").matches) ||
      (navigator.standalone === true);
  } catch (e) {
    isStandalone = false;
  }

  var heroPlayWrap = document.getElementById("heroPlayWrap");
  var appPromoCard = document.getElementById("appPromoCard");

  if (isAndroid && isMobileUA && !isStandalone) {
    if (heroPlayWrap) heroPlayWrap.style.display = "flex";
  }

  if (!isMobileUA) {
    if (appPromoCard) appPromoCard.style.display = "block";
  }
})();
