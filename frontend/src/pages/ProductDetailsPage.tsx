import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
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

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <section className={styles.gallery} aria-label="Product images">
          <div className={styles.mainImage}>
            <img
              src={product.images[selectedImageIndex]}
              alt={product.title}
            />
          </div>
          <div className={styles.thumbnails}>
            {product.images.map((image, index) => (
              <button
                key={index}
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
        </section>

        <section className={styles.details} aria-label="Product details">
          <h1 className={styles.title}>{product.title}</h1>

          <p className={styles.unitSizeLabel}>Unit Size</p>
          <div className={styles.unitGrid} role="radiogroup" aria-label="Unit size">
            {product.units.map((unit) => (
              <button
                key={unit.id}
                type="button"
                role="radio"
                aria-checked={selectedUnitId === unit.id}
                className={`${styles.unitButton} ${
                  selectedUnitId === unit.id ? styles.unitButtonSelected : ""
                }`}
                onClick={() => setSelectedUnitId(unit.id)}
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

            <div className={styles.quantityControl} aria-label="Quantity">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => setQuantity((current) => Math.max(1, current - 1))}
              >
                −
              </button>
              <span>{quantity}</span>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => setQuantity((current) => current + 1)}
              >
                +
              </button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default ProductDetailsPage;
