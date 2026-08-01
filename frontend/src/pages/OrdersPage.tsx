import Navbar from "../components/Navbar/Navbar";
import styles from "./OrdersPage.module.css";

/**
 * Learning TODO:
 * Replace this mock array with live data from services/orders.ts getOrders().
 *
 * Suggested steps:
 * 1. Import useEffect/useState and getOrders().
 * 2. Store orders in state.
 * 3. Fetch orders on mount.
 * 4. Convert backend fields:
 *    - total_amount -> amount
 *    - created_at -> date
 *    - status -> success/cancel styling
 *    - order_items -> item preview images/names
 */
const orders = [
  {
    id: "1",
    title: "Arrived in 10 minutes",
    amount: "₹ XXXX",
    date: "01 Jan 20XX, 12:00AM",
    status: "success",
    items: [
      { image: "/images/milk.png", name: "Milk" },
      { image: "/images/dairy.png", name: "Butter" },
    ],
  },
  {
    id: "2",
    title: "Order Cancelled",
    amount: "₹ XXXX",
    date: "01 Jan 20XX",
    status: "cancel",
    items: [
      { image: "/images/snacks.png", name: "Chips" },
    ],
  },
  {
    id: "3",
    title: "Arrived in 10 minutes",
    amount: "₹ XXXX",
    date: "01 Jan 20XX, 12:00AM",
    status: "success",
    items: [
      { image: "/images/fruits.png", name: "Apples" },
      { image: "/images/drinks.png", name: "Soda" },
      { image: "/images/sweets.png", name: "Chocolate" },
    ],
  },
];

const OrdersPage = () => {
  return (
    <>
      <Navbar />
      <div className={styles.page}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>xxxxxxxxxx</div>
          <button className={styles.sidebarLink}>
            <i className="fa-solid fa-map-location-dot" />
            <span>My Addresses</span>
          </button>
          <button className={styles.sidebarLink}>
            <i className="fa-solid fa-receipt" />
            <span>My Orders</span>
          </button>
          <button className={styles.sidebarLink}>
            <i className="fa-solid fa-right-from-bracket" />
            <span>Logout</span>
          </button>
        </aside>

        <main className={styles.content}>
          <div className={styles.orderList}>
            {orders.map((order) => (
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
                    <h2>{order.title}</h2>
                    <p>
                      {order.amount} • {order.date}
                    </p>
                  </div>
                  <i className={`fa-solid fa-arrow-right ${styles.arrowIcon}`} />
                </div>
                <div className={styles.orderPreview}>
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className={styles.orderImagePlaceholder}
                      title={item.name}
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className={styles.orderImage}
                      />
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </main>
      </div>
    </>
  );
};

export default OrdersPage;
