// Accordion: only one <details> open at a time within #faq
(function () {
  var box = document.getElementById("faq");
  if (!box) return;
  var items = Array.prototype.slice.call(box.querySelectorAll("details.faq-item"));
  items.forEach(function (d) {
    d.addEventListener("toggle", function () {
      if (!d.open) return;
      items.forEach(function (other) {
        if (other !== d) other.open = false;
      });
    });
  });
})();
