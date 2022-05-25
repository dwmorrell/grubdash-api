const path = require("path");
const orders = require(path.resolve("src/data/orders-data"));
const nextId = require("../utils/nextId");

// Checks that req.body includes a "deliverTo" property, sets res.locals.data
function bodyHasDeliverToProperty(req, res, next) {
  const { data = {} } = req.body;
  if (!data.deliverTo) {
    next({
      status: 400,
      message: "Order must include a deliverTo property.",
    });
  }
  res.locals.data = data;
  return next();
}

// Checks that res.locals.data includes a "mobileNumber" property
function bodyHasMobileNumProperty(req, res, next) {
  const data = res.locals.data;
  if (!data.mobileNumber) {
    next({
      status: 400,
      message: "Order must include a mobileNumber property.",
    });
  }

  return next();
}

// Checks that res.locals.data includes at least one dishes property
function bodyHasDishesProperty(req, res, next) {
  const data = res.locals.data;
  if (!data.dishes || data.dishes.length === 0 || !Array.isArray(data.dishes)) {
    next({
      status: 400,
      message: "Order must include at least one dish.",
    });
  }

  return next();
}

// Checks that res.locals.data.dishes have a quantity that is an integer and > 0
function bodyHasDishQuantityProperty(req, res, next) {
  const dishes = res.locals.data.dishes;

  const dishesWithoutQuantity = dishes.reduce(
    (acc, dish, index) => {
      if (
        !dish.quantity ||
        !dish.quantity > 0 ||
        typeof dish.quantity !== "number"
      ) {
        acc.push(index);
        return acc;
      }
      return acc;
    },
    []
  );
    // If all dishes have a quantity, return next()
  if (!dishesWithoutQuantity.length) {
    return next();
  }
    // If there are dishes without quantity or not of an integer, 
    // send these dishes to the error handler with a status of 400
  if (dishesWithoutQuantity.length > 1) {
    const stringOfDishIndex = dishesWithoutQuantity.join(", ");

    next({
      status: 400,
      message: `Dishes ${stringOfDishIndex} must have a quantity that is an integer greater than 0.`,
    });
  }

  next({
    status: 400,
    message: `Dish ${dishesWithoutQuantity} must have a quantity that is an integer greater than 0.`,
  });
}

// This function checks to see if an order exists, sets res.locals.order and res.locals.orderId
// If the orderId does not exist, sends an error of status 404 with error message
function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);

  if (foundOrder) {
    res.locals.order = foundOrder;
    res.locals.orderId = orderId;
    return next();
  }

  next({
    status: 404,
    message: `No matching order is found for orderId ${orderId}.`,
  });
}

// Checks that the orderId matches the routeId
// If it doesn't match, sends error with a status of 400 with error message
function bodyIdMatchesRouteId(req, res, next) {
  const orderId = res.locals.orderId;
  const data = res.locals.data;

  if (data.id) {
    if (data.id === orderId) {
      return next();
    }
    next({
      status: 400,
      message: `Order id does not match route id. Order: ${data.id}, Route: ${orderId}`,
    });
  }

  return next();
}

// Checks that res.locals.data includes a status property
// If no status or order has been delivered, returns an error with status 400 and an error message
function bodyHasStatusProperty(req, res, next) {
  const data = res.locals.data;

  if (!data.status || data.status === "invalid") {
    next({
      status: 400,
      message:
        "Order must have a status of pending, preparing, out-for-delivery, or delivered.",
    });
  }

  if (data.status === "delivered") {
    next({
      status: 400,
      message: "A delivered order cannot be changed.",
    });
  }

  return next();
}

// Checks to see if res.locals.order includes a pending status when attempting to delete,
// If not pending, return an error with status 400 and an error message
function orderStatusIsPending(req, res, next) {
  const order = res.locals.order;

  if (order.status !== "pending") {
    next({
      status: 400,
      message: "An order cannot be deleted unless it is pending.",
    });
  }

  return next();
}

// Delete function that returns a status of 204 when successfully deleted
function destroy(req, res) {
  const orderId = res.locals.orderId;
  const index = orders.findIndex((order) => order.id === orderId);
  orders.splice(index, 1);
  res.sendStatus(204);
}

// Update function that uses res.locals.data and res.locals.order to update the properties
// of the order to match the properties in data when called
function update(req, res) {
  const data = res.locals.data;
  const order = res.locals.order;

  const existingOrderProperties = Object.getOwnPropertyNames(order);

  for (let i = 0; i < existingOrderProperties.length; i++) {
    let propName = existingOrderProperties[i];
    if (propName !== "id" && order[propName] !== data[propName]) {
      order[propName] = data[propName];
    }
  }
  res.json({ data: order });
}

// Function that sends res.locals.order when called
function read(req, res) {
  res.json({ data: res.locals.order });
}

// Function to create new orders, using the "nextId()" utility to set id
// Returns a status of 201 when complete
function create(req, res) {
  const data = res.locals.data;
  const newOrder = {
    ...data,
    id: nextId(),
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

// Function that lists all orders when called
function list(req, res) {
  res.json({ data: orders });
}

module.exports = {
  create: [
    bodyHasDeliverToProperty,
    bodyHasMobileNumProperty,
    bodyHasDishesProperty,
    bodyHasDishQuantityProperty,
    create,
  ],
  read: [orderExists, read],
  update: [
    orderExists,
    bodyHasDeliverToProperty,
    bodyHasMobileNumProperty,
    bodyHasDishesProperty,
    bodyHasDishQuantityProperty,
    bodyIdMatchesRouteId,
    bodyHasStatusProperty,
    update,
  ],
  delete: [orderExists, orderStatusIsPending, destroy],
  list,
};