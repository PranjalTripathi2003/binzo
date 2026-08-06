import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import { getCurrentUser } from "../services/auth";
import { getOrders, type Order } from "../services/orders";
import { createAddress, deleteAddress, getAddresses, type Address } from "../services/addresses";
import LocationMap from "../components/Navbar/LocationMap";
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
  const [mapCenter, setMapCenter] = useState<[number, number]>([28.6139, 77.2090]);
  const [mapAddressText, setMapAddressText] = useState("");
  const [formHouseNo, setFormHouseNo] = useState("");
  const [formFloor, setFormFloor] = useState("");
  const [formNearbyLandmark, setFormNearbyLandmark] = useState("");
  const [formAddressLabelType, setFormAddressLabelType] = useState<"Home" | "Work" | "Hotel" | "Other">("Home");
  const [formCustomLabel, setFormCustomLabel] = useState("");
  const [formReceiverName, setFormReceiverName] = useState("");
  const [formReceiverPhone, setFormReceiverPhone] = useState("");
  const [formError, setFormError] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);

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

  // Geocode current position when map opens
  useEffect(() => {
    if (showModal && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setMapCenter([pos.coords.latitude, pos.coords.longitude]);
          fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`)
            .then(res => res.json())
            .then(data => {
              if (data && data.display_name) {
                setMapAddressText(data.display_name);
              }
            }).catch(() => {});
        },
        () => {}
      );
    }
  }, [showModal]);

  const handleMapLocationChange = (lat: number, lng: number, addressText: string) => {
    setMapCenter([lat, lng]);
    setMapAddressText(addressText);
  };

  const openModal = () => {
    setFormHouseNo("");
    setFormFloor("");
    setFormNearbyLandmark("");
    setFormCustomLabel("");
    setFormReceiverName("");
    setFormReceiverPhone("");
    setFormError("");
    setShowModal(true);
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
    if (!formHouseNo.trim() || !formReceiverName.trim()) {
      setFormError("House/Flat details and Receiver Name are required.");
      return;
    }
    setFormSubmitting(true);
    setFormError("");

    const completeAddressString = [
      formHouseNo.trim(),
      formFloor.trim() ? `Floor ${formFloor.trim()}` : "",
      mapAddressText || "Locating...",
      formNearbyLandmark.trim() ? `Near ${formNearbyLandmark.trim()}` : ""
    ].filter(Boolean).join(", ");

    const labelName = formAddressLabelType === "Other" && formCustomLabel.trim() 
      ? formCustomLabel.trim() 
      : formAddressLabelType;

    try {
      const created = await createAddress({
        label: labelName,
        address: completeAddressString,
        is_default: addresses.length === 0,
      });
      setAddresses((prev) => [...prev, created]);
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
              {/* Interactive Map Modal Overlay */}
              {showModal && (
                <div className={styles.mapModalOverlay}>
                  <div className={styles.mapModal}>
                    <button 
                      type="button" 
                      className={styles.closeMapModalBtn} 
                      onClick={closeModal}
                      aria-label="Close Map Modal"
                    >
                      <i className="fa-solid fa-xmark" />
                    </button>

                    <div className={styles.mapModalContainer}>
                      {/* Left Side: Map Selector */}
                      <div className={styles.mapSection}>
                        <div className={styles.mapSearchBox}>
                          <i className="fa-solid fa-magnifying-glass" />
                          <input 
                            type="text" 
                            value={mapAddressText}
                            onChange={(e) => setMapAddressText(e.target.value)}
                            placeholder="Search delivery location..."
                          />
                          {mapAddressText && (
                            <button type="button" onClick={() => setMapAddressText("")}>
                              <i className="fa-solid fa-xmark" />
                            </button>
                          )}
                        </div>

                        <div className={styles.leafletWrapper}>
                          <LocationMap center={mapCenter} onLocationChange={handleMapLocationChange} />
                        </div>

                        <div className={styles.mapOverlayFooter}>
                          <div className={styles.mapPinIndicator}>
                            <i className="fa-solid fa-location-crosshairs" />
                            <div>
                              <h5>Delivering your order to</h5>
                              <p>{mapAddressText || "Locating..."}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Side: Complete Address Entry Form */}
                      <div className={styles.detailsFormSection}>
                        <h3>Enter complete address</h3>
                        <form onSubmit={handleAddAddress}>
                          <div className={styles.fieldGroup}>
                            <label>Save address as *</label>
                            <div className={styles.labelTypeRow}>
                              {(["Home", "Work", "Hotel", "Other"] as const).map((type) => (
                                <button
                                  key={type}
                                  type="button"
                                  className={`${styles.labelTypeBtn} ${formAddressLabelType === type ? styles.labelTypeBtnSelected : ""}`}
                                  onClick={() => setFormAddressLabelType(type)}
                                >
                                  <i className={
                                    type === "Home" ? "fa-solid fa-house" :
                                    type === "Work" ? "fa-solid fa-briefcase" :
                                    type === "Hotel" ? "fa-solid fa-hotel" : "fa-solid fa-location-dot"
                                  } />
                                  {type}
                                </button>
                              ))}
                            </div>
                            {formAddressLabelType === "Other" && (
                              <input 
                                type="text"
                                className={styles.mapFormInput}
                                placeholder="Custom label (e.g. Parents, Gym)"
                                value={formCustomLabel}
                                onChange={(e) => setFormCustomLabel(e.target.value)}
                              />
                            )}
                          </div>

                          <div className={styles.fieldGroup}>
                            <input 
                              type="text"
                              className={styles.mapFormInput}
                              placeholder="Flat / House no / Building name *"
                              value={formHouseNo}
                              onChange={(e) => setFormHouseNo(e.target.value)}
                            />
                          </div>

                          <div className={styles.fieldGroup}>
                            <input 
                              type="text"
                              className={styles.mapFormInput}
                              placeholder="Floor (optional)"
                              value={formFloor}
                              onChange={(e) => setFormFloor(e.target.value)}
                            />
                          </div>

                          <div className={styles.fieldGroup}>
                            <label>Area / Sector / Locality *</label>
                            <div className={styles.readOnlyLocalityText}>
                              {mapAddressText || "Checking address details..."}
                            </div>
                          </div>

                          <div className={styles.fieldGroup}>
                            <input 
                              type="text"
                              className={styles.mapFormInput}
                              placeholder="Nearby landmark (optional)"
                              value={formNearbyLandmark}
                              onChange={(e) => setFormNearbyLandmark(e.target.value)}
                            />
                          </div>

                          <p className={styles.detailsHelpText}>Enter your details for seamless delivery experience</p>

                          <div className={styles.fieldGroup}>
                            <input 
                              type="text"
                              className={styles.mapFormInput}
                              placeholder="Your name *"
                              value={formReceiverName}
                              onChange={(e) => setFormReceiverName(e.target.value)}
                            />
                          </div>

                          <div className={styles.fieldGroup}>
                            <input 
                              type="text"
                              className={styles.mapFormInput}
                              placeholder="Your phone number (optional)"
                              value={formReceiverPhone}
                              onChange={(e) => setFormReceiverPhone(e.target.value)}
                            />
                          </div>

                          {formError && <p className={styles.mapFormError}>{formError}</p>}

                          <button 
                            type="submit" 
                            className={styles.mapFormSubmitBtn}
                            disabled={formSubmitting}
                          >
                            {formSubmitting ? "Saving Address..." : "Save Address"}
                          </button>
                        </form>
                      </div>
                    </div>
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
