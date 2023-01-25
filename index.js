const express = require("express");
const app = express();
const cors = require("cors");
const mongodb = require("mongodb");
const mongoClient=mongodb.MongoClient;
const dotenv = require("dotenv")
const URL = process.env.DB;
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const key = process.env.SECRET;
dotenv.config();

//<------- middleware------------>
app.use(express.json());
app.use(
  cors({
    origin: "*",
  })
);


// <---------sample Home page------------>
app.get('/', (req, res) => {
    res.send('ECOMM_API !!')
  });

// verify JWT TOKEN-------------------------->
  let authenticate = function (req, res, next) {
    if (req.headers.authorization) {
     try {
      let verify = jwt.verify(req.headers.authorization, key);
      if (verify) {
        req.userid = verify._id;
        next();
      } else {
        res.status(401).json({ message: "Unauthorized" });
      }
     } catch (error) {
      res.status(401).json({ message: "Unauthorized" });
     }
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  };
   
// <---------------REGISTER METHOD----------------->
 app.post("/register", async function (req, res) {
    try {
      // Open the Connection
      const connection = await mongoClient.connect(URL);
      // Select the DB
      const db = connection.db("ecomm");
      //<-------bcrypt is used for password security---------->
      const salt = await bcryptjs.genSalt(10);
      const hash = await bcryptjs.hash(req.body.password, salt);
      req.body.password = hash;
      // Select the Collection
      await db.collection("user").insertOne(req.body);
      // Close the connection
      await connection.close();
      res.json({
        message: "Successfully Registered",
      });
    } catch (error) {
      res.json({
        message: "Error try again",
      });
    }
  });

// <---------------lOGIN METHOD----------------->
app.post("/login", async function (req, res) {
    try {
      // Open the Connection
      const connection = await mongoClient.connect(URL);
      // Select the DB
      const db = connection.db("ecomm");
      // Select the Collection
      const user = await db.collection("user").findOne({ email: req.body.email });
      if (user) {
        const match = await bcryptjs.compare(req.body.password, user.password);
        if (match) {
          // Token
          const token = jwt.sign({ _id: user._id }, key);
          res.json({
            message: "Successfully Login",
            token,
          });
        } else {
          res.status(401).json({
            message: "Password is incorrect",
          });
        }
      } else {
        res.status(401).json({
          message: "User not found",
        });
      }
    } catch (error) {
      console.log(error);
    }
  });

// <---------------GET METHOD, USER PROFILE DEATILS ----------------->
  app.get("/:id", authenticate, async function (req, res) {
    try {
      // Open the Connection
      const connection = await mongoClient.connect(URL);
  
      // Select the DB
      const db = connection.db("ecomm");
  
      // Select the collection and do the operation
      let profile = await db
        .collection("user")
        .findOne({ _id: mongodb.ObjectId(req.params.id) });
  
      // Close the connection
      await connection.close();
  
      res.status(200).json(profile);
    } catch (error) {
      console.log(error);
    }
  });

app.listen(process.env.PORT || 3001);
