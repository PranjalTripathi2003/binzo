import React from "react";
import styles from "./PromoCard.module.css";

type PromoCardProps = {
  title: string;
  description: string;
  buttonText: string;
  backgroundColor: string,
  
};

{/*Creating the promocard with props*/}

const PromoCard = ({ title, description, buttonText, backgroundColor}: PromoCardProps) => {
  return (
    <section className={styles.promoCard} style={{backgroundColor}}>
      <div className={styles.left}>
        <h2>{title}</h2>
        <p>{description}</p>
        <button>{buttonText}</button>
      </div>

      <div className = {styles.right}>
        <img src='Promo Image' alt={title}></img>
      </div>
    </section>
  );
};

export default PromoCard;
