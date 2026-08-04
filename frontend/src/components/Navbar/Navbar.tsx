import { useNavigate } from "react-router-dom";
import styles from "./Navbar.module.css";
import { useEffect, useRef, useState } from "react";
import { getCurrentUser, logout, type AuthUser } from "../../services/auth";
import { getProducts } from "../../services/catalog";
import type { Product } from "../../data/products";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [deliveryMinutes] = useState(() => {
    const storedMinutes = sessionStorage.getItem("delivery_minutes");
    if (storedMinutes) return Number(storedMinutes);

    const minutes = Math.floor(Math.random() * 26) + 5;
    sessionStorage.setItem("delivery_minutes", String(minutes));
    return minutes;
  });
  const [locationLabel, setLocationLabel] = useState("Detecting location...");
  const [locationRequestId, setLocationRequestId] = useState(0);
  const navigate = useNavigate();
  const accountDropdownRef = useRef<HTMLDivElement>(null);
  const {
    itemCount,
    totalAmount,
    items,
    refreshCart,
    setVariantQuantity,
    mergeLocalCart,
  } = useCart();

  useEffect(() => {
    document.body.style.overflow = isCartOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isCartOpen]);

  useEffect(() => {
    if (isCartOpen && itemCount === 0) {
      setIsCartOpen(false);
    }
  }, [isCartOpen, itemCount]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        accountDropdownRef.current &&
        !accountDropdownRef.current.contains(event.target as Node)
      ) {
        setIsAccountOpen(false);
      }
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

  useEffect(() => {
    const query = searchQuery.trim();
    if (query.length < 2) {
      setSearchResults([]);
      setIsSearchLoading(false);
      return;
    }

    const handle = window.setTimeout(async () => {
      setIsSearchLoading(true);
      try {
        const results = await getProducts(undefined, query);
        setSearchResults(results.slice(0, 6));
      } catch (error) {
        console.error(error);
        setSearchResults([]);
      } finally {
        setIsSearchLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(handle);
  }, [searchQuery]);

  useEffect(() => {
    const savedLocation = localStorage.getItem("delivery_location_label");
    if (savedLocation && locationRequestId === 0) {
      setLocationLabel(savedLocation);
      return;
    }

    if (!navigator.geolocation) {
      setLocationLabel("Set delivery location");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
          );
          const data = await response.json();
          const address = data.address ?? {};
          const locality =
            address.neighbourhood ??
            address.suburb ??
            address.city_district ??
            address.city ??
            address.town ??
            address.village;
          const region = address.state ?? address.county;
          const nextLabel = [locality, region].filter(Boolean).join(", ");

          if (nextLabel) {
            localStorage.setItem("delivery_location_label", nextLabel);
            setLocationLabel(nextLabel);
          } else {
            setLocationLabel("Location detected");
          }
        } catch {
          setLocationLabel("Location detected");
        }
      },
      () => {
        setLocationLabel("Set delivery location");
      },
      { enableHighAccuracy: false, maximumAge: 600000, timeout: 8000 },
    );
  }, [locationRequestId]);

  const handleAuthSuccess = async (loggedInUser: AuthUser) => {
    setUser(loggedInUser);
    setIsAccountOpen(false);
    await mergeLocalCart();
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
          <button
            type="button"
            className={styles.delivery}
            onClick={() => {
              localStorage.removeItem("delivery_location_label");
              setLocationLabel("Detecting location...");
              setLocationRequestId((current) => current + 1);
            }}
            aria-label="Detect delivery location"
          >
            <span className={styles.deliveryTime}>
              Delivery in {deliveryMinutes} minutes
            </span>
            <span className={styles.deliveryLocation}>{locationLabel}</span>
          </button>
        </div>

        <div className={styles.center}>
          <div className={styles.searchBox} ref={searchContainerRef}>
            <i className="fa-solid fa-magnifying-glass"></i>
            <input
              type="search"
              placeholder="Search for Grocery..."
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              aria-label="Search for Grocery"
            />

            {isSearchOpen && (
              <div className={styles.searchResultsPanel}>
                {searchQuery.trim().length < 2 ? (
                  <div className={styles.searchEmptyState}>
                    Type at least two characters to search.
                  </div>
                ) : isSearchLoading ? (
                  <div className={styles.searchEmptyState}>Searching...</div>
                ) : searchResults.length > 0 ? (
                  <>
                    <div className={styles.searchResultCount}>
                      Showing {searchResults.length} best match
                      {searchResults.length === 1 ? "" : "es"} for "
                      {searchQuery}"
                    </div>
                    {searchResults.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        className={styles.searchResultItem}
                        onClick={() => {
                          setSearchQuery("");
                          setSearchResults([]);
                          setIsSearchOpen(false);
                          navigate(`/product/${product.id}`);
                        }}
                      >
                        <img
                          src={product.image}
                          alt={product.title}
                          className={styles.searchResultImage}
                        />
                        <div className={styles.searchResultText}>
                          <span className={styles.searchResultTitle}>
                            {product.title}
                          </span>
                        </div>
                      </button>
                    ))}
                  </>
                ) : (
                  <div className={styles.searchEmptyState}>
                    No results found for "{searchQuery}"
                  </div>
                )}
              </div>
            )}
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
                      <i
                        className="fa-solid fa-shield-halved"
                        aria-hidden="true"
                      />
                      Admin Panel
                    </button>
                  )}
                  <button
                    className={styles.dropdownItem}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsAccountOpen(false);
                      navigate("/orders/addresses");
                    }}
                  >
                    <i
                      className="fa-solid fa-location-dot"
                      aria-hidden="true"
                    />
                    Saved Addresses
                  </button>
                  <button
                    className={styles.dropdownItem}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setIsAccountOpen(false);
                      navigate("/orders");
                    }}
                  >
                    <i className="fa-solid fa-receipt" aria-hidden="true" />
                    My Orders
                  </button>
                  <button
                    className={styles.dropdownItem}
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    <i
                      className="fa-solid fa-right-from-bracket"
                      aria-hidden="true"
                    />
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
            className={`${styles.cartButton} ${
              itemCount > 0 ? styles.cartButtonActive : ""
            }`}
            disabled={itemCount === 0}
            onClick={() => {
              if (itemCount === 0) return;
              setIsAccountOpen(false);
              setIsCartOpen(true);
              refreshCart();
            }}
          >
            <i className="fa-solid fa-cart-shopping"></i>
            {itemCount > 0 ? (
              <span className={styles.cartSummary}>
                <strong>
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </strong>
                <span>₹{totalAmount}</span>
              </span>
            ) : (
              "My Cart"
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
                    <h2>Delivery in {deliveryMinutes} minutes</h2>
                    <p>
                      Shipment of {itemCount}{" "}
                      {itemCount === 1 ? "item" : "items"}
                    </p>
                  </div>
                </div>

                {items.length === 0 ? (
                  <div className={styles.emptyCartMessage}>
                    <p>Your cart is empty.</p>
                  </div>
                ) : (
                  items.map((item) => {
                    const variant = item.product_variants;
                    const imageUrl =
                      variant?.product_variant_images?.[0]?.image_url ??
                      variant?.image_url ??
                      "/images/milk.png";

                    return (
                      <div key={item.id} className={styles.cartItem}>
                        <div className={styles.itemImage}>
                          <img
                            src={imageUrl}
                            alt={variant?.products?.name ?? "Product image"}
                            className={styles.itemImageImg}
                          />
                        </div>
                        <div className={styles.itemInfo}>
                          <h3>
                            {item.product_variants?.products?.name ?? "Product"}
                          </h3>
                          <p>{item.product_variants?.unit ?? "Qty."}</p>
                        </div>
                        <div className={styles.quantityControl}>
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            onClick={() =>
                              setVariantQuantity(
                                item.variant_id,
                                item.quantity - 1,
                              )
                            }
                          >
                            −
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            onClick={() =>
                              setVariantQuantity(
                                item.variant_id,
                                item.quantity + 1,
                              )
                            }
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </section>

              <section className={styles.cartCard}>
                <h2 className={styles.cardTitle}>Bill Details</h2>
                <div className={styles.billRow}>
                  <span>
                    <i className="fa-solid fa-receipt"></i>
                    Items Total
                  </span>
                  <strong>₹{totalAmount}</strong>
                </div>
                <div className={styles.billRow}>
                  <span>
                    <i className="fa-solid fa-motorcycle"></i>
                    Delivery Charge
                  </span>
                  <strong>₹10</strong>
                </div>
                <div className={`${styles.billRow} ${styles.grandTotal}`}>
                  <span>Grand Total</span>
                  <strong>₹{totalAmount + 10}</strong>
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
                  <h2>
                    Delivering to {user?.name ?? user?.email ?? "Your address"}
                  </h2>
                  <p>{locationLabel}</p>
                </div>
              </div>

              <div className={styles.payBar}>
                <span>
                  <strong>₹{totalAmount + 10}</strong>
                  Total
                </span>
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
