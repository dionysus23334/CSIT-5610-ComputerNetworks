(function () {
  function wrap() {
    document.querySelectorAll(".md-typeset table").forEach(function (table) {
      if (table.parentElement && table.parentElement.classList.contains("table-scroll")) return;
      var box = document.createElement("div");
      box.className = "table-scroll";
      table.parentNode.insertBefore(box, table);
      box.appendChild(table);
    });
  }
  wrap();
  window.addEventListener("load", wrap);
  if (typeof document$ !== "undefined") {
    document$.subscribe(wrap);
  }
})();
