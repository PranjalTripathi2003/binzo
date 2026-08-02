import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ProductCard.module.css";
import { useCart } from "../../context/CartContext";

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
  const { addToCart, getVariantQuantity, setVariantQuantity } = useCart();
  const cartQuantity = getVariantQuantity(variantId);
  const [isUpdating, setIsUpdating] = useState(false);

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

        {cartQuantity > 0 ? (
          <div className={styles.quantityControlCard}>
            <button
              type="button"
              className={styles.qtyButton}
              disabled={isUpdating}
              onClick={async (event) => {
                event.stopPropagation();
                setIsUpdating(true);
                try {
                  await setVariantQuantity(variantId, cartQuantity - 1);
                } catch (err) {
                  if (
                    err instanceof Error &&
                    err.message === "unauthenticated"
                  ) {
                    alert("Please log in to update your cart.");
                  }
                } finally {
                  setIsUpdating(false);
                }
              }}
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className={styles.qtyValue}>{cartQuantity}</span>
            <button
              type="button"
              className={styles.qtyButton}
              disabled={isUpdating}
              onClick={async (event) => {
                event.stopPropagation();
                setIsUpdating(true);
                try {
                  await setVariantQuantity(variantId, cartQuantity + 1);
                } catch (err) {
                  if (
                    err instanceof Error &&
                    err.message === "unauthenticated"
                  ) {
                    alert("Please log in to update your cart.");
                  }
                } finally {
                  setIsUpdating(false);
                }
              }}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        ) : (
          <button
            className={styles.button}
            type="button"
            disabled={isUpdating}
            onClick={async (event) => {
              event.stopPropagation();
              setIsUpdating(true);
              try {
                await addToCart(variantId, 1, {
                  name: title,
                  unit: quantity,
                  price,
                  image_url: image,
                });
              } catch (err) {
                console.error(err);
              } finally {
                setIsUpdating(false);
              }
            }}
          >
            {isUpdating ? "…" : "Add"}
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
