"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { apiError, apiFetch } from "../../lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { response, data } = await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        setMessage(apiError(data, "Registration failed."));
        return;
      }

      let token = data.token;
      let user = data.user;

      if (!token) {
        const { response: loginResponse, data: loginData } = await apiFetch(
          "/api/auth/login",
          {
            method: "POST",
            body: JSON.stringify({
              email: form.email,
              password: form.password,
            }),
          }
        );
        if (!loginResponse.ok || !loginData.token) {
          setMessage("Account created. You can log in.");
          setForm({ name: "", email: "", password: "" });
          return;
        }
        token = loginData.token;
        user = loginData.user;
      }

      login(user, token);
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
          <h1>Open an account</h1>
          <p className="cp" style={{ marginTop: 4 }}>
            HOME OR TRADE
          </p>

          <div className="form-row">
            <label className="cp" htmlFor="name">
              NAME
            </label>
            <input
              id="name"
              name="name"
              type="text"
              className="input"
              value={form.name}
              onChange={handleChange}
              required
              autoComplete="name"
            />
          </div>
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
              minLength={6}
              required
              autoComplete="new-password"
            />
          </div>
          <button type="submit" className="bt bp" style={{ marginTop: 16 }} disabled={loading}>
            {loading ? "Creating…" : "Register"}
          </button>
          {message ? <p className="msg">{message}</p> : null}
          <p style={{ marginTop: 14, fontSize: 13.5 }}>
            Already have an account? <Link href="/login">Log in</Link>
          </p>
        </form>
      </div>
    </main>
  );
}
