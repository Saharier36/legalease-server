const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


const uri = process.env.MONGODB_URI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection

    const db = client.db(process.env.DB_NAME);

    const userCollection = db.collection("users");
    const lawyerCollection = db.collection("lawyers"); 
    const hiringCollection = db.collection("hirings"); 
    const transactionCollection = db.collection("transactions"); 
    const commentCollection = db.collection("comments");

    await client.db("admin").command({ ping: 1 });
    console.log(
      "✅ Pinged your deployment. You successfully connected to MongoDB!",
    );


    // TODO: CRUD Oparations


  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
  }
}
run().catch(console.dir);


app.get("/", (req, res) => {
  res.send("🚀 LegalEase Server is running smoothly!");
});

app.listen(port, () => {
  console.log(`🔥 Server is listening on port ${port}`);
});
