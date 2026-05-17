import React from "react";
import styles from "./CategoryCard.module.css";

type CategoryCardProps = {
  image: string;
  title: string;
};

const CategoryCard = ({ image, title }: CategoryCardProps) => {
  return (
    <div className={styles.card}>
      <img src={image} alt={title} className={styles.image} />

      <h3 className={styles.title}>{title}</h3>
    </div>
  );
};

export default CategoryCard;
