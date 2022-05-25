
const path = require("path");
const dishes = require(path.resolve("src/data/dishes-data"));
const nextId = require("../utils/nextId");

// Checks that req.body includes a name property, sets res.locals.data with data property
// If not, returns a status 400 error with message
function bodyHasNameProperty(req, res, next) {
  const { data = {} } = req.body;

  if (!data.name) {
    next({
      status: 400,
      message: "Dish must include a name.",
    });
  }
  res.locals.data = data;
  return next();
}

// Checks that res.locals.data includes a description
// If not, returns a status 400 error with message
function bodyHasDescriptionProperty(req, res, next) {
  const data = res.locals.data;

  if (!data.description) {
    next({
      status: 400,
      message: "Dish must include a description.",
    });
  }

  return next();
}

// Checks to see if res.locals.data includes a price property with an integer > 0
// If not, returns a status 400 error with message
function bodyHasPriceProperty(req, res, next) {
  const data = res.locals.data;

  if (!data.price || data.price < 0 || typeof data.price !== "number") {
    next({
      status: 400,
      message:
        "Dish must include a price and it must be an integer greater than 0.",
    });
  }

  return next();
}

// Checks to see if res.locals.data includes an img url
// If not, returns a status 400 error with message
function bodyHasImageUrlProperty(req, res, next) {
  const data = res.locals.data;

  if (!data["image_url"]) {
    next({
      status: 400,
      message: "Dish must include a image_url",
    });
  }

  return next();
}

// Function to check if dish exists by using dishId,
// If it exists, sets res.locals.dish and res.locals.dishId
// Returns status 404 error with message if it doesnt exist
function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);

  if (foundDish) {
    res.locals.dish = foundDish;
    res.locals.dishId = dishId;
    return next();
  }

  next({
    status: 404,
    message: `Dish does not exist: ${dishId}.`,
  });
}

// Function that checks if routeId matches dishId,
// If not, returns a status 400 error with message
function bodyIdMatchesRouteId(req, res, next) {
  const dishId = res.locals.dishId;
  const data = res.locals.data;

  if (data.id) {
    if (data.id === dishId) {
      return next();
    }

    next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${data.id}, Route: ${dishId}`,
    });
  }

  return next();
}

// Update function that uses res.locals.dish and res.locals.data to update the properties
// of the dish to match the properties in data when called
function update(req, res) {
  const dish = res.locals.dish;
  const data = res.locals.data;

  const existingDishProperties = Object.getOwnPropertyNames(dish);

  for (let i = 0; i < existingDishProperties.length; i++) {
    let propName = existingDishProperties[i];
    if (dish[propName] !== data[propName]) {
      dish[propName] = data[propName];
    }
  }
  res.json({ data: dish });
}

// Function to create a new dish when called, uses nextId() utility to set id
function create(req, res) {
  const data = res.locals.data;
  const newDish = {
    ...data,
    id: nextId(),
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

// Function that sends res.locals.dish properties when called
function read(req, res) {
  res.json({ data: res.locals.dish });
}

// Function to list all dishes when called
function list(req, res) {
  res.json({ data: dishes });
}

module.exports = {
  create: [
    bodyHasNameProperty,
    bodyHasDescriptionProperty,
    bodyHasPriceProperty,
    bodyHasImageUrlProperty,
    create,
  ],
  read: [dishExists, read],
  update: [
    dishExists,
    bodyHasNameProperty,
    bodyHasDescriptionProperty,
    bodyHasPriceProperty,
    bodyHasImageUrlProperty,
    bodyIdMatchesRouteId,
    update,
  ],
  list,
};