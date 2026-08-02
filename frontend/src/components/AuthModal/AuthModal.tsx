import { useEffect, useRef, useState } from "react";
import {
  getCurrentUser,
  login,
  register,
  type AuthUser,
} from "../../services/auth";
import styles from "./AuthModal.module.css";

type AuthModalProps = {
  /** Which panel to open initially */
  mode: "login" | "register";
  onClose: () => void;
  onAuthSuccess: (user: AuthUser) => void;
};

const AuthModal = ({ mode, onClose, onAuthSuccess }: AuthModalProps) => {
  const [view, setView] = useState<"login" | "register">(mode);

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Register fields
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regError, setRegError] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);

  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Close on Escape key
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const result = await login({ email: loginEmail, password: loginPassword });
      localStorage.setItem("access_token", result.access_token);
      const currentUser = await getCurrentUser();
      onAuthSuccess(currentUser);
      onClose();
    } catch {
      setLoginError("Invalid email or password. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    setRegLoading(true);
    try {
      const result = await register({
        name: regName,
        email: regEmail,
        password: regPassword,
      });
      localStorage.setItem("access_token", result.access_token);
      const currentUser = await getCurrentUser();
      onAuthSuccess(currentUser);
      onClose();
    } catch {
      setRegError("Registration failed. Please check your details and try again.");
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div
      className={styles.overlay}
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={view === "login" ? "Login" : "Register"}
    >
      <div className={styles.modal}>
        {/* Close button */}
        <button
          className={styles.closeButton}
          type="button"
          onClick={onClose}
          aria-label="Close modal"
        >
          <i className="fa-solid fa-xmark" />
        </button>

        {/* Logo */}
        <div className={styles.logoRow}>
          <span className={styles.logoPrimary}>Bin</span>
          <span className={styles.logoAccent}>zo</span>
        </div>

        {view === "login" ? (
          <form className={styles.form} onSubmit={handleLogin} noValidate>
            <h2 className={styles.heading}>Login to your Binzo account</h2>

            <div className={styles.fieldGroup}>
              <input
                id="login-email"
                className={styles.input}
                type="email"
                placeholder="Email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
              <input
                id="login-password"
                className={styles.input}
                type="password"
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {loginError && (
              <p className={styles.errorMsg} role="alert">
                {loginError}
              </p>
            )}

            <button
              id="login-submit"
              className={styles.submitButton}
              type="submit"
              disabled={loginLoading}
            >
              {loginLoading ? "Logging in…" : "Login"}
            </button>

            <p className={styles.switchText}>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                className={styles.switchLink}
                onClick={() => {
                  setLoginError("");
                  setView("register");
                }}
              >
                Register
              </button>
            </p>
          </form>
        ) : (
          <form className={styles.form} onSubmit={handleRegister} noValidate>
            <h2 className={styles.heading}>Register for&nbsp;Binzo account</h2>

            <div className={styles.fieldGroup}>
              <input
                id="reg-name"
                className={styles.input}
                type="text"
                placeholder="Name"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                required
                autoComplete="name"
                autoFocus
              />
              <input
                id="reg-email"
                className={styles.input}
                type="email"
                placeholder="Email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <input
                id="reg-phone"
                className={styles.input}
                type="tel"
                placeholder="Phone"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                autoComplete="tel"
              />
              <input
                id="reg-password"
                className={styles.input}
                type="password"
                placeholder="Password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            {regError && (
              <p className={styles.errorMsg} role="alert">
                {regError}
              </p>
            )}

            <button
              id="register-submit"
              className={styles.submitButton}
              type="submit"
              disabled={regLoading}
            >
              {regLoading ? "Signing up…" : "Signup"}
            </button>

            <p className={styles.switchText}>
              Already have an account?{" "}
              <button
                type="button"
                className={styles.switchLink}
                onClick={() => {
                  setRegError("");
                  setView("login");
                }}
              >
                Login
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
