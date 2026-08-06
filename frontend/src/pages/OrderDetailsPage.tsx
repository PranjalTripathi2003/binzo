import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { getOrder } from "../services/orders";
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
  
  // ETA and Tip states
  const [eta, setEta] = useState(5);
  const [selectedTip, setSelectedTip] = useState<number | null>(null);

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

  // Fetch Order details
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getOrder(id)
      .then((data) => {
        setOrder(data);
        setLoading(false);
        
        // Geocode the address with multi-stage fallbacks
        const fullAddr = data.addresses?.address;
        if (fullAddr) {
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

            if (parts.length > 1) {
              await geocode(parts.slice(-2).join(","));
            }
          };
          tryGeocode();
        }
      })
      .catch((err) => {
        console.error("Error loading order", err);
        setError(true);
        setLoading(false);
      });
  }, [id]);

  // Adjust coordinates and ETA immediately if already delivered
  useEffect(() => {
    if (order) {
      if (order.status === "success" || order.status === "delivered") {
        setEta(1);
        setDeliveryCoords(homeCoords);
      }
    }
  }, [order, homeCoords]);

  // Delivery partner movement animation
  useEffect(() => {
    if (!order || !storeCoords || !homeCoords || loading || error) return;
    
    // Stop animation if order is cancelled or already delivered
    if (order.status === "cancelled" || order.status === "success" || order.status === "delivered") {
      return;
    }

    let progress = 0;
    const interval = setInterval(() => {
      progress += 0.01;
      if (progress >= 1) {
        progress = 1;
        clearInterval(interval);
      }
      const lat = storeCoords[0] + (homeCoords[0] - storeCoords[0]) * progress;
      const lng = storeCoords[1] + (homeCoords[1] - storeCoords[1]) * progress;
      setDeliveryCoords([lat, lng]);
      
      const remainingMinutes = Math.max(1, Math.ceil(5 * (1 - progress)));
      setEta(remainingMinutes);
    }, 1000);

    return () => clearInterval(interval);
  }, [order, storeCoords, homeCoords, loading, error]);

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

  // Status mapping for nice badge messaging
  const isCancelled = order.status === "cancelled";
  const isDelivered = order.status === "success" || order.status === "delivered";
  const isOrderArrived = isDelivered || (eta === 1 && deliveryCoords[0] === homeCoords[0]);

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
              {!isOrderArrived && !isCancelled && (
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
                : isOrderArrived
                ? "Order Delivered"
                : "Order is on the way"}
            </h5>
            <h2 className={styles.etaText} style={isCancelled ? { color: "#dc2626" } : {}}>
              {isCancelled
                ? "Cancellation Confirmed"
                : isOrderArrived
                ? "Arrived at doorstep!"
                : `Arriving in ${eta} minutes`}
            </h2>
            <div className={styles.progressBarWrapper}>
              <div
                className={styles.progressBar}
                style={{
                  width: isCancelled
                    ? "100%"
                    : isOrderArrived
                    ? "100%"
                    : `${Math.min(95, Math.ceil((1 - eta / 5) * 100))}%`,
                  backgroundColor: isCancelled ? "#dc2626" : "",
                }}
              />
            </div>
          </div>
        </section>

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
              : isOrderArrived
              ? "I have delivered your order. Enjoy your groceries!"
              : eta > 3
              ? "I've reached the store and will pick up your order soon."
              : "I have picked up your order and am on the way to your location."}
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
              <h4>Delivered to {order.addresses.label}</h4>
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
      </main>
    </div>
  );
};

export default OrderDetailsPage;
