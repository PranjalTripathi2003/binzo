import styles from "./Footer.module.css";

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.main}>
        <div className={styles.logo}>
          <span className={styles.logoPrimary}>Bin</span>
          <span className={styles.logoAccent}>zo</span>
        </div>

        <div className={styles.columns}>
          <div className={styles.column}>
            <h2>Useful Links</h2>
            <a href="#">Blog</a>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>

          <div className={styles.column}>
            <h2>Categories</h2>
            <a href="#">Vegetable & Fruits</a>
            <a href="#">Cold Drinks & Juices</a>
            <a href="#">Bakery & Biscuits</a>
          </div>
        </div>
      </div>

      <div className={styles.bottom}>
        <p className={styles.copyright}>© Binzo 2026</p>

        <p className={styles.downloadLabel}>Download App</p>

        <div className={styles.storeButtons}>
          <a href="#" className={styles.storeButton} aria-label="Download on the App Store">
            <img src="/AppStore.svg" alt="Download on the App Store" />
          </a>

          <a href="#" className={styles.storeButton} aria-label="Get it on Google Play">
            <img src="/GooglePlay.png" alt="Get it on Google Play" />
          </a>
        </div>

        <div className={styles.socials} aria-label="Social links">
          <a href="#" aria-label="Facebook">
            <i className="fa-brands fa-facebook"></i>
          </a>
          <a href="#" aria-label="Instagram">
            <i className="fa-brands fa-instagram"></i>
          </a>
          <a href="#" aria-label="X">
            <i className="fa-brands fa-x-twitter"></i>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
