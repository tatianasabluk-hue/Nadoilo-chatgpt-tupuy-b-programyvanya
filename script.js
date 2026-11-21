
/* ========================================
   MINECRAFT NEON HUB PRO
   Виправлена демонстраційна версія
======================================== */

const $ = id => document.getElementById(id);

let currentUser = null;
let authMode = "register";

const ADMIN_PASSWORD = "Нікітка_Адмін3000";

function loadData(key, fallback = []) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

let users = loadData("nh_users");
let news = loadData("nh_news");
let messages = loadData("nh_messages");

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ========================================
// ТЕМА
// ========================================

function loadTheme() {
  const theme = localStorage.getItem("nh_theme") || "dark";

  document.body.classList.toggle("light", theme === "light");

  if ($("themeBtn")) {
    $("themeBtn").textContent =
      theme === "light" ? "🌙" : "☀️";
  }
}

$("themeBtn").onclick = () => {
  const light = document.body.classList.toggle("light");

  localStorage.setItem("nh_theme", light ? "light" : "dark");
  $("themeBtn").textContent = light ? "🌙" : "☀️";
};

// ========================================
// АВТОРИЗАЦІЯ
// ========================================

function showAuth(mode = "register") {
  authMode = mode;

  $("authModal").classList.remove("hidden");
  $("authMessage").textContent = "";

  $("username").classList.toggle(
    "hidden",
    mode !== "register"
  );

  $("email").classList.toggle("hidden", mode === "admin");

  $("email").required = mode !== "admin";
  $("username").required = mode === "register";

  $("password").value = "";
  $("authSubmit").textContent = {
    register: "Створити акаунт",
    login: "Увійти",
    admin: "Перевірити доступ"
  }[mode];
}

function hideAuth() {
  $("authModal").classList.add("hidden");
}

$("loginBtn").onclick = () => {
  if (currentUser) {
    logout();
  } else {
    showAuth("login");
  }
};

// Вкладки реєстрації, входу та адмінки
document.querySelectorAll(".tabs button").forEach((button, index) => {
  button.onclick = () => {
    showAuth(["register", "login", "admin"][index]);
  };
});

// ========================================
// РЕЄСТРАЦІЯ ТА ВХІД
// ========================================

$("authForm").onsubmit = event => {
  event.preventDefault();

  const email = $("email").value.trim().toLowerCase();
  const password = $("password").value;
  const name = $("username").value.trim();

  // АДМІН-ВХІД
  if (authMode === "admin") {
    if (password !== ADMIN_PASSWORD) {
      $("authMessage").textContent = "❌ Неправильний пароль!";
      return;
    }

    currentUser = {
      name: "Адміністратор",
      email: "admin@neonhub.local",
      bio: "Адміністратор Minecraft Neon Hub",
      joined: new Date().toLocaleDateString("uk-UA"),
      role: "admin"
    };

    sessionStorage.setItem(
      "nh_demo_user",
      JSON.stringify(currentUser)
    );

    $("authForm").reset();
    hideAuth();
    updateProfile();

    $("admin").classList.remove("hidden");
    $("admin").scrollIntoView({ behavior: "smooth" });

    return;
  }

  // ПЕРЕВІРКА ДАНИХ
  if (!email || password.length < 8) {
    $("authMessage").textContent =
      "Введи пошту та пароль мінімум із 8 символів.";
    return;
  }

  // РЕЄСТРАЦІЯ
  if (authMode === "register") {
    if (!name) {
      $("authMessage").textContent = "Введи Minecraft нік!";
      return;
    }

    if (users.some(user => user.email === email)) {
      $("authMessage").textContent = "Така пошта вже зареєстрована!";
      return;
    }

    const user = {
      name,
      email,
      password,
      bio: "Гравець Minecraft",
      joined: new Date().toLocaleDateString("uk-UA"),
      role: "user"
    };

    users.push(user);
    save("nh_users", users);

    currentUser = { ...user };
    delete currentUser.password;
  }

  // ЗВИЧАЙНИЙ ВХІД
  else if (authMode === "login") {
    const user = users.find(item =>
      item.email === email && item.password === password
    );

    if (!user) {
      $("authMessage").textContent =
        "❌ Неправильна пошта або пароль!";
      return;
    }

    currentUser = { ...user };
    delete currentUser.password;
  }

  sessionStorage.setItem(
    "nh_demo_user",
    JSON.stringify(currentUser)
  );

  $("authForm").reset();
  hideAuth();
  updateProfile();
};

// ========================================
// ВИХІД
// ========================================

function logout() {
  currentUser = null;

  sessionStorage.removeItem("nh_demo_user");

  $("admin").classList.add("hidden");

  updateProfile();
}

// ========================================
// ПРОФІЛЬ
// ========================================

function updateProfile() {
  const panel = $("profileInfo");
  panel.innerHTML = "";

  if (!currentUser) {
    panel.textContent = "Увійди, щоб побачити свій профіль.";
    $("loginBtn").textContent = "Увійти";
    $("admin").classList.add("hidden");
    return;
  }

  $("loginBtn").textContent = "Вийти";

  const title = document.createElement("h3");
  title.textContent = "👤 " + currentUser.name;

  const email = document.createElement("p");
  email.textContent = "Email: " + currentUser.email;

  const bio = document.createElement("p");
  bio.textContent = "Опис: " + currentUser.bio;

  const joined = document.createElement("p");
  joined.textContent = "Дата реєстрації: " + currentUser.joined;

  const logoutButton = document.createElement("button");
  logoutButton.textContent = "Вийти з акаунта";
  logoutButton.onclick = logout;

  panel.append(title, email, bio, joined, logoutButton);

  const isAdmin = currentUser.role === "admin";

  $("admin").classList.toggle("hidden", !isAdmin);

  if (isAdmin) {
    renderUsers();
  }
}

// ВІДНОВЛЕННЯ СЕАНСУ
try {
  currentUser = JSON.parse(
    sessionStorage.getItem("nh_demo_user") || "null"
  );
} catch {
  currentUser = null;
}

// ========================================
// ПОШУК ГРАВЦІВ
// ========================================

$("search").oninput = () => {
  const query = $("search").value.trim().toLowerCase();
  const result = $("searchResults");

  result.innerHTML = "";

  if (!query) return;

  const found = users.filter(user =>
    user.name.toLowerCase().includes(query)
  );

  if (!found.length) {
    result.textContent = "Гравців не знайдено.";
    return;
  }

  found.forEach(user => {
    const item = document.createElement("div");
    item.className = "user-item";
    item.textContent = "👤 " + user.name;
    result.append(item);
  });
};

// ========================================
// ЧАТ
// ========================================

function renderMessages() {
  const box = $("messages");
  box.innerHTML = "";

  const welcome = document.createElement("p");
  welcome.className = "system-message";
  welcome.textContent = "Вітаємо у Minecraft Neon Hub!";
  box.append(welcome);

  messages.slice(-100).forEach(message => {
    const item = document.createElement("div");
    item.className = "message";

    const author = document.createElement("strong");
    author.textContent = message.author + ": ";

    const content = document.createElement("span");
    content.textContent = message.text;

    item.append(author, content);
    box.append(item);
  });

  box.scrollTop = box.scrollHeight;
}

$("chatForm").onsubmit = event => {
  event.preventDefault();

  if (!currentUser) {
    alert("Спочатку увійди в акаунт!");
    showAuth("login");
    return;
  }

  const text = $("chatInput").value.trim();

  if (!text) return;

  messages.push({
    author: currentUser.name,
    text,
    date: Date.now()
  });

  save("nh_messages", messages);

  $("chatInput").value = "";
  renderMessages();
};

// ========================================
// НОВИНИ
// ========================================

function renderNews() {
  const list = $("newsList");
  list.innerHTML = "";

  if (!news.length) {
    const empty = document.createElement("p");
    empty.textContent = "Поки що новин немає.";
    list.append(empty);
    return;
  }

  news.forEach(item => {
    const card = document.createElement("article");
    card.className = "card";

    const heading = document.createElement("h3");
    heading.textContent = "📢 " + item.title;

    const description = document.createElement("p");
    description.textContent = item.text;

    card.append(heading, description);
    list.append(card);
  });
}

// ========================================
// АДМІН-ПАНЕЛЬ
// ========================================

function renderUsers() {
  $("userCount").textContent = users.length;

  const list = $("userList");
  list.innerHTML = "";

  users.forEach(user => {
    const item = document.createElement("div");
    item.className = "user-item";
    item.textContent = "👤 " + user.name + " — " + user.role;
    list.append(item);
  });
}

$("addNews").onclick = () => {
  if (!currentUser || currentUser.role !== "admin") {
    alert("Немає прав адміністратора!");
    return;
  }

  const title = $("announcement").value.trim();
  const text = $("newsText").value.trim();

  if (!title || !text) {
    alert("Заповни заголовок і текст!");
    return;
  }

  news.unshift({ title, text });

  save("nh_news", news);
  renderNews();

  $("announcement").value = "";
  $("newsText").value = "";
};

$("clearChat").onclick = () => {
  if (!currentUser || currentUser.role !== "admin") {
    alert("Немає прав адміністратора!");
    return;
  }

  if (!confirm("Очистити історію чату?")) return;

  messages = [];
  save("nh_messages", messages);
  renderMessages();
};

// ========================================
// ЗАПУСК
// ========================================

loadTheme();
updateProfile();
renderMessages();
renderNews();