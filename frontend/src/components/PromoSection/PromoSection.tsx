import PromoCard from "../PromoCard/PromoCard";
import styles from './PromoSection.module.css'

const PromoSection = () => {
  return (
    <section className={styles.promoSection}>
     
        <PromoCard
          title="Pharmacy available at your doorstep"
          description="Cough Syrups, relief sprays & more"
          buttonText="Order Now"
          backgroundColor="#5BAFC6"
        />
        <PromoCard
          title="Fresh groceries in minutes"
          description="Fruits, vegetables & daily essentials"
          buttonText="Order Now"
          backgroundColor="#C52E2E"
        />
        <PromoCard
          title="Snacks delivered fast"
          description="Chips, drinks & more favourites"
          buttonText="Order Now"
          backgroundColor="#ACA2A2"
        />
  
    </section>
  );
};

export default PromoSection;
