import { db, firebaseConfigReady } from "./firebase.js";
import {
  collection,
  getDocs,
  limit,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const SESSION_KEY = "monroe_admin_session";
const SESSION_LENGTH_MS = 8 * 60 * 60 * 1000;

const loginPanel = document.getElementById("admin-login-panel");
const dashboard = document.getElementById("admin-dashboard");
const loginForm = document.getElementById("admin-login-form");
const statusEl = document.getElementById("admin-status");
const sessionSummary = document.getElementById("admin-session-summary");
const logoutButton = document.getElementById("admin-logout");

function setStatus(message, type = "info") {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.dataset.type = type;
}

async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function readSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    const session = JSON.parse(raw);
    if (!session || session.role !== "admin" || Date.now() > session.expiresAt) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }

    return session;
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function writeSession(user) {
  const session = {
    username: user.username,
    role: "admin",
    role2: user.role2 || "",
    verifiedAt: Date.now(),
    expiresAt: Date.now() + SESSION_LENGTH_MS
  };

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

function showDashboard(session) {
  if (loginPanel) loginPanel.hidden = true;
  if (dashboard) dashboard.hidden = false;

  if (sessionSummary) {
    const expires = new Date(session.expiresAt).toLocaleString();
    const secondaryRole = session.role2 ? ` Secondary role: ${session.role2}.` : "";
    sessionSummary.textContent = `Signed in as ${session.username}. Session expires ${expires}.${secondaryRole}`;
  }
}

function showLogin() {
  if (loginPanel) loginPanel.hidden = false;
  if (dashboard) dashboard.hidden = true;
}

async function findEmeraldUser(username) {
  const usersRef = collection(db, "users");
  const usernameQuery = query(usersRef, where("username", "==", username), limit(1));
  const usernameSnapshot = await getDocs(usernameQuery);

  if (!usernameSnapshot.empty) {
    return usernameSnapshot.docs[0].data();
  }

  const lowerQuery = query(usersRef, where("username", "==", username.toLowerCase()), limit(1));
  const lowerSnapshot = await getDocs(lowerQuery);

  if (!lowerSnapshot.empty) {
    return lowerSnapshot.docs[0].data();
  }

  return null;
}

async function verifyAdminAccount(username, password) {
  if (!firebaseConfigReady) {
    throw new Error("Firebase is not configured yet. Update js/firebase.js with your Emerald Games Firebase project settings.");
  }

  const user = await findEmeraldUser(username.trim());

  if (!user) {
    throw new Error("No Emerald Games account was found with that username.");
  }

  if (!user.passwordHash) {
    throw new Error("This account does not have a passwordHash field.");
  }

  const enteredHash = await sha256Hex(password);
  const storedHash = String(user.passwordHash).toLowerCase();

  if (enteredHash !== storedHash) {
    throw new Error("Incorrect password.");
  }

  if (String(user.role || "").toLowerCase() !== "admin") {
    throw new Error("This Emerald Games account is valid, but it is not an admin account.");
  }

  return {
    username: user.username || username,
    role: "admin",
    role2: user.role2 || ""
  };
}

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(loginForm);
    const username = String(formData.get("username") || "").trim();
    const password = String(formData.get("password") || "");

    if (!username || !password) {
      setStatus("Enter both a username and password.", "error");
      return;
    }

    const submitButton = loginForm.querySelector("button[type='submit']");
    if (submitButton) submitButton.disabled = true;
    setStatus("Verifying account...", "info");

    try {
      const adminUser = await verifyAdminAccount(username, password);
      const session = writeSession(adminUser);
      loginForm.reset();
      setStatus("Access granted.", "success");
      showDashboard(session);
    } catch (error) {
      setStatus(error.message || "Unable to verify the administrative account.", "error");
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
}

if (logoutButton) {
  logoutButton.addEventListener("click", () => {
    sessionStorage.removeItem(SESSION_KEY);
    showLogin();
    setStatus("Signed out.", "info");
  });
}

const existingSession = readSession();
if (existingSession) {
  showDashboard(existingSession);
} else {
  showLogin();
}
