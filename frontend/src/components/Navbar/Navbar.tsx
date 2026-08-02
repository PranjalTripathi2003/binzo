import { useNavigate } from "react-router-dom";
import styles from "./Navbar.module.css";
import { useEffect, useRef, useState } from "react";
import {
  getCurrentUser,
  logout,
  type AuthUser,
} from "../../services/auth";
import AuthModal from "../AuthModal/AuthModal";
import { useCart } from "../../context/CartContext";
/**
 * Learning TODO map for frontend/backend connection:
 * - Auth: use services/auth.ts from this file for login/register/me/logout.
 * - Cart: use services/cart.ts when opening the cart and changing quantities.
 * - Checkout: use services/orders.ts createOrder() from the Pay Now button.
 */
const Navbar = () => {
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [authModal, setAuthModal] = useState<"login" | "register" | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const navigate = useNavigate();
  const accountDropdownRef = useRef<HTMLDivElement>(null);
  const { itemCount, refreshCart } = useCart();

  useEffect(() => {
    document.body.style.overflow = isCartOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isCartOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        accountDropdownRef.current &&
        !accountDropdownRef.current.contains(event.target as Node)
      ) {
        setIsAccountOpen(false);
      }
    };

    if (isAccountOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isAccountOpen]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser(null);
      return;
    }

    getCurrentUser()
      .then((currentUser) => setUser(currentUser))
      .catch(() => setUser(null));
  }, []);

  const handleAuthSuccess = (loggedInUser: AuthUser) => {
    setUser(loggedInUser);
    setIsAccountOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      localStorage.removeItem("access_token");
      setUser(null);
      setIsAccountOpen(false);
    }
  };

  return (
    <>
      <nav className={styles.navbar}>
        <div className={styles.left}>
          <h1 className={styles.logo}>
            <span className={styles.logoPrimary} onClick={() => navigate("/")}>
              Bin
            </span>
            <span className={styles.logoAccent} onClick={() => navigate("/")}>
              zo
            </span>
          </h1>
          <p className={styles.delivery}>Delivery in 10 minutes</p>
        </div>

        <div className={styles.center}>
          <div className={styles.searchBox}>
            <i className="fa-solid fa-magnifying-glass"></i>
            <input placeholder="Search for Grocery..." />
          </div>
        </div>

        <div className={styles.right}>
          {user ? (
            <div className={styles.accountMenu}>
              <button
                className={styles.accountButton}
                onClick={() => setIsAccountOpen((isOpen) => !isOpen)}
                aria-expanded={isAccountOpen}
                aria-haspopup="menu"
              >
                Account
                <i className="fa-solid fa-caret-down"></i>
              </button>

              {isAccountOpen && (
                <div
                  className={styles.dropdown}
                  role="menu"
                  ref={accountDropdownRef}
                >
                  <h3>{user.name ?? user.email}</h3>
                  <p className={styles.phone}>{user.email}</p>
                  {user.role === "admin" && (
                    <button
                      className={`${styles.dropdownItem} ${styles.adminItem}`}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setIsAccountOpen(false);
                        navigate("/admin");
                      }}
                    >
                      <i className="fa-solid fa-shield-halved" aria-hidden="true" />
                      Admin Panel
                    </button>
                  )}
                  <button
                    className={styles.dropdownItem}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsAccountOpen(false);
                      navigate("/orders");
                    }}
                  >
                    My Orders
                  </button>
                  <button
                    className={styles.dropdownItem}
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              className={styles.authButton}
              onClick={() => setAuthModal("login")}
            >
              Login / Signup
            </button>
          )}

          <button
            className={styles.cartButton}
            onClick={() => {
              setIsAccountOpen(false);
              setIsCartOpen(true);
              refreshCart();
            }}
          >
            <i className="fa-solid fa-cart-shopping"></i>
            My Cart
            {itemCount > 0 && (
              <span className={styles.cartBadge}>{itemCount}</span>
            )}
          </button>
        </div>
      </nav>

      {isCartOpen && (
        <div
          className={styles.cartOverlay}
          role="dialog"
          aria-modal="true"
          aria-label="Shopping cart"
          onClick={() => setIsCartOpen(false)}
        >
          <aside
            className={styles.cartPanel}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className={styles.cartCloseButton}
              onClick={() => setIsCartOpen(false)}
              aria-label="Close cart"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            <div className={styles.cartPanelContent}>
              <section className={styles.cartCard}>
                <div className={styles.deliveryHeader}>
                  <i className="fa-solid fa-stopwatch"></i>
                  <div>
                    <h2>Delivery in 10 minutes</h2>
                    {/* TODO(cart): Replace this with the real cart item count from getCart(). */}
                    <p>Shipment of 1 item</p>
                  </div>
                </div>

                {/* TODO(cart): Replace this placeholder with cart_items returned by services/cart.ts getCart(). */}
                <div className={styles.cartItem}>
                  <div className={styles.itemImage}></div>
                  <div className={styles.itemInfo}>
                    <h3>Item Name</h3>
                    <p>Qty.</p>
                  </div>
                  <div className={styles.quantityControl}>
                    <button aria-label="Decrease quantity">−</button>
                    <span>1</span>
                    <button aria-label="Increase quantity">+</button>
                  </div>
                </div>
              </section>

              <section className={styles.cartCard}>
                <h2 className={styles.cardTitle}>Bill Details</h2>
                <div className={styles.billRow}>
                  <span>
                    <i className="fa-solid fa-receipt"></i>
                    Items Total
                  </span>
                  <strong>XX</strong>
                </div>
                {/* TODO(cart): Calculate Items Total from cart item price * quantity. */}
                <div className={styles.billRow}>
                  <span>
                    <i className="fa-solid fa-motorcycle"></i>
                    Delivery Charge
                  </span>
                  <strong>XX</strong>
                </div>
                <div className={`${styles.billRow} ${styles.grandTotal}`}>
                  <span>Grand Total</span>
                  <strong>XX</strong>
                </div>
              </section>

              <section className={styles.cartCard}>
                <h2 className={styles.cardTitle}>Cancellation Policy</h2>
                <p className={styles.policyText}>
                  Orders cannot be cancelled once packed for delivery. In case
                  of unexpected delays, a refund will be provided, if
                  applicable.
                </p>
              </section>
            </div>

            <section className={`${styles.cartCard} ${styles.cartFooter}`}>
              <div className={styles.addressHeader}>
                <i className="fa-solid fa-location-dot"></i>
                <div>
                  <h2>Delivering to Username</h2>
                  <p>Salt Lake City, USA</p>
                </div>
              </div>

              <div className={styles.payBar}>
                <span>
                  <strong>XX</strong>
                  Total
                </span>
                {/* TODO(orders): Call createOrder() from services/orders.ts, then clear/refresh the cart UI. */}
                <button>Pay Now</button>
              </div>
            </section>
          </aside>
        </div>
      )}

      {authModal && (
        <AuthModal
          mode={authModal}
          onClose={() => setAuthModal(null)}
          onAuthSuccess={handleAuthSuccess}
        />
      )}
    </>
  );
};

export default Navbar;
