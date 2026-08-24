/**
 * FORMA2 MVP - Local Storage Version
 * No Firebase - Everything in localStorage for quick testing
 */

// ============================================
// GLOBAL STATE
// ============================================

let currentUser = null;
let currentUserRole = null;
let currentScreen = "login";
let currentCoachId = null;
let currentConversation = null;

// Shortcuts for elements
const $ = (id) => document.getElementById(id);

// ============================================
// INITIALIZATION
// ============================================

window.addEventListener("DOMContentLoaded", () => {
  loadUserFromStorage();
  initializeEventListeners();
  renderHome();
});

// ============================================
// AUTHENTICATION
// ============================================

function loadUserFromStorage() {
  const saved = localStorage.getItem("forma2_currentUser");
  if (saved) {
    currentUser = JSON.parse(saved);
    currentUserRole = currentUser.role;
    currentCoachId = currentUser.coachId || null;
    go("home");
  }
}

function handleSignIn() {
  const email = $("signin-email").value.trim();
  const password = $("signin-password").value.trim();

  if (!email || !password) {
    toast("❌ Email et mot de passe requis");
    return;
  }

  const users = JSON.parse(localStorage.getItem("forma2_users") || "[]");
  const user = users.find((u) => u.email === email && u.password === password);

  if (!user) {
    toast("❌ Email ou mot de passe incorrect");
    return;
  }

  currentUser = { id: user.id, email: user.email, name: user.name, role: user.role, coachId: user.coachId };
  currentUserRole = user.role;
  currentCoachId = user.coachId || null;

  localStorage.setItem("forma2_currentUser", JSON.stringify(currentUser));
  toast("✅ Connecté avec succès");

  // Clear inputs
  $("signin-email").value = "";
  $("signin-password").value = "";

  go("home");
}

function handleSignUp() {
  const email = $("signup-email").value.trim();
  const name = $("signup-name").value.trim();
  const password = $("signup-password").value.trim();
  const role = document.querySelector('input[name="role"]:checked').value;

  if (!email || !name || !password) {
    toast("❌ Tous les champs requis");
    return;
  }

  if (password.length < 6) {
    toast("❌ Mot de passe minimum 6 caractères");
    return;
  }

  const users = JSON.parse(localStorage.getItem("forma2_users") || "[]");
  if (users.some((u) => u.email === email)) {
    toast("❌ Cet email est déjà enregistré");
    return;
  }

  const newUser = {
    id: "user_" + Date.now(),
    email,
    name,
    password,
    role,
    coachId: null,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  localStorage.setItem("forma2_users", JSON.stringify(users));

  currentUser = { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role };
  currentUserRole = newUser.role;

  localStorage.setItem("forma2_currentUser", JSON.stringify(currentUser));
  toast("✅ Compte créé avec succès");

  // Initialize coach-client relationships
  if (role === "coach") {
    const coaches = JSON.parse(localStorage.getItem("forma2_coaches") || "[]");
    coaches.push({ coachId: newUser.id, coachName: name, coachEmail: email, clients: [] });
    localStorage.setItem("forma2_coaches", JSON.stringify(coaches));
  }

  // Clear inputs
  $("signup-email").value = "";
  $("signup-name").value = "";
  $("signup-password").value = "";

  go("home");
}

function logoutUser() {
  currentUser = null;
  currentUserRole = null;
  currentCoachId = null;
  localStorage.removeItem("forma2_currentUser");
  go("login");
  toast("✅ Déconnexion réussie");
}

// ============================================
// NAVIGATION & SCREEN MANAGEMENT
// ============================================

function go(screen) {
  // Hide all screens
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));

  // Update nav
  document.querySelectorAll(".nav-it").forEach((n) => n.classList.remove("on"));

  // Show selected screen
  const screenEl = $(`scr-${screen}`);
  if (screenEl) {
    screenEl.classList.add("active");
    currentScreen = screen;
  }

  // Update nav indicator
  const navEl = document.querySelector(`[data-s="${screen}"]`);
  if (navEl) {
    navEl.classList.add("on");
  }

  // Render screen content
  if (screen === "home") {
    renderHome();
  } else if (screen === "coach") {
    renderCoach();
  } else if (screen === "profile") {
    renderProfile();
  }
}

function switchTab(tab) {
  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
  document.querySelectorAll('[id$="-tab"]').forEach((t) => (t.style.display = "none"));

  document.querySelector(`[data-tab="${tab}"]`).classList.add("active");
  $(`${tab}-tab`).style.display = "block";
}

// ============================================
// HOME SCREEN
// ============================================

function renderHome() {
  if (!currentUser) return;

  // Update greeting
  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    month: "long",
    day: "numeric"
  });

  const greet = $("home-greet");
  const dateEl = $("home-date");

  if (greet) greet.textContent = `Salut, ${currentUser.name.split(" ")[0]}!`;
  if (dateEl) dateEl.textContent = today;

  // Update steps display
  updateStepsDisplay();
}

function updateStepsDisplay() {
  const today = new Date().toISOString().split("T")[0];
  const stepsData = JSON.parse(localStorage.getItem(`forma2_steps_${currentUser.id}_${today}`) || '{"steps":0,"distance":0,"calories":0}');

  const stepsLabel = $("steps-label");
  const stepsBar = $("steps-bar");
  const stepsKm = $("steps-km");
  const stepsCal = $("steps-cal");
  const stepsEmoji = $("steps-emoji");

  if (stepsLabel) stepsLabel.textContent = `${stepsData.steps.toLocaleString()} / 10 000`;
  if (stepsBar) stepsBar.style.width = `${Math.min((stepsData.steps / 10000) * 100, 100)}%`;
  if (stepsKm) stepsKm.textContent = `${stepsData.distance} km`;
  if (stepsCal) stepsCal.textContent = `${stepsData.calories} kcal`;
  if (stepsEmoji) stepsEmoji.textContent = stepsData.steps >= 10000 ? "✅" : "🚶";
}

function addTestSteps(count) {
  const today = new Date().toISOString().split("T")[0];
  const stepsData = JSON.parse(localStorage.getItem(`forma2_steps_${currentUser.id}_${today}`) || '{"steps":0,"distance":0,"calories":0}');

  stepsData.steps += count;
  stepsData.distance = ((stepsData.steps * 0.7) / 1000).toFixed(2);
  stepsData.calories = Math.round(stepsData.steps * 0.04 * (75 / 70)); // Assuming 75kg

  localStorage.setItem(`forma2_steps_${currentUser.id}_${today}`, JSON.stringify(stepsData));
  updateStepsDisplay();
  toast(`✅ +${count} pas ajoutés`);
}

// ============================================
// COACH SCREEN
// ============================================

function renderCoach() {
  if (!currentUser) return;

  const content = $("coach-content");
  if (!content) return;

  if (currentUserRole === "coach") {
    renderCoachDashboard();
  } else if (currentUserRole === "client") {
    renderClientView();
  }
}

function renderCoachDashboard() {
  const coaches = JSON.parse(localStorage.getItem("forma2_coaches") || "[]");
  const coach = coaches.find((c) => c.coachId === currentUser.id);

  if (!coach) {
    $("coach-content").innerHTML = "<div class='card'>Pas de clients encore</div>";
    return;
  }

  let html = "";

  // Add client section
  html += `
    <div class="card" style="margin-bottom:16px">
      <div class="t15" style="margin-bottom:12px">➕ Ajouter un client</div>
      <div style="display:flex;gap:8px">
        <input type="email" id="coach-add-email" placeholder="Email du client" style="margin:0;flex:1">
        <button class="btn sm" onclick="addClientByEmail()" style="width:auto">Ajouter</button>
      </div>
    </div>
  `;

  // Client list
  html += "<div>";
  if (coach.clients.length === 0) {
    html += "<div class='sub'>Aucun client ajouté</div>";
  } else {
    coach.clients.forEach((client) => {
      const unreadCount = getUnreadCount(currentUser.id, client.clientId);
      html += `
        <div class="list-it" onclick="openConversation('${client.clientId}', '${client.clientName}')">
          <div class="avatar">👤</div>
          <div class="grow">
            <div class="t15">${client.clientName}</div>
            <div class="t12">${client.clientEmail}</div>
          </div>
          ${unreadCount > 0 ? `<div class="nbadge">${unreadCount}</div>` : ""}
        </div>
      `;
    });
  }
  html += "</div>";

  $("coach-content").innerHTML = html;
}

function renderClientView() {
  if (!currentCoachId) {
    $("coach-content").innerHTML = "<div class='card'>Pas de coach assigné<br><div class='sub' style='margin-top:12px'>Contactez votre coach pour rejoindre</div></div>";
    return;
  }

  const users = JSON.parse(localStorage.getItem("forma2_users") || "[]");
  const coach = users.find((u) => u.id === currentCoachId);

  if (!coach) {
    $("coach-content").innerHTML = "<div class='card'>Coach non trouvé</div>";
    return;
  }

  let html = `
    <div class="list-it">
      <div class="avatar">🏆</div>
      <div class="grow">
        <div class="t15">${coach.name}</div>
        <div class="t12">${coach.email}</div>
      </div>
    </div>
    <div class="card" style="margin-top:16px">
      <button class="btn" onclick="openConversation('${coach.id}', '${coach.name}')" style="width:100%">
        💬 Envoyer un message
      </button>
    </div>
  `;

  $("coach-content").innerHTML = html;
}

function addClientByEmail() {
  const email = $("coach-add-email").value.trim();
  if (!email) {
    toast("❌ Email requis");
    return;
  }

  const users = JSON.parse(localStorage.getItem("forma2_users") || "[]");
  const client = users.find((u) => u.email === email);

  if (!client) {
    toast("❌ Utilisateur non trouvé");
    return;
  }

  if (client.role !== "client") {
    toast("❌ Cet utilisateur n'est pas un client");
    return;
  }

  const coaches = JSON.parse(localStorage.getItem("forma2_coaches") || "[]");
  const coach = coaches.find((c) => c.coachId === currentUser.id);

  if (!coach) {
    toast("❌ Erreur coach");
    return;
  }

  if (coach.clients.some((c) => c.clientId === client.id)) {
    toast("❌ Ce client est déjà ajouté");
    return;
  }

  coach.clients.push({
    clientId: client.id,
    clientName: client.name,
    clientEmail: client.email,
    addedAt: new Date().toISOString()
  });

  // Update coach in storage
  coaches[coaches.indexOf(coach)] = coach;
  localStorage.setItem("forma2_coaches", JSON.stringify(coaches));

  // Update client to know their coach
  client.coachId = currentUser.id;
  const userIndex = users.indexOf(users.find((u) => u.id === client.id));
  users[userIndex] = client;
  localStorage.setItem("forma2_users", JSON.stringify(users));

  $("coach-add-email").value = "";
  toast("✅ Client ajouté");
  renderCoachDashboard();
}

function openConversation(userId, userName) {
  currentConversation = { userId, userName };
  renderConversationView();
}

function renderConversationView() {
  if (!currentConversation) return;

  const content = $("coach-content");
  const messages = getConversationMessages(currentUser.id, currentConversation.userId);

  let html = `
    <div style="display:flex;flex-direction:column;height:100%">
      <div style="padding-bottom:12px;border-bottom:1px solid var(--line);margin-bottom:12px">
        <button class="btn ghost sm" onclick="renderCoach()" style="width:auto">← Retour</button>
        <div class="t15" style="margin-top:8px">${currentConversation.userName}</div>
      </div>

      <div style="flex:1;overflow-y:auto;margin-bottom:12px" id="messages-container">
  `;

  if (messages.length === 0) {
    html += "<div class='sub' style='text-align:center;padding:20px'>Aucun message encore</div>";
  } else {
    messages.forEach((msg) => {
      const isOwn = msg.senderId === currentUser.id;
      html += `
        <div class="msg ${isOwn ? "user" : "coach"}">
          ${msg.text}
          <div class="msg-time">${new Date(msg.timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</div>
        </div>
      `;
    });
  }

  html += `
      </div>

      <div style="display:flex;gap:8px">
        <input type="text" id="message-input" placeholder="Message..." style="margin:0;flex:1">
        <button class="btn" onclick="sendMessage()" style="width:auto;padding:15px 18px">Envoyer</button>
      </div>
    </div>
  `;

  content.innerHTML = html;

  // Auto-scroll to bottom
  setTimeout(() => {
    const container = $("messages-container");
    if (container) container.scrollTop = container.scrollHeight;
  }, 100);

  // Mark messages as read
  messages.forEach((msg) => {
    if (msg.senderId !== currentUser.id) {
      msg.read = true;
    }
  });
  saveConversationMessages(currentUser.id, currentConversation.userId, messages);
}

function sendMessage() {
  const input = $("message-input");
  const text = input.value.trim();

  if (!text) {
    toast("❌ Message vide");
    return;
  }

  const message = {
    id: "msg_" + Date.now(),
    senderId: currentUser.id,
    senderName: currentUser.name,
    text,
    timestamp: new Date().toISOString(),
    read: false
  };

  const messages = getConversationMessages(currentUser.id, currentConversation.userId);
  messages.push(message);
  saveConversationMessages(currentUser.id, currentConversation.userId, messages);

  input.value = "";
  renderConversationView();
}

function getConversationMessages(userId1, userId2) {
  const key = [userId1, userId2].sort().join("_");
  return JSON.parse(localStorage.getItem(`forma2_messages_${key}`) || "[]");
}

function saveConversationMessages(userId1, userId2, messages) {
  const key = [userId1, userId2].sort().join("_");
  localStorage.setItem(`forma2_messages_${key}`, JSON.stringify(messages));
}

function getUnreadCount(userId1, userId2) {
  const messages = getConversationMessages(userId1, userId2);
  return messages.filter((m) => m.senderId === userId2 && !m.read).length;
}

// ============================================
// PROFILE SCREEN
// ============================================

function renderProfile() {
  if (!currentUser) return;

  $("profile-name").textContent = currentUser.name;
  $("profile-email").textContent = currentUser.email;
  $("profile-role").textContent = currentUserRole === "coach" ? "🏆 Coach" : "💪 Client";
}

// ============================================
// UTILITIES
// ============================================

function toast(message) {
  // Simple toast notification
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--card);
    border: 1px solid var(--line);
    color: var(--text);
    padding: 12px 16px;
    border-radius: 12px;
    font-size: 14px;
    z-index: 999;
    max-width: 300px;
    text-align: center;
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 2000);
}

// ============================================
// EVENT LISTENERS
// ============================================

function initializeEventListeners() {
  // Enter key to submit forms
  document.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      if (currentScreen === "login") {
        const activeTab = document.querySelector(".tab-btn.active");
        if (activeTab.dataset.tab === "signin") {
          handleSignIn();
        } else {
          handleSignUp();
        }
      }
    }
  });

  // Message input enter key
  document.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && $("message-input")) {
      if (document.activeElement === $("message-input")) {
        sendMessage();
      }
    }
  });
}

// ============================================
// THEME TOGGLE
// ============================================

function toggleTheme() {
  const phone = $("phone");
  const currentTheme = phone.dataset.theme || "dark";
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  phone.dataset.theme = newTheme;
  localStorage.setItem("forma2_theme", newTheme);
}

// Load saved theme
window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("forma2_theme");
  if (savedTheme) {
    $("phone").dataset.theme = savedTheme;
  }
});

console.log("✅ FORMA2 MVP App loaded");
