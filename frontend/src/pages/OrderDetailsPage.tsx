import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { getOrder, cancelOrder, updateOrderStatus } from "../services/orders";
import { getOrderDeliveryTimeline } from "../utils/delivery";
import styles from "./OrderDetailsPage.module.css";

// Helper to center map dynamically when coordinates update
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 15);
  }, [center, map]);
  return null;
}

// Leaflet DivIcons using emojis for lightweight reliability
const scooterIcon = L.divIcon({
  html: '<div style="font-size: 28px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.35)); transform: scaleX(-1);">🛵</div>',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  className: "custom-scooter-icon",
});

const homeIcon = L.divIcon({
  html: '<div style="font-size: 28px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">📍</div>',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  className: "custom-home-icon",
});

const storeIcon = L.divIcon({
  html: '<div style="font-size: 28px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">🏪</div>',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  className: "custom-store-icon",
});

const OrderDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Map coordinate state
  const [homeCoords, setHomeCoords] = useState<[number, number]>([28.6139, 77.209]); // default Noida/Delhi
  const [storeCoords, setStoreCoords] = useState<[number, number]>([28.6169, 77.205]);
  const [deliveryCoords, setDeliveryCoords] = useState<[number, number]>([28.6169, 77.205]);
  
  // Delivery timer and Tip states
  const [now, setNow] = useState(() => Date.now());
  const [selectedTip, setSelectedTip] = useState<number | null>(null);

  // Cancel flow
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Initialize map to browser geolocation immediately if available
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setHomeCoords([lat, lon]);
          setStoreCoords([lat + 0.002, lon - 0.003]); // closer proximity (0.3km) for realistic Blinkit look
          setDeliveryCoords([lat + 0.002, lon - 0.003]);
        },
        () => {
          // fallback to Noida default
        }
      );
    }
  }, []);

  // Fetch order details
  const fetchOrder = useCallback(async (silent = false) => {
    if (!id) return;
    if (!silent) setLoading(true);
    try {
      const data = await getOrder(id);
      setOrder(data);
      if (!silent) setLoading(false);

      // Geocode address
      const fullAddr = (data as any).addresses?.address;
      if (fullAddr && !silent) {
        const geocode = async (query: string): Promise<boolean> => {
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
            if (res.ok) {
              const results = await res.json();
              if (results && results.length > 0) {
                const lat = parseFloat(results[0].lat);
                const lon = parseFloat(results[0].lon);
                setHomeCoords([lat, lon]);
                setStoreCoords([lat + 0.002, lon - 0.003]);
                setDeliveryCoords([lat + 0.002, lon - 0.003]);
                return true;
              }
            }
          } catch (e) {
            console.error("Geocode error", e);
          }
          return false;
        };
        const tryGeocode = async () => {
          let success = await geocode(fullAddr);
          if (success) return;
          const parts = fullAddr.split(",");
          if (parts.length > 2) {
            success = await geocode(parts.slice(-3).join(","));
            if (success) return;
          }
          if (parts.length > 1) await geocode(parts.slice(-2).join(","));
        };
        tryGeocode();
      }
    } catch (err) {
      console.error("Error loading order", err);
      if (!silent) {
        setError(true);
        setLoading(false);
      }
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Poll for status updates every 30 seconds (silent refresh)
  useEffect(() => {
    if (!id) return;
    const pollInterval = setInterval(() => fetchOrder(true), 30_000);
    return () => clearInterval(pollInterval);
  }, [id, fetchOrder]);

  // Keep the countdown moving without resetting delivery progress on refresh.
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(interval);
  }, []);

  // Persist lifecycle status derived from the promised ETA.
  useEffect(() => {
    if (!order || !id || loading || error) return;

    const timeline = getOrderDeliveryTimeline(order, now);
    const nextStatus = timeline.computedStatus;
    const shouldPersist =
      nextStatus !== order.status &&
      ["packed", "out_for_delivery", "success"].includes(nextStatus);

    if (!shouldPersist) return;

    setOrder((prev: any) => (prev ? { ...prev, status: nextStatus } : prev));
    updateOrderStatus(id, nextStatus).catch(console.error);
  }, [order, now, loading, error, id]);

  // Move the delivery marker along the route according to elapsed order time.
  useEffect(() => {
    if (!order || loading || error) return;

    const timeline = getOrderDeliveryTimeline(order, now);
    const progress = timeline.computedStatus === "cancelled" ? 0 : timeline.progress;
    const lat = storeCoords[0] + (homeCoords[0] - storeCoords[0]) * progress;
    const lng = storeCoords[1] + (homeCoords[1] - storeCoords[1]) * progress;
    setDeliveryCoords([lat, lng]);
  }, [order, now, storeCoords, homeCoords, loading, error]);

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <i className="fa-solid fa-circle-notch fa-spin fa-3x" style={{ color: "#4F46E5" }} />
        <h3>Locating delivery partner...</h3>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className={styles.errorWrapper}>
        <h2>Order Not Found</h2>
        <p>We couldn't retrieve the details of this order.</p>
        <button type="button" className={styles.backHomeBtn} onClick={() => navigate("/")}>
          Back to Home
        </button>
      </div>
    );
  }

  const itemsTotal = Number(order.total_amount || 0);
  const deliveryCharge = 10;
  const grandTotal = itemsTotal + deliveryCharge + (selectedTip || 0);
  const timeline = getOrderDeliveryTimeline(order, now);

  // Status flags
  const isCancelled = timeline.computedStatus === "cancelled";
  const isDelivered = timeline.computedStatus === "success";
  const isPacked = timeline.computedStatus === "packed";
  const isPickedUp = timeline.computedStatus === "out_for_delivery";
  const canCancel = timeline.canCancel;

  // Cancel handler
  const handleCancel = async () => {
    if (!id) return;
    if (!canCancel) {
      setCancelError("Orders cannot be cancelled once packed for delivery.");
      return;
    }
    setCancelLoading(true);
    setCancelError(null);
    try {
      await cancelOrder(id);
      setOrder((prev: any) => prev ? { ...prev, status: "cancelled" } : prev);
      setShowCancelConfirm(false);
    } catch (err: any) {
      setCancelError(err?.message ?? "Failed to cancel order. Please try again.");
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.headerBackBtn}
          onClick={() => navigate("/orders")}
          aria-label="Back to Orders"
        >
          <i className="fa-solid fa-arrow-left" />
        </button>
        <h1 className={styles.headerTitle}>Order #{order.id.slice(0, 8).toUpperCase()}</h1>
        <p className={styles.headerSubtitle}>
          Placed on {new Date(order.created_at).toLocaleDateString()} at{" "}
          {new Date(order.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </header>

      <main className={styles.container}>
        {/* LEFT COLUMN: Map (sticky) */}
        <div className={styles.mapColumn}>
          {/* Map Card */}
          <section className={styles.mapCard}>
            <div className={styles.mapWrapper}>
              <MapContainer
                center={deliveryCoords}
                zoom={15}
                style={{ width: "100%", height: "100%", zIndex: 1 }}
                zoomControl={false}
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <ChangeView center={deliveryCoords} />
                
                {/* Home / Delivery location */}
                <Marker position={homeCoords} icon={homeIcon} />
                
                {/* Grocery Store */}
                <Marker position={storeCoords} icon={storeIcon} />
                
                {/* Delivery Partner */}
                {!isDelivered && !isCancelled && (
                  <Marker position={deliveryCoords} icon={scooterIcon} />
                )}
                
                {/* Route Polyline */}
                <Polyline
                  positions={[storeCoords, homeCoords]}
                  color="#4F46E5"
                  weight={3}
                  dashArray="5, 10"
                />
              </MapContainer>
            </div>

            <div className={styles.mapOverlayStatus}>
              <h5 className={styles.etaTitle}>
                {isCancelled
                  ? "Order Cancelled"
                  : isDelivered
                  ? "Order Delivered"
                  : isPickedUp
                  ? "Order is on the way"
                  : isPacked
                  ? "Order packed"
                  : "Preparing your order"}
              </h5>
              <h2 className={styles.etaText} style={isCancelled ? { color: "#dc2626" } : {}}>
                {isCancelled
                  ? "Cancellation Confirmed"
                  : isDelivered
                  ? "Arrived at doorstep!"
                  : `Arriving in ${timeline.remainingMinutes} minutes`}
              </h2>
              <div className={styles.progressBarWrapper}>
                <div
                  className={styles.progressBar}
                  style={{
                    width: isCancelled
                      ? "100%"
                      : isDelivered
                      ? "100%"
                      : `${Math.min(95, Math.ceil(timeline.progress * 100))}%`,
                    backgroundColor: isCancelled ? "#dc2626" : "",
                  }}
                />
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: Detail cards */}
        <div className={styles.detailColumn}>

        {/* Delivery Partner Details */}
        <section className={styles.partnerCard}>
          <div className={styles.partnerInfo}>
            <div className={styles.partnerAvatar}>
              <i className="fa-solid fa-motorcycle" />
            </div>
            <div className={styles.partnerDetails}>
              <h3 className={styles.partnerName}>
                {order.id.charCodeAt(0) % 2 === 0 ? "Rameshwar" : "Shekhar"}
              </h3>
              <p className={styles.partnerRole}>Your Delivery Partner</p>
            </div>
            <a href="tel:9999999999" className={styles.partnerCallBtn} aria-label="Call partner">
              <i className="fa-solid fa-phone" />
            </a>
          </div>
          <p className={styles.partnerStatusText} style={isCancelled ? { backgroundColor: "#fef2f2", borderColor: "#fecaca", color: "#991b1b" } : {}}>
            {isCancelled
              ? "This order was cancelled."
              : isDelivered
              ? "I have delivered your order. Enjoy your groceries!"
              : isPickedUp
              ? "I have picked up your order and am on the way to your location."
              : isPacked
              ? "Your order is packed. I will pick it up shortly."
              : timeline.computedStatus === "preparing"
              ? "I've reached the store and will pick up your order soon."
              : "Your order is confirmed and will be prepared soon."}
          </p>
        </section>

        {/* Tips Selection */}
        <section className={styles.tipCard}>
          <h3 className={styles.tipTitle}>Delivering happiness at your doorstep!</h3>
          <p className={styles.tipSubtitle}>Thank them by leaving a tip</p>
          <div className={styles.tipRow}>
            {([20, 30, 50] as const).map((tipAmount) => (
              <button
                key={tipAmount}
                type="button"
                className={`${styles.tipBtn} ${selectedTip === tipAmount ? styles.tipBtnSelected : ""}`}
                onClick={() => setSelectedTip(selectedTip === tipAmount ? null : tipAmount)}
              >
                ₹{tipAmount}
              </button>
            ))}
          </div>
        </section>

        {/* Delivery Address */}
        {order.addresses && (
          <section className={styles.deliveryAddressCard}>
            <div className={styles.addressIcon}>
              <i className="fa-solid fa-location-dot" />
            </div>
            <div className={styles.addressDetails}>
              <h4>
                {isDelivered ? "Delivered to" : "Delivering to"}{" "}
                {order.addresses.label}
              </h4>
              <p>{order.addresses.address}</p>
            </div>
          </section>
        )}

          {/* Order Items & Summary */}
          <section className={styles.summaryCard}>
            <h3 className={styles.sectionTitle}>Order Summary</h3>
            <div className={styles.itemList}>
              {order.order_items?.map((item: any) => (
                <div key={item.id} className={styles.itemRow}>
                  <span className={styles.itemName}>
                    {item.product_variants?.products?.name || "Product Item"}
                    <span className={styles.itemQty}>x {item.quantity}</span>
                  </span>
                  <span className={styles.itemPrice}>
                    ₹{Number(item.price_at_purchase) * item.quantity}
                  </span>
                </div>
              ))}
            </div>

            <div className={styles.billSummary}>
              <div className={styles.billRow}>
                <span>Items Total</span>
                <span>₹{itemsTotal}</span>
              </div>
              <div className={styles.billRow}>
                <span>Delivery Charge</span>
                <span>₹{deliveryCharge}</span>
              </div>
              {selectedTip && (
                <div className={styles.billRow}>
                  <span>Delivery Partner Tip</span>
                  <span>₹{selectedTip}</span>
                </div>
              )}
              <div className={`${styles.billRow} ${styles.billTotal}`}>
                <span>Grand Total</span>
                <span>₹{grandTotal}</span>
              </div>
            </div>
          </section>

          {/* Cancel Order button — disabled once the order is packed. */}
          {!isCancelled && !isDelivered && (
            <button
              type="button"
              className={styles.cancelOrderBtn}
              disabled={!canCancel}
              onClick={() => setShowCancelConfirm(true)}
            >
              <i className="fa-solid fa-xmark" />
              {canCancel ? "Cancel Order" : "Cancellation unavailable"}
            </button>
          )}

          <section className={styles.summaryCard}>
            <h3 className={styles.sectionTitle}>Cancellation Policy</h3>
            <p>
              Orders cannot be cancelled once packed for delivery. In case of
              unexpected delays, a refund will be provided, if applicable.
            </p>
          </section>
        </div>
      </main>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="cancel-modal-title">
          <div className={styles.modalCard}>
            <div className={styles.modalIcon}>
              <i className="fa-solid fa-triangle-exclamation" />
            </div>
            <h3 id="cancel-modal-title" className={styles.modalTitle}>Cancel this order?</h3>
            <p className={styles.modalBody}>
              This cannot be undone. Orders cannot be cancelled once packed for delivery.
            </p>
            {cancelError && (
              <p className={styles.modalError}>{cancelError}</p>
            )}
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalKeepBtn}
                onClick={() => { setShowCancelConfirm(false); setCancelError(null); }}
                disabled={cancelLoading}
              >
                Keep Order
              </button>
              <button
                type="button"
                className={styles.modalCancelBtn}
                onClick={handleCancel}
                disabled={cancelLoading}
              >
                {cancelLoading ? (
                  <><i className="fa-solid fa-circle-notch fa-spin" /> Cancelling...</>
                ) : (
                  "Yes, Cancel"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailsPage;
