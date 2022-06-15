//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

const app = express();
// module.exports = router;
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));
app.set("view engine", "ejs");
// module.exports = router;

mongoose.connect("mongodb+srv://whaledarn:texasepic@cluster0.aebky.mongodb.net/travelDB");

const ridersSchema = {
  _id: String,
  firstName: String,
  lastName: String,
  emailAddress: String,
  phoneNumber: Number,
  church: Number,
  time: Number,
  address: String,
  driver: String
}
const driversSchema = {
  _id: String,
  firstName: String,
  lastName: String,
  emailAddress: String,
  phoneNumber: Number,
  church: Number,
  time: Number,
  quantity: Number,
  notes: String,
  riders: [String]
}


const Rider = mongoose.model("Rider", ridersSchema);

const Driver = mongoose.model("Driver", driversSchema);


// const Rider = mongoose.mo/del("Rider", ridersSchema);

let churches = ["Church 1", "Church 2", "Church 3", "Church 4"];
let times = [
  ["Time 1", "Time 2"],
  ["Time 3"],
  ["Time 4", "Time 5", "Time 6"],
  ["Time 7", "Time 8"]
];


app.get("/", function(req, res) {
  res.render("home");
});

app.get("/home", function(req, res) {
  res.redirect("/");
});

app.get("/view", function(req, res) {
  /*Loads the Driver List*/
  Driver.find({}, function(err, foundDrivers) {
    // console.log(foundDrivers);
    Rider.find({}, function(err, foundRiders) {
      res.render("view", {
        churches: churches,
        times: times,
        groups: foundDrivers,
        ridergroups: foundRiders
      });
    })

  })
});

app.put("/view", function(req,res){
  let churchFiltered = req.body.filterChurch;
  let foundDrivers;
  Driver.find({}, function(err, fd) {
    if(churchFiltered === "All Churches")
      res.redirect("view");
    else{
      foundDrivers = fd.filter(function (entry){
          return churches[entry.church]===churchFiltered;
      });
    }

    console.log(foundDrivers);
    Rider.find({}, function(err, foundRiders) {
      res.render("view", {
        churches: churches,
        times: times,
        groups: foundDrivers,
        ridergroups: foundRiders
      });
    })

  })
});

app.get("/edit", function(req, res) {
  res.render("edit");
});

app.post("/edit", function(req, res) {
  const id = req.body.id;
  const reason = req.body.reason;

  const which = req.body.whichOne;

  console.log(which);

  if (which == "Driver") {
    Driver.findById(id, function(err, driver) { // finds the driver in list
      if (err) {
        console.log(err);
      } else {
        let riders = driver.riders;
        riders.forEach(function(rider) {
          Rider.findByIdAndRemove(rider, function(err) { // for each of the riders, remove
            if (!err)
              console.log("Removed your id!");
          });
        })
      }
    })

    Driver.findByIdAndRemove(id, function(err) { // removes the driver
      if (!err)
        console.log("Removed your id!");
    });
  } else if (which == "Rider") {
    Rider.findById(id, function(err, rider) { // finds the driver from the rider
      if (rider != null) {
        Driver.findOne({
          _id: rider.driver
        }, function(err, driver) {
          if (err) {
            console.log(err)
          } else {
            console.log("Result : ", driver);
            console.log("the rider is at " + driver.riders.indexOf(id));
            let newList = driver.riders.filter(function(value, index, arr) {
              return value != id;
            });
            console.log("the new list is " + newList);
            Driver.findOneAndUpdate({
              _id: rider.driver
            }, {
              $set: {
                riders: newList
              }
            }, {
              returnDocument: 'after'
            }, (err, doc) => {
              if (err) {
                console.log("Something wrong when updating data!");
              }

              console.log(doc);
            });
          }
        });
      }
    });

    Rider.findByIdAndRemove(id, function(err) { // Removes rider
      if (!err)
        console.log("Removed your id!");
    });
  } else {
    console.log("Something went wrong!");
  }


  res.redirect("edit");
});

app.get("/rider", function(req, res) {
  Driver.find({}, function(err, foundDrivers) {
    res.render("rider", {
      churches: churches,
      times: times,
      groups: foundDrivers
    });
  });

});

app.post("/rider", function(req, res) {
  /*Collect all the data from the form*/
  const firstName = req.body.riderFirstName;
  const lastName = req.body.riderLastName;
  const email = req.body.riderEmail;
  const phone = req.body.riderPhone;
  const id = req.body.riderUTEID;
  const address = req.body.riderAddress;

  const driver = req.body.firstDriver;
  console.log("THE DRIVER IS " + driver);

  Rider.countDocuments({
    _id: id
  }, function(err, count) {
    if (count > 0) {
      console.log("This id already exists. Remove your old entry or try another id.");
      res.redirect("error");
    } else {
      /*Create a new driver*/
      const rider = new Rider({
        _id: id,
        firstName: firstName,
        lastName: lastName,
        emailAddress: email,
        phoneNumber: phone,
        address: address,
        driver: driver
      });
      /*Save driver to database and redirect to view*/
      rider.save();
      /*TODO: UPDATE DRIVER THAT HAS THIS RIDER*/
      Driver.findOneAndUpdate({
        query: {
          _id: driver
        },
        update: {
          $push: {
            "riders": id
          }
        }
      })
      Driver.findById(driver, function(err, p) {
        if (!p)
          return next(new Error('Could not load Document'));
        else {
          // do your updates here
          p.riders.push(id);

          p.save(function(err) {
            if (err)
              console.log('error')
            else
              console.log('success')
          });
        }
      });
      res.redirect("view");
    }
  });

});




app.get("/driver", function(req, res) {
  res.render("driver", {
    churches: churches,
    times: times
  });
});

app.post("/driver", function(req, res) {
  /*Collect all the data from the form*/
  const firstName = req.body.driverFirstName;
  const lastName = req.body.driverLastName;
  const email = req.body.driverEmail;
  const phone = req.body.driverPhone;
  const id = req.body.driverUTEID;
  const church = churches.indexOf(req.body.driverChurch);
  const time = times[church].indexOf(req.body.driverTime);
  const quantity = req.body.driverQuantity;
  const notes = req.body.driverNotes;

  Driver.countDocuments({
    _id: id
  }, function(err, count) {
    if (count > 0) {
      console.log("This id already exists. Remove your old entry or try another id.");
      res.redirect("error");
    } else {
      /*Create a new driver*/
      const driver = new Driver({
        _id: id,
        firstName: firstName,
        lastName: lastName,
        emailAddress: email,
        phoneNumber: phone,
        church: church,
        time: time,
        quantity: quantity,
        notes: notes,
        riders: []
      });
      /*Save driver to database and redirect to view*/
      driver.save();
      res.redirect("view");
    }
  });

});

app.get("/error", function(req, res) {
  res.render("error");
})


app.listen(process.env.PORT||3000, function() {
  console.log("Server started.");
});
