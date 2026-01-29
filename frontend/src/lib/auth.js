export function setAuth({ token, peran, user }) {
  localStorage.setItem("token", token);
  localStorage.setItem("peran", peran);
  if (user) localStorage.setItem("user", JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("peran");
  localStorage.removeItem("user");
}

export function getToken() {
  return localStorage.getItem("token");
}

export function getPeran() {
  return localStorage.getItem("peran");
}

export function isLoggedIn() {
  return !!getToken();
}
