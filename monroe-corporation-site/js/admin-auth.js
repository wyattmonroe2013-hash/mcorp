import { db, firebaseConfigReady } from "./firebase.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const SESSION_KEY = "monroe_admin_session";
const SESSION_LENGTH_MS = 8 * 60 * 60 * 1000;
const ADMIN_COLLECTION = "administrativeAccounts";

const infoPanel = document.getElementById("admin-info-panel");
const authPanels = document.getElementById("admin-auth-panels");
const dashboard = document.getElementById("admin-dashboard");
const loginForm = document.getElementById("admin-login-form");
const registerForm = document.getElementById("admin-register-form");
const loginStatus = document.getElementById("login-status");
const registerStatus = document.getElementById("register-status");
const sessionSummary = document.getElementById("admin-session-summary");
const sessionBadges = document.getElementById("admin-session-badges");
const logoutButton = document.getElementById("admin-logout");

function setStatus(element, message, type = "info") {
  if (!element) return;
  element.textContent = message;
  element.dataset.type = type;
}

function normalizeUsername(value) {
  return String(value || "").trim().toLowerCase();
}

function validateAdministrativeUsername(value) {
  const username = String(value || "").trim();

  if (!/^[A-Za-z0-9._-]{3,32}$/.test(username)) {
    throw new Error("Administrative usernames must be 3 to 32 characters and may only use letters, numbers, periods, underscores, or hyphens.");
  }

  return username;
}

function requireFirebaseConfig() {
  if (!firebaseConfigReady) {
    throw new Error("Firebase is not configured yet. Update js/firebase.js with your Emerald Games Firebase project settings.");
  }
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
    if (!session || session.role !== "administrator" || Date.now() > session.expiresAt) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }

    return session;
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function writeSession(adminAccount) {
  const session = {
    adminUsername: adminAccount.username,
    displayName: adminAccount.displayName || adminAccount.username,
    emeraldUsername: adminAccount.emeraldUsername || "",
    role: "administrator",
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_LENGTH_MS
  };

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

function showDashboard(session) {
  if (infoPanel) infoPanel.hidden = true;
  if (authPanels) authPanels.hidden = true;
  if (dashboard) dashboard.hidden = false;

  if (sessionSummary) {
    const expires = new Date(session.expiresAt).toLocaleString();
    const displayName = session.displayName || session.adminUsername;
    const emeraldLink = session.emeraldUsername ? ` Linked Emerald Games admin: ${session.emeraldUsername}.` : "";
    sessionSummary.textContent = `Signed in as ${displayName} (${session.adminUsername}). Session expires ${expires}.${emeraldLink}`;
  }

  if (sessionBadges) {
    const badges = [
      `<span>Administrative Account</span>`,
      `<span>Role: Administrator</span>`
    ];

    if (session.emeraldUsername) {
      badges.push(`<span>Emerald Verified: ${escapeHtml(session.emeraldUsername)}</span>`);
    }

    sessionBadges.innerHTML = badges.join("");
  }
}

function showLogin() {
  if (infoPanel) infoPanel.hidden = false;
  if (authPanels) authPanels.hidden = false;
  if (dashboard) dashboard.hidden = true;
  if (sessionBadges) sessionBadges.innerHTML = "";
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function findEmeraldUser(username) {
  const trimmedUsername = String(username || "").trim();
  const lowerUsername = normalizeUsername(trimmedUsername);
  const usersRef = collection(db, "users");

  // Supports projects where the Emerald Games user document ID is the username.
  const directDoc = await getDoc(doc(db, "users", trimmedUsername));
  if (directDoc.exists()) return { id: directDoc.id, data: directDoc.data() };

  const lowerDoc = await getDoc(doc(db, "users", lowerUsername));
  if (lowerDoc.exists()) return { id: lowerDoc.id, data: lowerDoc.data() };

  // Supports projects where documents have a username field.
  const usernameQuery = query(usersRef, where("username", "==", trimmedUsername), limit(1));
  const usernameSnapshot = await getDocs(usernameQuery);

  if (!usernameSnapshot.empty) {
    const userDoc = usernameSnapshot.docs[0];
    return { id: userDoc.id, data: userDoc.data() };
  }

  const lowerQuery = query(usersRef, where("username", "==", lowerUsername), limit(1));
  const lowerSnapshot = await getDocs(lowerQuery);

  if (!lowerSnapshot.empty) {
    const userDoc = lowerSnapshot.docs[0];
    return { id: userDoc.id, data: userDoc.data() };
  }

  return null;
}

async function verifyEmeraldAdminAccount(username, password) {
  requireFirebaseConfig();

  const emeraldUser = await findEmeraldUser(username);

  if (!emeraldUser) {
    throw new Error("No Emerald Games account was found with that username.");
  }

  const userData = emeraldUser.data;

  if (!userData.passwordHash) {
    throw new Error("This Emerald Games account does not have a passwordHash field.");
  }

  const enteredHash = await sha256Hex(password);
  const storedHash = String(userData.passwordHash).toLowerCase();

  if (enteredHash !== storedHash) {
    throw new Error("Incorrect Emerald Games password.");
  }

  if (String(userData.role || "").toLowerCase() !== "admin") {
    throw new Error("This Emerald Games account is valid, but it is not an admin account.");
  }

  return {
    id: emeraldUser.id,
    username: userData.username || username,
    usernameLower: normalizeUsername(userData.username || username),
    role: "admin",
    role2: userData.role2 || ""
  };
}

async function findAdministrativeAccount(username) {
  const normalizedUsername = normalizeUsername(username);
  const directDoc = await getDoc(doc(db, ADMIN_COLLECTION, normalizedUsername));

  if (directDoc.exists()) {
    return { id: directDoc.id, data: directDoc.data() };
  }

  const accountsRef = collection(db, ADMIN_COLLECTION);
  const usernameQuery = query(accountsRef, where("usernameLower", "==", normalizedUsername), limit(1));
  const usernameSnapshot = await getDocs(usernameQuery);

  if (!usernameSnapshot.empty) {
    const accountDoc = usernameSnapshot.docs[0];
    return { id: accountDoc.id, data: accountDoc.data() };
  }

  return null;
}

async function createAdministrativeAccount(formData) {
  requireFirebaseConfig();

  const emeraldUsername = String(formData.get("emeraldUsername") || "").trim();
  const emeraldPassword = String(formData.get("emeraldPassword") || "");
  const adminUsername = validateAdministrativeUsername(formData.get("adminUsername"));
  const adminUsernameLower = normalizeUsername(adminUsername);
  const displayName = String(formData.get("displayName") || "").trim();
  const adminPassword = String(formData.get("adminPassword") || "");
  const adminPasswordConfirm = String(formData.get("adminPasswordConfirm") || "");

  if (!emeraldUsername || !emeraldPassword) {
    throw new Error("Enter the Emerald Games admin username and password.");
  }

  if (adminPassword.length < 8) {
    throw new Error("Administrative passwords must be at least 8 characters.");
  }

  if (adminPassword !== adminPasswordConfirm) {
    throw new Error("The administrative passwords do not match.");
  }

  const existingAccount = await findAdministrativeAccount(adminUsernameLower);
  if (existingAccount) {
    throw new Error("That administrative username is already registered.");
  }

  const emeraldAdmin = await verifyEmeraldAdminAccount(emeraldUsername, emeraldPassword);
  const adminPasswordHash = await sha256Hex(adminPassword);

  const accountData = {
    username: adminUsername,
    usernameLower: adminUsernameLower,
    displayName: displayName || adminUsername,
    passwordHash: adminPasswordHash,
    role: "administrator",
    status: "active",
    enabled: true,
    emeraldUsername: emeraldAdmin.username,
    emeraldUsernameLower: emeraldAdmin.usernameLower,
    emeraldUserId: emeraldAdmin.id,
    emeraldRole: emeraldAdmin.role,
    emeraldRole2: emeraldAdmin.role2,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastLoginAt: null
  };

  await setDoc(doc(db, ADMIN_COLLECTION, adminUsernameLower), accountData);

  return {
    username: accountData.username,
    displayName: accountData.displayName,
    emeraldUsername: accountData.emeraldUsername,
    role: accountData.role
  };
}

async function loginAdministrativeAccount(formData) {
  requireFirebaseConfig();

  const adminUsername = String(formData.get("adminUsername") || "").trim();
  const adminPassword = String(formData.get("adminPassword") || "");

  if (!adminUsername || !adminPassword) {
    throw new Error("Enter both the administrative username and password.");
  }

  const account = await findAdministrativeAccount(adminUsername);

  if (!account) {
    throw new Error("No Monroe Corporation administrative account was found with that username.");
  }

  const accountData = account.data;

  if (accountData.enabled === false || String(accountData.status || "active").toLowerCase() !== "active") {
    throw new Error("This administrative account is disabled.");
  }

  if (String(accountData.role || "").toLowerCase() !== "administrator") {
    throw new Error("This account is not authorized for Monroe Corporation administration.");
  }

  if (!accountData.passwordHash) {
    throw new Error("This administrative account does not have a passwordHash field.");
  }

  const enteredHash = await sha256Hex(adminPassword);
  const storedHash = String(accountData.passwordHash).toLowerCase();

  if (enteredHash !== storedHash) {
    throw new Error("Incorrect administrative password.");
  }

  await updateDoc(doc(db, ADMIN_COLLECTION, account.id), {
    lastLoginAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return {
    username: accountData.username || adminUsername,
    displayName: accountData.displayName || accountData.username || adminUsername,
    emeraldUsername: accountData.emeraldUsername || "",
    role: "administrator"
  };
}

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = loginForm.querySelector("button[type='submit']");
    if (submitButton) submitButton.disabled = true;
    setStatus(loginStatus, "Signing in...", "info");

    try {
      const adminAccount = await loginAdministrativeAccount(new FormData(loginForm));
      const session = writeSession(adminAccount);
      loginForm.reset();
      setStatus(loginStatus, "Access granted.", "success");
      showDashboard(session);
    } catch (error) {
      setStatus(loginStatus, error.message || "Unable to sign in.", "error");
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
}

if (registerForm) {
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = registerForm.querySelector("button[type='submit']");
    if (submitButton) submitButton.disabled = true;
    setStatus(registerStatus, "Verifying Emerald Games admin account and creating administrative account...", "info");

    try {
      const adminAccount = await createAdministrativeAccount(new FormData(registerForm));
      const session = writeSession(adminAccount);
      registerForm.reset();
      setStatus(registerStatus, "Administrative account created. Access granted.", "success");
      showDashboard(session);
    } catch (error) {
      setStatus(registerStatus, error.message || "Unable to create the administrative account.", "error");
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
}

if (logoutButton) {
  logoutButton.addEventListener("click", () => {
    sessionStorage.removeItem(SESSION_KEY);
    showLogin();
    setStatus(loginStatus, "Signed out.", "info");
    setStatus(registerStatus, "", "info");
  });
}

const existingSession = readSession();
if (existingSession) {
  showDashboard(existingSession);
} else {
  showLogin();
}
