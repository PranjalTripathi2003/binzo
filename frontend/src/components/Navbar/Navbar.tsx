import React from "react";
import styles from  './Navbar.module.css'

const Navbar = () => {
  return (
    <nav className={styles.navbar}>
      <div className={styles.left}>
        <h1>Binzo</h1>
        <p>Delivery in 10 minutes</p>
      </div>

      {/* Search input */}
      <div className={styles.center}>
        <input placeholder="Search for Grocery..."></input>
      </div>

      <div className={styles.right}>
        <button>Account</button>
        <button>My Cart</button>
      </div>
    </nav>
  );
};

export default Navbar;
