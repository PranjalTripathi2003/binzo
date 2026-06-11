import styles from "./Navbar.module.css";

const Navbar = () => {
  return (
    <nav className={styles.navbar}>
      <div className={styles.left}>
        <h1 className={styles.logo}>
          <span className={styles.logoPrimary}>Bin</span>
          <span className={styles.logoAccent}>zo</span>
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
        <button className={styles.accountButton}>
          Account
          <i className="fa-solid fa-caret-down"></i>
        </button>
        <button className={styles.cartButton}>
          <i className="fa-solid fa-cart-shopping"></i>
          My Cart
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
