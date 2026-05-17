import React from "react";

import styles from "./ProductSection.module.css";
import ProductCard from "../ProductCard/ProductCard";

const ProductSection = () => {
  const products = [
    {
      title: "Amul Gold Milk",
      quantity: "500ml",
      price: 34,
      image: "/images/milk.png",
    },

    {
      title: "Amul Gold Milk",
      quantity: "500ml",
      price: 34,
      image: "/images/milk.png",
    },

    {
      title: "Amul Gold Milk",
      quantity: "500ml",
      price: 34,
      image: "/images/milk.png",
    },

    {
      title: "Amul Gold Milk",
      quantity: "500ml",
      price: 34,
      image: "/images/milk.png",
    },

    {
      title: "Amul Gold Milk",
      quantity: "500ml",
      price: 34,
      image: "/images/milk.png",
    },
  ];
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}> Dairy, Bread & Eggs</h2>

      <div className={styles.productsRow}>
        {products.map((product, index) => (
          <ProductCard
            key={index}
            title={product.title}
            quantity={product.quantity}
            price={product.price}
            image={product.image}
          ></ProductCard>
        ))}
      </div>
<h2 className={styles.heading}> Dairy, Bread & Eggs</h2>
       <div className={styles.productsRow}>
        {products.map((product, index) => (
          <ProductCard
            key={index}
            title={product.title}
            quantity={product.quantity}
            price={product.price}
            image={product.image}
          ></ProductCard>
        ))}
      </div>
    </section>
  );
};

export default ProductSection;
