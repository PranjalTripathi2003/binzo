import styles from "./Hero.module.css";

const Hero = () => {
  return (
    <section className={styles.hero}>
      <div className={styles.left}>
        <h2>Craving something gooood...?</h2>

        <p> Get your favorite snacks and groceries delivered.</p>

        <button>Shop Now</button>
      </div>

      <div className={styles.right}>
        <img src="/images/hero-card-image.png" alt="Assorted snacks" />
      </div>
    </section>
  );
};

export default Hero;
