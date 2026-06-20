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

    app.post("/api/lawyer/services", async (req, res) => {
  try {
    const newService = req.body;
    const { lawyerEmail, specialization } = newService;

    if (!lawyerEmail || !specialization) {
      return res.status(400).send({ 
        success: false, 
        message: "Missing required fields: lawyerEmail or specialization." 
      });
    }

    const duplicateCheckQuery = { 
      lawyerEmail: lawyerEmail, 
      specialization: specialization 
    };
    
    const existingService = await lawyerCollection.findOne(duplicateCheckQuery);

    if (existingService) {
      return res.status(409).send({ 
        success: false, 
        message: `You have already added a service under the "${specialization}" category! Please choose another domain.` 
      });
    }

    const result = await lawyerCollection.insertOne(newService);
    res.status(201).send(result);

  } catch (error) {
    console.error("Error creating lawyer service:", error);
    res.status(500).send({ success: false, message: "Internal server error." });
  }
});


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
