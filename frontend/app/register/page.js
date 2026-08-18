"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { apiError, apiErrorCode, apiFetch, apiFieldErrors } from "../../lib/api";
import {
  REGISTER_LABELS,
  passwordChecks,
  summarizeFields,
  validateRegister,
} from "../../lib/formRules";

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export default function RegisterPage() {
  const router = useRouter();
  const { login, user, loaded } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  // Which fields have been left at least once. Somebody who has not reached the
  // password box yet should not be told their password is too short.
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const [serverCode, setServerCode] = useState("");
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  // Bumped on every rejected submit so the effect below re-runs even when the
  // same problem is reported twice in a row.
  const [alertNonce, setAlertNonce] = useState(0);
  const alertRef = useRef(null);
  /*
   * Blur-validation inserts an error message under the field being left, which
   * pushes everything below it down. When the blur is caused by pressing the
   * submit button, that happens between pointerdown and pointerup: the button
   * moves out from under the cursor, mouseup lands on the form instead, and the
   * browser fires click on their common ancestor rather than on the button. The
   * press is swallowed and the form appears to do nothing.
   *
   * pointerdown fires before blur, so this flag is already set when it matters.
   * It is a ref and not state on purpose - setting state here would re-render
   * and cause the very shift it exists to prevent.
   */
  const submitPressRef = useRef(false);


  // Somebody already signed in has no use for this form. Sent to their account
  // instead, which is where both flows end up on success anyway.
  useEffect(() => {
    if (loaded && user) router.replace("/account");
  }, [loaded, user, router]);

  // The summary has to come to the reader, not wait to be found. Chrome's own
  // bubble anchors to the field and ends up off-screen or behind the password
  // manager, which is exactly the failure this replaces.
  useEffect(() => {
    if (alertNonce === 0) return;
    const node = alertRef.current;
    if (!node) return;
    node.scrollIntoView({ behavior: "smooth", block: "center" });
    node.focus({ preventScroll: true });
  }, [alertNonce]);

  if (loaded && user) return null;

  const check = validateRegister(form);
  const checklist = passwordChecks(form.password, {
    email: form.email,
    name: form.name,
  });

  // A server error outranks the client's guess about the same field: only the
  // server knows the address is already taken.
  const fieldErrors = {};
  Object.keys(REGISTER_LABELS).forEach((field) => {
    if (serverErrors[field]) fieldErrors[field] = serverErrors[field];
    else if (check.fields[field] && (submitted || touched[field])) {
      fieldErrors[field] = check.fields[field];
    }
  });

  // Inline errors appear on blur; the summary waits for a submit, so leaving
  // the first field does not immediately throw a red block on the screen.
  const hasServerError = Object.keys(serverErrors).length > 0;
  const summary =
    submitted || hasServerError ? summarizeFields(fieldErrors, REGISTER_LABELS) : [];
  const summaryTitle =
    summary.length === 1
      ? "One thing to sort out before we can open your account:"
      : `${summary.length} things to sort out before we can open your account:`;

  function focusField(field) {
    const node = document.getElementById(field);
    if (!node) return;
    node.focus();
    node.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function handleChange(event) {
    submitPressRef.current = false;
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    // The server verdict was about the value they just replaced.
    setServerErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  function handleBlur(event) {
    if (submitPressRef.current) return;
    const { name } = event.target;
    setTouched((current) => ({ ...current, [name]: true }));
  }

  function describedBy(field) {
    return fieldErrors[field] ? `${field}-error` : undefined;
  }

  function inputClass(field) {
    return fieldErrors[field] ? "input is-bad" : "input";
  }

  /*
   * Wired to the button's onClick as well as the form's onSubmit.
   *
   * onSubmit alone was not firing for a real mouse click on the button: the
   * browser dispatched click and the form dispatched submit, but React's
   * delegated handler never ran, so pressing Register did visibly nothing.
   * A handler on the button covers both paths, because implicit submission
   * (Enter inside a field) is specified to fire a click on the default submit
   * button too. preventDefault here cancels the submission, so onSubmit does
   * not fire afterwards and this never runs twice.
   */
  async function handleSubmit(event) {
    event.preventDefault();
    submitPressRef.current = false;
    setSubmitted(true);
    setFormError("");
    setNotice("");

    if (!validateRegister(form).valid) {
      setAlertNonce((current) => current + 1);
      return;
    }

    setLoading(true);
    try {
      const { response, data } = await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      });
      if (!response.ok) {
        setServerErrors(apiFieldErrors(data));
        setServerCode(apiErrorCode(data));
        setFormError(apiError(data, "Registration failed."));
        setAlertNonce((current) => current + 1);
        return;
      }

      let token = data.token;
      let account = data.user;

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
          setNotice("Account created. You can log in.");
          setForm(EMPTY_FORM);
          setSubmitted(false);
          setTouched({});
          return;
        }
        token = loginData.token;
        account = loginData.user;
      }

      login(account, token);
      router.push("/account");
    } catch {
      setFormError("Unable to connect to the server.");
      setAlertNonce((current) => current + 1);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <div className="shell">
        {/* noValidate: the browser's bubble shows one problem at a time, anchored
            to a field that may be scrolled out of view. The summary below shows
            all of them, in one place, at the top. */}
        <form className="b form-card" onSubmit={handleSubmit} noValidate>
          <h1>Open an account</h1>
          <p className="cp" style={{ marginTop: 4 }}>
            HOME OR TRADE
          </p>

          {summary.length > 0 || formError ? (
            <div className="form-alert" role="alert" tabIndex={-1} ref={alertRef}>
              <p className="form-alert-title">
                {summary.length > 0 ? summaryTitle : formError}
              </p>
              {summary.length > 0 ? (
                <ul>
                  {summary.map((item) => (
                    <li key={item.field}>
                      <button
                        type="button"
                        className="form-alert-jump"
                        onClick={() => focusField(item.field)}
                      >
                        {item.label}
                      </button>{" "}
                      — {item.message}
                    </li>
                  ))}
                </ul>
              ) : null}
              {serverCode === "EMAIL_TAKEN" ? (
                <p style={{ marginTop: 8, fontSize: 13.5 }}>
                  If that account is yours, <Link href="/login">log in instead</Link>.
                </p>
              ) : null}
            </div>
          ) : null}

          {check.notes.length > 0 ? (
            <div className="form-note">{check.notes[0]}</div>
          ) : null}

          {notice ? (
            <p className="msg" role="status">
              {notice}
            </p>
          ) : null}

          <div className="form-row">
            <label className="cp" htmlFor="name">
              NAME
            </label>
            <input
              id="name"
              name="name"
              type="text"
              className={inputClass("name")}
              value={form.name}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="name"
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={describedBy("name")}
            />
            {fieldErrors.name ? (
              <p id="name-error" className="field-error">
                {fieldErrors.name}
              </p>
            ) : null}
          </div>

          <div className="form-row">
            <label className="cp" htmlFor="email">
              EMAIL
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className={inputClass("email")}
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="email"
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={describedBy("email")}
            />
            {fieldErrors.email ? (
              <p id="email-error" className="field-error">
                {fieldErrors.email}
              </p>
            ) : null}
          </div>

          <div className="form-row">
            <label className="cp" htmlFor="password">
              PASSWORD
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className={inputClass("password")}
              value={form.password}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="new-password"
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={
                fieldErrors.password ? "password-error password-rules" : "password-rules"
              }
            />
            {fieldErrors.password ? (
              <p id="password-error" className="field-error">
                {fieldErrors.password}
              </p>
            ) : null}
            {/* Requirements are visible from the start, so nobody has to guess
                and then be corrected. */}
            <ul className="pw-checks" id="password-rules">
              {checklist.map((rule) => (
                <li
                  key={rule.id}
                  className={rule.ok ? "pw-check is-ok" : "pw-check"}
                >
                  <span className="pw-check-mark" aria-hidden="true">
                    {rule.ok ? "✓" : "○"}
                  </span>
                  <span>{rule.label}</span>
                  <span className="sr-only">
                    {rule.ok ? " — met" : " — not yet met"}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="form-row">
            <label className="cp" htmlFor="confirmPassword">
              CONFIRM PASSWORD
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              className={inputClass("confirmPassword")}
              value={form.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="new-password"
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
              aria-describedby={describedBy("confirmPassword")}
            />
            {fieldErrors.confirmPassword ? (
              <p id="confirmPassword-error" className="field-error">
                {fieldErrors.confirmPassword}
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            className="bt bp"
            style={{ marginTop: 16 }}
            disabled={loading}
            onPointerDown={() => {
              submitPressRef.current = true;
            }}
            onClick={handleSubmit}
          >
            {loading ? "Creating…" : "Register"}
          </button>
          <p style={{ marginTop: 14, fontSize: 13.5 }}>
            Already have an account? <Link href="/login">Log in</Link>
          </p>
        </form>
      </div>
    </main>
  );
}
