import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ProductCard.module.css";
import { useCart } from "../../context/CartContext";

/**
 * Learning TODO:
 * - ProductCard is the right place to call services/cart.ts addToCart().
 * - To do that cleanly, pass a variantId prop from ProductSection using
 *   product.units[0].id, then send { variant_id: variantId, quantity: 1 }.
 */
type ProductCardProps = {
  productId: string;
  variantId: string;
  image: string;
  title: string;
  quantity: string;
  price: number;
};

const ProductCard = ({
  productId,
  variantId,
  image,
  title,
  quantity,
  price,
}: ProductCardProps) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);

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
          disabled={adding}
          onClick={async (event) => {
            event.stopPropagation();
            setAdding(true);
            try {
              await addToCart(variantId);
            } catch (err) {
              if (err instanceof Error && err.message === "unauthenticated") {
                alert("Please log in to add items to your cart.");
              }
            } finally {
              setAdding(false);
            }
          }}
        >
          {adding ? "…" : "Add"}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
