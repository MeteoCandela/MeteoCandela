// Accordion: only one <details> open at a time within [data-accordion="single"]
(function () {
  var root = document.querySelector('.mv-accordion[data-accordion="single"]');
  if (!root) return;
  var items = Array.from(root.querySelectorAll("details.mv-acc-item"));
  items.forEach(function (d) {
    d.addEventListener("toggle", function () {
      if (!d.open) return;
      items.forEach(function (other) {
        if (other !== d) other.open = false;
      });
    });
  });
})();
