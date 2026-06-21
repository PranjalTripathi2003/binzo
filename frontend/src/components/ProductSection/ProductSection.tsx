import { useRef, useState } from "react";
import { products } from "../../data/products";
import styles from "./ProductSection.module.css";
import ProductCard from "../ProductCard/ProductCard";

const ProductSection = () => {
  const rowRef1 = useRef<HTMLDivElement>(null);
  const rowRef2 = useRef<HTMLDivElement>(null);
  const [scrolled1, setScrolled1] = useState(false);
  const [scrolled2, setScrolled2] = useState(false);

  const carouselProducts = Array.from({ length: 5 }, () => products[0]);

  const handleScrollRight = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollBy({ left: 320, behavior: "smooth" });
    }
  };

  const handleScrollLeft = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollBy({ left: -320, behavior: "smooth" });
    }
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}> Dairy, Bread & Eggs</h2>

      <div className={styles.carouselWrapper}>
        {scrolled1 && (
          <button
            className={styles.arrowBtnLeft}
            onClick={() => handleScrollLeft(rowRef1)}
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>
        )}
        <div
          className={styles.productsRow}
          ref={rowRef1}
          onScroll={(e) => setScrolled1((e.currentTarget as HTMLDivElement).scrollLeft > 0)}
        >
          {carouselProducts.map((product, index) => (
            <ProductCard
              key={index}
              productId={product.id}
              title={product.title}
              quantity={product.units[0].size}
              price={product.units[0].price}
              image={product.image}
            />
          ))}
        </div>
        <button
          className={styles.arrowBtn}
          onClick={() => handleScrollRight(rowRef1)}
        >
          <i className="fa-solid fa-chevron-right"></i>
        </button>
      </div>
      <h2 className={styles.heading}> Dairy, Bread & Eggs</h2>
      <div className={styles.carouselWrapper}>
        {scrolled2 && (
          <button
            className={styles.arrowBtnLeft}
            onClick={() => handleScrollLeft(rowRef2)}
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>
        )}
        <div
          className={styles.productsRow}
          ref={rowRef2}
          onScroll={(e) => setScrolled2((e.currentTarget as HTMLDivElement).scrollLeft > 0)}
        >
          {carouselProducts.map((product, index) => (
            <ProductCard
              key={index}
              productId={product.id}
              title={product.title}
              quantity={product.units[0].size}
              price={product.units[0].price}
              image={product.image}
            />
          ))}
        </div>
        <button
          className={styles.arrowBtn}
          onClick={() => handleScrollRight(rowRef2)}
        >
          <i className="fa-solid fa-chevron-right"></i>
        </button>
      </div>
    </section>
  );
};


export default ProductSection;

