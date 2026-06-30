document.addEventListener("DOMContentLoaded", () => {
  // Load Header
  const headerContainer = document.getElementById("header");
  if (headerContainer) {
    fetch("Header.html")
      .then(res => {
        if (!res.ok) throw new Error("Header not found");
        return res.text();
      })
      .then(html => {
        headerContainer.innerHTML = html;

        // Initialize authentication UI state after header is loaded
        if (typeof initAuth === "function") {
          initAuth();
        }
      })
      .catch(err => console.error("Error loading header:", err));
  }

  // Load Footer
  const footerContainer = document.getElementById("footer");
  if (footerContainer) {
    fetch("Footer.html")
      .then(res => {
        if (!res.ok) throw new Error("Footer not found");
        return res.text();
      })
      .then(html => {
        footerContainer.innerHTML = html;
      })
      .catch(err => console.error("Error loading footer:", err));
  }
});

