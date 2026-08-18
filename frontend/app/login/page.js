"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { apiError, apiFetch } from "../../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { login, user, loaded } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);


  // Somebody already signed in has no use for this form. Sent to their account
  // instead, which is where both flows end up on success anyway.
  useEffect(() => {
    if (loaded && user) router.replace("/account");
  }, [loaded, user, router]);

  if (loaded && user) return null;

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { response, data } = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        setMessage(apiError(data, "Login failed."));
        return;
      }
      login(data.user, data.token);
      router.push("/account");
    } catch {
      setMessage("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <div className="shell">
        <form className="b form-card" onSubmit={handleSubmit}>
          <h1>Trade login</h1>
          <p className="cp" style={{ marginTop: 4 }}>
            CAFÉS · MASJIDS · SUBSCRIBERS
          </p>

          <div className="form-row">
            <label className="cp" htmlFor="email">
              EMAIL
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="input"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>
          <div className="form-row">
            <label className="cp" htmlFor="password">
              PASSWORD
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="input"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="bt bp" style={{ marginTop: 16 }} disabled={loading}>
            {loading ? "Logging in…" : "Log in"}
          </button>
          {message ? <p className="msg">{message}</p> : null}
          <p style={{ marginTop: 14, fontSize: 13.5 }}>
            No account? <Link href="/register">Register</Link>
          </p>
        </form>
      </div>
    </main>
  );
}
