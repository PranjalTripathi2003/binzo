import { useNavigate } from "react-router-dom";
import styles from "./ProductCard.module.css";

type ProductCardProps = {
  productId: string;
  image: string;
  title: string;
  quantity: string;
  price: number;
};

const ProductCard = ({
  productId,
  image,
  title,
  quantity,
  price,
}: ProductCardProps) => {
  const navigate = useNavigate();

  const openProductDetails = () => {
    navigate(`/product/${productId}`);
  };

  return (
    <div
      className={styles.productCard}
      onClick={openProductDetails}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openProductDetails();
        }
      }}
      role="link"
      tabIndex={0}
      aria-label={`View ${title}`}
    >
      <img src={image} alt={title} className={styles.image} />

      <h3 className={styles.title}>{title}</h3>

      <p className={styles.quantity}>{quantity}</p>

      <div className={styles.bottom}>
        <span className={styles.price}>₹{price}</span>

        <button
          className={styles.button}
          type="button"
          onClick={(event) => event.stopPropagation()}
        >
          Add
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
