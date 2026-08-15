"use client";

import Link from "next/link";
import { useAuth } from "../context/AuthContext";

export default function AuthStatus() {
  const { user, logout, loaded } = useAuth();

  if (!loaded) {
    return null;
  }

  if (user) {
    return (
      <div>
        <p>Welcome, {user.name}</p>

        <p>
          <Link href="/profile">
            My Profile
          </Link>
        </p>

        {user.role === "admin" && (
          <p>
            <Link href="/admin">
              Admin Dashboard
            </Link>
          </p>
        )}

        <button onClick={logout}>
          Logout
        </button>
      </div>
    );
  }

  return (
    <div>
      <Link href="/login">Login</Link>
      {" | "}
      <Link href="/register">Register</Link>
    </div>
  );
}