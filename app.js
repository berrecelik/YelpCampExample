const express = require("express");
const path = require("path");
const { campgroundSchema } = require("./schemas.js");
const mongoose = require("mongoose");
const engine = require("ejs-mate");
const catchAsync = require("./utils/catchAsync");
const ExpressError = require("./utils/ExpressError");
const methodOverride = require("method-override");
const Campground = require("./models/campground");
const { title } = require("process");

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
const app = express();

app.engine("ejs", engine);
app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
//parse that body
app.use(methodOverride("_method"));

app.get("/", (req, res) => {
  res.render("home");
});

//The res.render method is used to generate HTML on the server and send it to the client.
//It mainly generates HTML code dynamically using a template engine and sends it to the client by rendering the template file.
// res.render('view', { data: data });
app.get(
  "/campgrounds",
  catchAsync(async (req, res) => {
    const campgrounds = await Campground.find({});
    //we're going to pass that through to our template
    res.render("campgrounds/index", { campgrounds });
  })
);

app.get("/campgrounds/new", async (req, res) => {
  res.render("campgrounds/new");
});
//order does matter here

const validateCampground = (req, res, next) => {
  const { error } = campgroundSchema.validate(req.body);
  if (error) {
    const msg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(msg, 400);
  } else {
    next();
  }
};

// /Campgrounds as a post, where the form is submitted to
app.post(
  "/campgrounds",
  validateCampground,
  catchAsync(async (req, res) => {
    //if (!req.body.campground) throw new ExpressError("Invalid Data", 400);
    const campground = new Campground(req.body.campground);
    await campground.save();
    res.redirect(`/campgrounds/${campground._id}`);
  })
);
//we've got a tell express to parse the body (req.body)
app.get(
  "/campgrounds/:id",
  catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id);
    res.render("campgrounds/show", { campground });
  })
);
app.get(
  "/campgrounds/:id/edit",
  catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id);
    res.render("campgrounds/edit", { campground });
  })
);
app.put(
  "/campgrounds/:id",
  validateCampground,
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findByIdAndUpdate(id, {
      ...req.body.campground,
    });
    res.redirect(`/campgrounds/${campground._id}`);
  })
);
//The spread (...) syntax allows an iterable, such as an array or string,
//to be expanded in places where zero or more arguments (for function calls) or elements (for array literals) are expected
app.delete(
  "/campgrounds/:id",
  catchAsync(async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    res.redirect("/campgrounds");
  })
);

app.all("*", (req, res, next) => {
  next(new ExpressError("Page not found", 404));
});
app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = "Something went wrong";
  res.status(statusCode).render("error", { err });
});
//pass that (err) through to my template
app.listen(3000, () => {
  console.log("Serving on port 3000");
});
