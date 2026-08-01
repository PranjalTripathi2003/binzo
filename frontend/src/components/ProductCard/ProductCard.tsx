import { useNavigate } from "react-router-dom";
import styles from "./ProductCard.module.css";

/**
 * Learning TODO:
 * - ProductCard is the right place to call services/cart.ts addToCart().
 * - To do that cleanly, pass a variantId prop from ProductSection using
 *   product.units[0].id, then send { variant_id: variantId, quantity: 1 }.
 */
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
          // TODO(cart): event.stopPropagation() is already here so Add does not open product details.
          // Next step: call addToCart() here and show login/error feedback if there is no token.
          onClick={(event) => event.stopPropagation()}
        >
          Add
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
