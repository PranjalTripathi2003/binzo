import { useNavigate } from "react-router-dom";
import styles from "./Navbar.module.css";
import { useEffect, useState } from "react";

const Navbar = () => {
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = isCartOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isCartOpen]);

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
              <div className={styles.dropdown} role="menu">
                <h3>Username</h3>
                <p className={styles.phone}>xxxxxxxxx</p>
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
                >
                  Saved Addresses
                </button>
                <button
                  className={styles.dropdownItem}
                  type="button"
                  role="menuitem"
                >
                  Log Out
                </button>
              </div>
            )}
          </div>

          <button
            className={styles.cartButton}
            onClick={() => {
              setIsAccountOpen(false);
              setIsCartOpen(true);
            }}
          >
            <i className="fa-solid fa-cart-shopping"></i>
            My Cart
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
                    <p>Shipment of 1 item</p>
                  </div>
                </div>

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
                <button>Pay Now</button>
              </div>
            </section>
          </aside>
        </div>
      )}
    </>
  );
};

export default Navbar;
