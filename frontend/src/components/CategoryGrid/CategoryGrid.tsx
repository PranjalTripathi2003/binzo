import React from "react";
import CategoryCard from "../CategoryCard/CategoryCard";
import styles from "./CategoryGrid.module.css";

const CategoryGrid = () => {
  {
    /* Mock data array for passing to category card */
  }
  const categories = [
  {
    title: "Dairy, Bread & Eggs",
    image: "/images/dairy.png"
  },

  {
    title: "Fruits & Vegetables",
    image: "/images/fruits.png"
  },

  {
    title: "Cold Drinks & Juices",
    image: "/images/drinks.png"
  },

  {
    title: "Snacks & Munchies",
    image: "/images/snacks.png"
  },

  {
    title: "Sweet Tooth",
    image: "/images/sweets.png"
  },

  {
    title: "Tea, Coffee & Milk Drinks",
    image: "/images/tea.png"
  },

  {
    title: "Chicken, Meat & Fish",
    image: "/images/chicken.png"
  },

  {
    title: "Cleaning Essentials",
    image: "/images/cleaning.png"
  }
]
  return (
    <section className={styles.grid}>
      {categories.map((category) => (
        <CategoryCard
          key={category.title}
          title={category.title}
          image={category.image}
        ></CategoryCard>
      ))}
    </section>
  );
};
export default CategoryGrid;
