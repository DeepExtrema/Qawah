"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { apiError, apiFetch } from "../../lib/api";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loaded, login, logout } = useAuth();

  const [form, setForm] = useState({ name: "", email: "" });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Seed the form from the server rather than from the cached user object, so
  // an edit made in another tab is not silently overwritten by a stale value.
  useEffect(() => {
    if (!loaded || !user) return;
    let cancelled = false;

    async function loadProfile() {
      const { response, data } = await apiFetch("/api/auth/me");
      if (cancelled) return;
      if (response.ok) {
        setForm({ name: data.name || "", email: data.email || "" });
      } else {
        setForm({ name: user.name || "", email: user.email || "" });
      }
    }

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [loaded, user]);

  if (!loaded) {
    return (
      <main className="page">
        <div className="shell empty">
          <p className="cp">LOADING</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="page">
        <div className="shell empty">
          <h1>Profile</h1>
          <p className="cp" style={{ marginTop: 8 }}>
            SIGN IN TO VIEW YOUR DETAILS
          </p>
          <Link href="/login" className="bt bp" style={{ marginTop: 16 }}>
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setStatus("");
    setError("");

    try {
      const { response, data } = await apiFetch("/api/auth/me", {
        method: "PUT",
        body: JSON.stringify({ name: form.name, email: form.email }),
      });

      if (!response.ok) {
        setError(apiError(data, "Could not save your details."));
        return;
      }

      // Refresh the cached user so the header greeting updates immediately.
      // The existing token stays valid: the id and role inside it are unchanged.
      const token = localStorage.getItem("token") || "";
      login(data.user, token);
      setStatus("Saved.");
    } catch {
      setError("Unable to reach the server.");
    } finally {
      setSaving(false);
    }
  }

  function handleSignOut() {
    logout();
    router.push("/");
  }

  return (
    <main className="page">
      <div className="shell">
        <div className="crumbs">
          <span className="cp">
            <Link href="/account">ACCOUNT</Link> / PROFILE
          </span>
        </div>

        <div className="acct-head">
          <h1>Profile</h1>
          <span className="cp">{String(user.role || "customer").toUpperCase()}</span>
        </div>

        <div className="profile-grid">
          <form className="b form-card" onSubmit={handleSubmit}>
            <div className="cp">YOUR DETAILS</div>

            <div className="form-row">
              <label className="cp" htmlFor="profile-name">
                NAME
              </label>
              <input
                id="profile-name"
                className="input"
                value={form.name}
                autoComplete="name"
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="form-row">
              <label className="cp" htmlFor="profile-email">
                EMAIL
              </label>
              <input
                id="profile-email"
                className="input"
                type="email"
                value={form.email}
                autoComplete="email"
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="bt bp" style={{ marginTop: 12 }} disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </button>

            {status ? (
              <p className="cp" style={{ marginTop: 8, color: "var(--acc)" }}>
                {status.toUpperCase()}
              </p>
            ) : null}
            {error ? <p className="field-error">{error}</p> : null}
          </form>

          <aside className="b profile-side">
            <div className="cp">ACCOUNT</div>
            <Link href="/account" className="profile-link">
              Orders and addresses
            </Link>
            <Link href="/wishlist" className="profile-link">
              Saved lots
            </Link>
            {user.role === "admin" ? (
              <Link href="/admin" className="profile-link">
                Admin desk
              </Link>
            ) : null}
            <div className="hr" style={{ margin: "12px 0", background: "var(--hair)" }} />
            <button type="button" className="bt" onClick={handleSignOut}>
              Sign out
            </button>
          </aside>
        </div>
      </div>
    </main>
  );
}
