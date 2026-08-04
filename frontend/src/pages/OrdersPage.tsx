import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import { getCurrentUser } from "../services/auth";
import { getOrders, type Order } from "../services/orders";
import { createAddress, deleteAddress, getAddresses, type Address } from "../services/addresses";
import styles from "./OrdersPage.module.css";


const OrdersPage = () => {
  const navigate = useNavigate();
  const { section } = useParams<{ section?: string }>();
  const view = section === "addresses" ? "addresses" : "orders";
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [addressError, setAddressError] = useState(false);

  // Add address modal state
  const [showModal, setShowModal] = useState(false);
  const [formLabel, setFormLabel] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formIsDefault, setFormIsDefault] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const labelInputRef = useRef<HTMLInputElement>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadOrders = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        navigate("/");
        return;
      }

      try {
        await getCurrentUser();
      } catch {
        navigate("/");
        return;
      }

      if (view === "orders") {
        try {
          const data = await getOrders();
          if (!isMounted) return;
          setOrders(data);
        } catch (error) {
          console.error(error);
          if (!isMounted) return;
          setHasError(true);
        }
      }

      if (view === "addresses") {
        try {
          const data = await getAddresses();
          if (!isMounted) return;
          setAddresses(data);
        } catch (error) {
          console.error(error);
          if (!isMounted) return;
          setAddressError(true);
        }
      }

      if (isMounted) setIsLoading(false);
    };

    loadOrders();

    return () => {
      isMounted = false;
    };
  }, [navigate, view]);

  const openModal = () => {
    setFormLabel("");
    setFormAddress("");
    setFormIsDefault(false);
    setFormError("");
    setShowModal(true);
    setTimeout(() => labelInputRef.current?.focus(), 50);
  };

  const closeModal = () => setShowModal(false);

  const handleDeleteAddress = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch {
      // keep the address in the list if deletion fails
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLabel.trim() || !formAddress.trim()) {
      setFormError("Both label and address are required.");
      return;
    }
    setFormSubmitting(true);
    setFormError("");
    try {
      const created = await createAddress({
        label: formLabel.trim(),
        address: formAddress.trim(),
        is_default: formIsDefault,
      });
      setAddresses((prev) => {
        const updated = formIsDefault
          ? prev.map((a) => ({ ...a, is_default: false }))
          : prev;
        return [...updated, created];
      });
      closeModal();
    } catch {
      setFormError("Failed to save address. Please try again.");
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className={styles.page}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>My Account</div>
          <button
            className={`${styles.sidebarLink} ${
              view === "addresses" ? styles.sidebarLinkActive : ""
            }`}
            type="button"
            onClick={() => navigate("/orders/addresses")}
          >
            <i className="fa-solid fa-map-location-dot" />
            <span>Saved Addresses</span>
          </button>
          <button
            className={`${styles.sidebarLink} ${
              view === "orders" ? styles.sidebarLinkActive : ""
            }`}
            type="button"
            onClick={() => navigate("/orders")}
          >
            <i className="fa-solid fa-receipt" />
            <span>My Orders</span>
          </button>
          <button
            className={styles.sidebarLink}
            type="button"
            onClick={() => {
              localStorage.removeItem("access_token");
              localStorage.removeItem("refresh_token");
              navigate("/");
            }}
          >
            <i className="fa-solid fa-right-from-bracket" />
            <span>Logout</span>
          </button>
        </aside>

        <main className={styles.content}>
          {view === "addresses" ? (
            <>
            <div className={styles.addressPanel}>
              <div className={styles.pageHeading}>
                <div>
                  <p className={styles.pageLabel}>Saved Addresses</p>
                  <h1>Delivery address book</h1>
                </div>
                <button
                  type="button"
                  className={styles.addAddressButton}
                  onClick={openModal}
                >
                  <i className="fa-solid fa-plus" />
                  Add new address
                </button>
              </div>
              <div className={styles.addressList}>
                {isLoading ? (
                  <div className={styles.emptyState}>
                    <p>Loading your addresses…</p>
                  </div>
                ) : addressError ? (
                  <div className={styles.emptyState}>
                    <p>Unable to load your addresses right now.</p>
                    <p>Please try again later.</p>
                  </div>
                ) : addresses.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>No saved addresses yet. Add one to get started.</p>
                  </div>
                ) : (
                  addresses.map((address) => (
                    <article key={address.id} className={styles.addressCard}>
                      <div className={styles.addressCardHeader}>
                        <div>
                          <p className={styles.addressLabel}>{address.label}</p>
                          <p className={styles.addressDescription}>
                            {address.address}
                          </p>
                        </div>
                        <div className={styles.addressCardActions}>
                          {address.is_default && (
                            <span className={styles.addressTag}>Default</span>
                          )}
                          <button
                            type="button"
                            className={styles.deleteAddressBtn}
                            aria-label={`Delete ${address.label} address`}
                            disabled={deletingId === address.id}
                            onClick={() => handleDeleteAddress(address.id)}
                          >
                            {deletingId === address.id ? (
                              <i className="fa-solid fa-spinner fa-spin" />
                            ) : (
                              <i className="fa-solid fa-trash" />
                            )}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>

              {/* Add address modal */}
            {showModal && (
              <div
                className={styles.modalOverlay}
                role="dialog"
                aria-modal="true"
                aria-label="Add new address"
                onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
              >
                <div className={styles.modal}>
                  <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Add new address</h2>
                    <button
                      type="button"
                      className={styles.modalClose}
                      aria-label="Close"
                      onClick={closeModal}
                    >
                      <i className="fa-solid fa-xmark" />
                    </button>
                  </div>

                  <form onSubmit={handleAddAddress} className={styles.modalForm} noValidate>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel} htmlFor="addr-label">Label</label>
                      <input
                        id="addr-label"
                        ref={labelInputRef}
                        type="text"
                        className={styles.formInput}
                        placeholder="e.g. Home, Work, Parents"
                        value={formLabel}
                        onChange={(e) => setFormLabel(e.target.value)}
                        maxLength={40}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel} htmlFor="addr-address">Full address</label>
                      <textarea
                        id="addr-address"
                        className={styles.formTextarea}
                        placeholder="Building, street, area, city, state"
                        value={formAddress}
                        onChange={(e) => setFormAddress(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <label className={styles.formCheckbox}>
                      <input
                        type="checkbox"
                        checked={formIsDefault}
                        onChange={(e) => setFormIsDefault(e.target.checked)}
                      />
                      Set as default address
                    </label>

                    {formError && <p className={styles.formError}>{formError}</p>}

                    <div className={styles.modalActions}>
                      <button
                        type="button"
                        className={styles.modalCancelBtn}
                        onClick={closeModal}
                        disabled={formSubmitting}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className={styles.modalSaveBtn}
                        disabled={formSubmitting}
                      >
                        {formSubmitting ? "Saving…" : "Save address"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            </>
          ) : (
            <div className={styles.orderList}>
              {isLoading ? (
                <div className={styles.emptyState}>
                  <p>Loading your orders…</p>
                </div>
              ) : hasError ? (
                <div className={styles.emptyState}>
                  <p>Unable to load your orders right now.</p>
                  <p>Please try again later.</p>
                </div>
              ) : orders.length === 0 ? (
                <div className={styles.emptyState}>
                  <h2>No orders yet</h2>
                  <p>
                    Your orders will appear here once you place your first
                    order.
                  </p>
                </div>
              ) : (
                orders.map((order) => (
                  <article
                    key={order.id}
                    className={`${styles.orderCard} ${
                      order.status === "success"
                        ? styles.orderCardSuccess
                        : styles.orderCardCancel
                    }`}
                  >
                    <div className={styles.orderHeader}>
                      <span
                        className={
                          order.status === "success"
                            ? styles.statusBadgeSuccess
                            : styles.statusBadgeCancel
                        }
                      >
                        <i
                          className={
                            order.status === "success"
                              ? "fa-solid fa-check"
                              : "fa-solid fa-xmark"
                          }
                        />
                      </span>
                      <div className={styles.orderInfo}>
                        <h2>
                          {order.status === "success"
                            ? "Arrived in 10 minutes"
                            : "Order Cancelled"}
                        </h2>
                        <p>
                          ₹{order.total_amount} •{" "}
                          {new Date(order.created_at).toLocaleString()}
                        </p>
                      </div>
                      <i
                        className={`fa-solid fa-arrow-right ${styles.arrowIcon}`}
                      />
                    </div>
                    <div className={styles.orderPreview}>
                      {(order.order_items ?? []).map((item) => (
                        <div
                          key={item.id}
                          className={styles.orderImagePlaceholder}
                          title={
                            item.product_variants?.products?.name ?? "Item"
                          }
                        >
                          <img
                            src={
                              item.product_variants?.image_url ??
                              "/images/milk.png"
                            }
                            alt={
                              item.product_variants?.products?.name ?? "Item"
                            }
                            className={styles.orderImage}
                          />
                        </div>
                      ))}
                    </div>
                  </article>
                ))
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default OrdersPage;
