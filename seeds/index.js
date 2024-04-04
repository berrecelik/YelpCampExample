//we will run this file on its own
//like separately from our node app, anytime we want to seed our database
const mongoose = require("mongoose");
const cities = require("./cities");
const { places, descriptors } = require("./seedHelpers");
const Campground = require("../models/campground");

mongoose
  .connect("mongodb://127.0.0.1:27017/yelp-camp-example")
  .then(() => {
    console.log("connection open");
  })
  .catch((err) => {
    console.log(err);
  });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Database connected!");
});
const sample = (array) => array[Math.floor(Math.random() * array.length)];
const seedDB = async () => {
  await Campground.deleteMany({});
  //delete everything
  for (let i = 0; i < 10; i++) {
    const random5 = Math.floor(Math.random() * 5);
    const camp = new Campground({
      location: `${cities[random5].city}, ${cities[random5].state}`,
      title: `${sample(descriptors)} ${sample(places)}`,
    });
    await camp.save();
  }
};
//we connected and then we closed out
seedDB().then(() => {
  mongoose.connection.close();
});
