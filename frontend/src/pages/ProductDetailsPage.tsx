import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import { useCart } from "../context/CartContext";
import { getProductById, type Product } from "../data/products";
import { getProduct } from "../services/catalog";
import styles from "./ProductDetailsPage.module.css";

const ProductDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const fallbackProduct = id ? getProductById(id) : undefined;
  const [product, setProduct] = useState<Product | undefined>(fallbackProduct);
  const [isLoading, setIsLoading] = useState(Boolean(id && !fallbackProduct));

  const [selectedUnitId, setSelectedUnitId] = useState(
    fallbackProduct?.units[0]?.id ?? "",
  );
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isUpdatingCart, setIsUpdatingCart] = useState(false);
  const { addToCart, getVariantQuantity, setVariantQuantity } = useCart();

  const selectProduct = (nextProduct: Product | undefined) => {
    setProduct(nextProduct);
    setSelectedUnitId(nextProduct?.units[0]?.id ?? "");
    setSelectedImageIndex(0);
    setQuantity(1);
  };

  useEffect(() => {
    if (!id) {
      return;
    }

    let isMounted = true;

    getProduct(id)
      .then((loadedProduct) => {
        if (isMounted) {
          selectProduct(loadedProduct);
        }
      })
      .catch((error) => {
        console.error(error);
        if (isMounted) {
          selectProduct(fallbackProduct);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [fallbackProduct, id]);

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className={styles.notFound}>
          <h1>Loading product...</h1>
        </div>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Navbar />
        <div className={styles.notFound}>
          <h1>Product not found</h1>
          <Link to="/" className={styles.backLink}>
            Back to home
          </Link>
        </div>
      </>
    );
  }

  const selectedUnit =
    product.units.find((unit) => unit.id === selectedUnitId) ??
    product.units[0];
  const unitImages = selectedUnit?.images ?? product.images;
  const galleryImages = Array.from(
    new Set(unitImages.filter((image) => Boolean(image))),
  );
  const selectedImage = galleryImages[selectedImageIndex] ?? product.image;
  const cartQuantity = selectedUnit ? getVariantQuantity(selectedUnit.id) : 0;
  const displayedQuantity = cartQuantity > 0 ? cartQuantity : quantity;

  const handleAddToCart = async (initialQuantity = 1) => {
    if (!selectedUnit || !product) return;
    setIsUpdatingCart(true);
    try {
      await addToCart(selectedUnit.id, initialQuantity, {
        name: product.title,
        unit: selectedUnit.size,
        price: selectedUnit.price,
        image_url: selectedImage,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdatingCart(false);
    }
  };

  const handleQuantityChange = async (direction: 1 | -1) => {
    if (!selectedUnit) {
      setQuantity((q) => Math.max(1, q + direction));
      return;
    }

    const nextCartQuantity = Math.max(0, cartQuantity + direction);
    setIsUpdatingCart(true);
    try {
      await setVariantQuantity(selectedUnit.id, nextCartQuantity);
      if (nextCartQuantity === 0) setQuantity(1);
    } catch (error) {
      if (error instanceof Error && error.message === "unauthenticated") {
        alert("Please log in to update your cart.");
      }
    } finally {
      setIsUpdatingCart(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <section className={styles.gallery} aria-label="Product images">
          <div className={styles.mainImage}>
            <img src={selectedImage} alt={product.title} />
          </div>
          {galleryImages.length > 1 && (
            <div className={styles.thumbnails}>
              {galleryImages.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  className={
                    selectedImageIndex === index
                      ? styles.thumbnailActive
                      : styles.thumbnail
                  }
                  onClick={() => setSelectedImageIndex(index)}
                  aria-label={`View image ${index + 1}`}
                  aria-pressed={selectedImageIndex === index}
                >
                  <img src={image} alt="" />
                </button>
              ))}
            </div>
          )}
        </section>

        <section className={styles.details} aria-label="Product details">
          <h1 className={styles.title}>{product.title}</h1>

          <p className={styles.unitSizeLabel}>Unit Size</p>
          <div
            className={styles.unitGrid}
            role="radiogroup"
            aria-label="Unit size"
          >
            {product.units.map((unit) => (
              <button
                key={unit.id}
                type="button"
                role="radio"
                aria-checked={selectedUnitId === unit.id}
                className={`${styles.unitButton} ${
                  selectedUnitId === unit.id ? styles.unitButtonSelected : ""
                }`}
                onClick={() => {
                  setSelectedUnitId(unit.id);
                  setSelectedImageIndex(0);
                }}
              >
                <span className={styles.unitLabel}>{unit.label}</span>
                <span className={styles.unitSize}>{unit.size}</span>
              </button>
            ))}
          </div>

          <div className={styles.priceRow}>
            <div>
              <p className={styles.selectedUnitLabel}>Selected Unit</p>
              <p className={styles.price}>₹{selectedUnit.price}</p>
              <p className={styles.taxNote}>(Inclusive of all taxes)</p>
            </div>

            {cartQuantity > 0 ? (
              <div className={styles.quantityControl} aria-label="Quantity">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  disabled={isUpdatingCart}
                  onClick={() => handleQuantityChange(-1)}
                >
                  −
                </button>
                <span>{cartQuantity}</span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  disabled={isUpdatingCart}
                  onClick={() => handleQuantityChange(1)}
                >
                  +
                </button>
              </div>
            ) : (
              <button
                type="button"
                className={styles.addToCartBtn}
                disabled={isUpdatingCart}
                onClick={() => handleAddToCart(1)}
              >
                {isUpdatingCart ? "Adding…" : "Add to Cart"}
              </button>
            )}
          </div>
        </section>
      </main>
    </>
  );
};

export default ProductDetailsPage;
