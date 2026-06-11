import styles from "./ProductCard.module.css";

type ProductCardProps = {
  image: string;
  title: string;
  quantity: string;
  price: number;
};

const ProductCard = ({ image, title, quantity, price }: ProductCardProps) => {
  return (
    <div className={styles.productCard}>
      <img src={image} alt={title} className={styles.image}></img>

      <h3 className={styles.title}>{title}</h3>

      <p className={styles.quantity}>{quantity}</p>

      <div className={styles.bottom}>
        <span className={styles.price}>₹{price}</span>

        <button className={styles.button}>Add</button>
      </div>
    </div>
  );
};

export default ProductCard;
