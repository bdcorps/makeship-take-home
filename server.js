var express = require("express");
var passport = require("passport");
var Strategy = require("passport-local").Strategy;
const fileUpload = require("express-fileupload");
var db = require("./db");

var mongoose = require("mongoose");

var models = require("./models/models.js");
var Product = models.productModel;

mongoose.connect(
  "mongodb://sssaini1:sssaini1@ds015879.mlab.com:15879/makeship"
);

passport.use(
  new Strategy(function (username, password, cb) {
    db.users.findByUsername(username, function (err, user) {
      if (err) {
        return cb(err);
      }
      if (!user) {
        return cb(null, false);
      }
      if (user.password != password) {
        return cb(null, false);
      }
      return cb(null, user);
    });
  })
);

passport.serializeUser(function (user, cb) {
  cb(null, user.id);
});

passport.deserializeUser(function (id, cb) {
  db.users.findById(id, function (err, user) {
    if (err) {
      return cb(err);
    }
    cb(null, user);
  });
});

var app = express();

app.use(fileUpload());
app.use(express.static(__dirname + "/public"));
app.use(express.static(__dirname + "/uploads"));
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");

app.use(require("body-parser").urlencoded({ extended: true }));
app.use(
  require("express-session")({
    secret: "secret key",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.post("/upload", require("connect-ensure-login").ensureLoggedIn(), function (
  req,
  res
) {
  let image;
  let uploadPath;

  if (!req.files || Object.keys(req.files).length === 0) {
    res.status(400).send("No files were uploaded.");
    return;
  }

  image = req.files.image;
  uploadPath = __dirname + "/uploads/" + image.name;

  image.mv(uploadPath, function (err) {
    if (err) {
      return res.status(500).send(err);
    }

    addImageToProduct(image.name);
    res.redirect("/");
  });
});

app.get("/", async function (
  req,
  res
) {
  // setApprovalStatusForProductImage(true);

  const images  = await getImagesForProduct();
  const comments = await getCommentsForProduct();
  res.render("home", { user: req.user, images, comments   });
});


const getImagesForProduct =  async ()=>{
  const doc = await Product.findById("5f64284ae7179a6ea51f7460");
  return doc.images;
}

const getCommentsForProduct = async ()=>{
  const doc = await Product.findById("5f64284ae7179a6ea51f7460");
  return doc.comments;
}

app.post("/approval", function (
  req,
  res
) {
  const {image, status} = req.body;

  setApprovalStatusForProductImage(image, status==="true");
  res.send("/");
});

app.post("/comment", require("connect-ensure-login").ensureLoggedIn(), async function (
  req,
  res
) {
  const comment = req.body.comment;
  await addCommentToProduct(comment, req.user.username);
  
  res.redirect("/");
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.post(
  "/login",
  passport.authenticate("local", { failureRedirect: "/login" }),
  function (req, res) {
    res.redirect("/");
  }
);

app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});

const addImageToProduct = async (image) => {
  await Product.findById("5f64284ae7179a6ea51f7460", function (err, doc) {
    doc.images.push({ image, approved: false });

    doc.save();
  }).exec();
};

const addCommentToProduct = async (comment, user) => {
  await Product.findById("5f64284ae7179a6ea51f7460", function (err, doc) {
    doc.comments.push({
      comment,
      user,
      time: new Date().getTime(),
    });

    doc.save();
  }).exec();
};

const setApprovalStatusForProductImage = (image, status) => {
  Product.update(
    { "images.image": image },
    {
      $set: {
        "images.$.approved": status,
      },
    },
    function (err, data) {
      if (err) {
      }
    }
  );
};
app.listen(3000);
