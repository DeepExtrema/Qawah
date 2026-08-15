"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";

export default function ProfilePage() {
  const { user, loaded, login } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
  });

  const [message, setMessage] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!loaded) return;

    if (!user) {
      setLoadingProfile(false);
      return;
    }

    async function loadProfile() {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(
          "http://localhost:5001/api/auth/me",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          setMessage(data.message || "Unable to load profile.");
          return;
        }

        setForm({
          name: data.name,
          email: data.email,
        });
      } catch (error) {
        setMessage("Unable to connect to the server.");
      } finally {
        setLoadingProfile(false);
      }
    }

    loadProfile();
  }, [loaded, user]);

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5001/api/auth/me",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Unable to update profile.");
        return;
      }

      login(data.user, token);
      setMessage("Profile updated successfully!");
    } catch (error) {
      setMessage("Unable to connect to the server.");
    }
  }

  if (!loaded || loadingProfile) {
    return (
      <main>
        <p>Loading...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main>
        <h1>Profile</h1>
        <p>Please log in to view your profile.</p>
        <Link href="/login">Login</Link>
      </main>
    );
  }

  return (
    <main>
      <h1>My Profile</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Name</label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit">Update Profile</button>
      </form>

      {message && <p>{message}</p>}

      <br />

      <Link href="/">← Back to Store</Link>
    </main>
  );
}