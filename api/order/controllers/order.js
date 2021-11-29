"use strict";

const stripe = require("stripe")(
  "sk_test_51JurtlABY5aDNYpjimfpOCg2iihbZDNlXFwjMDlKgJVjbb3CFLrq80ZYvVEPBePGTfQpHVPYmIkQX7BOyWUCjkil001CsaTI6e"
);
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */
const calcPrice = (price, discount) => {
  if (!discount) return price; //si discount es null retorna el precio normal
  //funcion para caulacular el descuento
  const discountAmount = (price * discount) / 100;
  //retorna el precio original menos el descuento con 2 decimales
  return (price - discountAmount).toFixed(2);
};
module.exports = {
  async create(ctx) {
    const { tokenStripe, products, idUser, addressShipping } = ctx.request.body;
    let totalPayment = 0;
    products.forEach((product) => {
      const totalPrice = calcPrice(product.price, product.discount);
      totalPayment += totalPrice * product.quantity;
    });

    const charge = await stripe.charges.create({
      amount: totalPayment * 100,
      currency: "BRL",
      source: tokenStripe,
      description: `ID Usuario: ${idUser}`,
    });

    const createOrder = [];
    for await (const product of products) {
      const data = {
        product: product.id,
        user: idUser,
        totalPayment: totalPayment,
        productsPayment: product.price * product.quantity,
        quantity: product.quantity,
        idPayment: charge.id,
        addressShipping,
      };

      const validData = await strapi.entityValidator.validateEntityCreation(
        strapi.models.order,
        data
      );
      const entry = await strapi.query("order").create(validData);
      createOrder.push(entry);
    }
    return createOrder;
  },
};
