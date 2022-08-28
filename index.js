const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.qygv5.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    console.log("DB Connected");
    const travelCollection = client.db("travelovisor").collection("travel");
    const userCollection = client.db("travelovisor").collection("user");
    const purchaseCollection = client.db("travelovisor").collection("purchase");
    const paymentCollection = client.db("travelovisor").collection("payments");

    app.post("/create-payment-intent", async (req, res) => {
      const service = req.body;
      const price = service.price;
      const amount = price * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({ clientSecret: paymentIntent.client_secret });
    });

    app.patch("/purchase/:id", async (req, res) => {
      const id = req.params.id;
      const payment = req.body;
      const filter = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: {
          paid: true,
          transactionId: payment.transactionId,
        },
      };

      const result = await paymentCollection.insertOne(payment);
      const updatedBooking = await purchaseCollection.updateOne(
        filter,
        updatedDoc
      );
      res.send(updatedBooking);
    });

    app.get("/travel", async (req, res) => {
      const users = await travelCollection.find().toArray();
      res.send(users);
    });

    app.get("/travel/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const tour = await travelCollection.findOne(query);
      res.send(tour);
    });

    app.get("/admin/:email", async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      const isAdmin = user.role === "admin";
      res.send({ admin: isAdmin });
    });

    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    });

    app.put("/profile/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    });

    app.get("/profile/:email", async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      res.send(user);
    });

    app.post("/travel", async (req, res) => {
      const booking = req.body;
      const result = await travelCollection.insertOne(booking);
      res.send(result);
    });

    app.delete("/travel/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await travelCollection.deleteOne(query);
      res.send(result);
    });

    app.get("/payment", async (req, res) => {
      const users = await purchaseCollection.find().toArray();
      res.send(users);
    });

    app.get("/payment/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const buying = await purchaseCollection.findOne(query);
      res.send(buying);
    });

    app.delete("/payment/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await purchaseCollection.deleteOne(query);
      res.send(result);
    });

    app.post("/payment", async (req, res) => {
      const booking = req.body;
      const result = await purchaseCollection.insertOne(booking);
      res.send(result);
    });

    app.get("/order/:email", async (req, res) => {
      const email = req.params.email;
      const result = await purchaseCollection.find({ email: email }).toArray();
      res.send(result);
    });
  } finally {
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello From Travelovisor!");
});

app.listen(port, () => {
  console.log(`Travelovisor listening on port ${port}`);
});
