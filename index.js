const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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

    app.get("/api/lawyer/services", async (req, res) => {
      try {
        const query = {};

        if (req.query.lawyerId) {
          query.lawyerId = req.query.lawyerId;
        }

        if (req.query.status) {
          query.status = req.query.status;
        }

        if (req.query.search) {
          query.name = { $regex: req.query.search, $options: "i" };
        }

        if (req.query.specialization) {
          query.specialization = req.query.specialization;
        }

        let pipeline = [{ $match: query }];

        pipeline.push({
          $addFields: {
            numericFee: { $toDouble: "$fee" },
          },
        });

        let sortStage = { _id: -1 };

        if (req.query.sort) {
          if (req.query.sort === "lowToHigh") {
            sortStage = { numericFee: 1 };
          } else if (req.query.sort === "highToLow") {
            sortStage = { numericFee: -1 };
          }
        }

        pipeline.push({ $sort: sortStage });

        // রেজাল্ট জেনারেট করা
        const result = await lawyerCollection.aggregate(pipeline).toArray();

        res.send(result);
      } catch (error) {
        console.error("Error fetching lawyer services:", error);
        res.status(500).send({
          success: false,
          message: "Internal server error",
        });
      }
    });

    app.post("/api/lawyer/services", async (req, res) => {
      try {
        const newService = req.body;
        const { lawyerEmail, specialization } = newService;

        if (!lawyerEmail || !specialization) {
          return res.status(400).send({
            success: false,
            message: "Missing required fields: lawyerEmail or specialization.",
          });
        }

        const duplicateCheckQuery = {
          lawyerEmail: lawyerEmail,
          specialization: specialization,
        };

        const existingService =
          await lawyerCollection.findOne(duplicateCheckQuery);

        if (existingService) {
          return res.status(409).send({
            success: false,
            message: `You have already added a service under the "${specialization}" category! Please choose another domain.`,
          });
        }

        const result = await lawyerCollection.insertOne(newService);
        res.status(201).send(result);
      } catch (error) {
        console.error("Error creating lawyer service:", error);
        res
          .status(500)
          .send({ success: false, message: "Internal server error." });
      }
    });

    app.patch("/api/lawyer/services/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const updatedData = req.body;

        const result = await lawyerCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedData }
        );
        res.send(result);
      } catch (error) {
        console.error("Error updating lawyer service:", error);
        res.status(500).send({ success: false, message: "Internal server error." });
      }
    });

app.delete("/api/lawyer/services/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const service = await lawyerCollection.findOne({ _id: new ObjectId(id) });
    if (!service) {
      return res
        .status(404)
        .json({ success: false, message: "Service not found" });
    }

    const result = await lawyerCollection.deleteOne({ _id: new ObjectId(id) });
    res.send(result);
  } catch (error) {
    console.error("Error deleting service:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
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

module.exports = app;