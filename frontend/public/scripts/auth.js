function initAuth() {
  console.log("🔐 initAuth running");

  const token =
    localStorage.getItem("authToken") ||
    sessionStorage.getItem("authToken");

  const userDataStr =
    localStorage.getItem("user") ||
    sessionStorage.getItem("user");

  const userInfo = document.getElementById("userInfo");
  const loginBtn = document.getElementById("loginBtn");
  const userNameElement = document.getElementById("userName");

  if (!userInfo || !loginBtn) {
    console.warn("Auth elements not found");
    return;
  }

  if (token && userDataStr) {
    try {
      const userData = JSON.parse(userDataStr);

      userInfo.style.display = "flex";
      loginBtn.style.display = "none";

      const displayName =
        userData.fullName ||
        userData.name ||
        userData.firstName ||
        (userData.email ? userData.email.split("@")[0] : "User");

      if (userNameElement) {
        userNameElement.textContent = displayName;
      }
    } catch (err) {
      console.error("User parse error", err);
      userInfo.style.display = "none";
      loginBtn.style.display = "block";
    }
  } else {
    userInfo.style.display = "none";
    loginBtn.style.display = "block";
  }

  const logoutBtn = document.querySelector(".logout-btn");
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      sessionStorage.removeItem("authToken");
      sessionStorage.removeItem("user");
      window.location.href = "Login.html";
    };
  }
}
