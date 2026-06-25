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
    // await client.connect();
    // Send a ping to confirm a successful connection

    const db = client.db(process.env.DB_NAME);

    const userCollection = db.collection("user");
    const lawyerCollection = db.collection("lawyers");
    const hiringCollection = db.collection("hirings");
    const transactionCollection = db.collection("transactions");
    const commentCollection = db.collection("comments");

    // await client.db("admin").command({ ping: 1 });
    console.log(
      "✅ Pinged your deployment. You successfully connected to MongoDB!",
    );

    // lawyer services
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

    app.get("/api/lawyer/services/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const service = await lawyerCollection.findOne({
          _id: new ObjectId(id),
        });
        if (!service) {
          return res.status(404).send({
            success: false,
            message: "Service not found",
          });
        }
        res.send(service);
      } catch (error) {
        console.error("Error fetching lawyer service:", error);
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
          { $set: updatedData },
        );
        res.send(result);
      } catch (error) {
        console.error("Error updating lawyer service:", error);
        res
          .status(500)
          .send({ success: false, message: "Internal server error." });
      }
    });

    app.delete("/api/lawyer/services/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const service = await lawyerCollection.findOne({
          _id: new ObjectId(id),
        });
        if (!service) {
          return res
            .status(404)
            .json({ success: false, message: "Service not found" });
        }

        const result = await lawyerCollection.deleteOne({
          _id: new ObjectId(id),
        });
        res.send(result);
      } catch (error) {
        console.error("Error deleting service:", error);
        res
          .status(500)
          .json({ success: false, message: "Internal Server Error" });
      }
    });

    // hirings
    app.post("/api/hirings", async (req, res) => {
      try {
        const {
          lawyerId,
          lawyerServiceId,
          lawyerName,
          userId,
          userEmail,
          userName,
          amount,
          specialization,
        } = req.body;

        if (!lawyerId || !userId) {
          return res.status(400).json({
            success: false,
            message: "Missing required fields.",
          });
        }

        const existing = await hiringCollection.findOne({
          lawyerServiceId,
          userId,
        });

        if (existing) {
          return res.status(409).json({
            success: false,
            message: "You have already sent a hiring request to this lawyer.",
          });
        }

        const hiring = {
          lawyerId,
          lawyerServiceId,
          lawyerName,
          userId,
          userEmail,
          userName,
          specialization,
          amount,
          status: "pending",
          paymentStatus: "unpaid",
          createdAt: new Date(),
        };

        const result = await hiringCollection.insertOne(hiring);
        res.status(201).json({ success: true, data: result });
      } catch (error) {
        console.error("Error saving hiring:", error);
        res
          .status(500)
          .json({ success: false, message: "Internal server error." });
      }
    });

    app.get("/api/hirings/check", async (req, res) => {
      try {
        const { lawyerServiceId, userId } = req.query;
        if (!lawyerServiceId || !userId) {
          return res
            .status(400)
            .json({ success: false, message: "Missing params." });
        }

        const hiring = await hiringCollection.findOne({
          lawyerServiceId,
          userId,
        });
        res.json({
          hasHired: !!hiring,
          paymentStatus: hiring?.paymentStatus || null,
          hiringStatus: hiring?.status || null,
        });
      } catch (error) {
        console.error("Error checking hiring:", error);
        res
          .status(500)
          .json({ success: false, message: "Internal server error." });
      }
    });

    app.get("/api/hirings", async (req, res) => {
      try {
        const { lawyerId, userId } = req.query;
        const query = {};
        if (lawyerId) query.lawyerId = lawyerId;
        if (userId) query.userId = userId;

        const hirings = await hiringCollection
          .find(query)
          .sort({ createdAt: -1 })
          .toArray();

        res.json({ success: true, data: hirings });
      } catch (error) {
        res
          .status(500)
          .json({ success: false, message: "Internal server error." });
      }
    });

    app.patch("/api/hirings/:id/payment", async (req, res) => {
      try {
        const { id } = req.params;
        const { stripeSessionId, amount, paymentIntentId } = req.body;

        if (!stripeSessionId) {
          return res
            .status(400)
            .json({ success: false, message: "Missing stripeSessionId." });
        }

        const hiring = await hiringCollection.findOne({
          _id: new ObjectId(id),
        });

        if (!hiring) {
          return res
            .status(404)
            .json({ success: false, message: "Hiring not found." });
        }

        // prevent double payment
        if (hiring.paymentStatus === "paid") {
          return res
            .status(409)
            .json({ success: false, message: "Already paid." });
        }

        if (hiring.status !== "accepted") {
          return res.status(400).json({
            success: false,
            message: "Payment is only allowed for accepted hiring requests.",
          });
        }

        await hiringCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              paymentStatus: "paid",
              stripeSessionId,
              amount: amount || hiring.amount,
              paidAt: new Date(),
            },
          },
        );

        // save transaction record
        await transactionCollection.insertOne({
          hiringId: id,
          userId: hiring.userId,
          userEmail: hiring.userEmail,
          lawyerId: hiring.lawyerId,
          lawyerServiceId: hiring.lawyerServiceId,
          amount: amount || hiring.amount,
          stripeSessionId,
          paymentIntentId: paymentIntentId || null,
          createdAt: new Date(),
        });

        res.json({ success: true });
      } catch (error) {
        console.error("Error updating payment:", error);
        res
          .status(500)
          .json({ success: false, message: "Internal server error." });
      }
    });

    app.patch("/api/hirings/:id/status", async (req, res) => {
      try {
        const { id } = req.params;
        const { status, lawyerId } = req.body;

        if (!["accepted", "rejected"].includes(status)) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid status." });
        }

        if (!lawyerId) {
          return res
            .status(400)
            .json({ success: false, message: "Missing lawyerId." });
        }

        await hiringCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { status } },
        );

        const acceptedCount = await hiringCollection.countDocuments({
          lawyerId,
          status: "accepted",
        });

        const newLawyerStatus = acceptedCount > 3 ? "Busy" : "Available";

        await lawyerCollection.updateMany(
          { lawyerId },
          { $set: { status: newLawyerStatus } },
        );

        res.json({ success: true, lawyerStatus: newLawyerStatus });
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .json({ success: false, message: "Internal server error." });
      }
    });

    // comments
    app.post("/api/comments", async (req, res) => {
      try {
        const { lawyerId, userId, userEmail, userName, text } = req.body;

        if (!lawyerId || !userId || !text) {
          return res.status(400).json({
            success: false,
            message: "Missing required fields.",
          });
        }

        if (text.length > 200) {
          return res.status(400).json({
            success: false,
            message: "Comment cannot exceed 200 characters.",
          });
        }

        const comment = {
          lawyerId,
          userId,
          userEmail,
          userName,
          text,
          createdAt: new Date(),
        };

        const result = await commentCollection.insertOne(comment);
        res.status(201).json({ success: true, data: result });
      } catch (error) {
        console.error("Error saving comment:", error);
        res
          .status(500)
          .json({ success: false, message: "Internal server error." });
      }
    });

    app.get("/api/comments", async (req, res) => {
      try {
        const { lawyerId } = req.query;

        if (!lawyerId) {
          return res
            .status(400)
            .json({ success: false, message: "Missing lawyerId." });
        }

        const comments = await commentCollection
          .find({ lawyerId })
          .sort({ createdAt: -1 })
          .toArray();

        res.json({ success: true, data: comments });
      } catch (error) {
        console.error("Error fetching comments:", error);
        res
          .status(500)
          .json({ success: false, message: "Internal server error." });
      }
    });

    app.patch("/api/comments/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const { text, userId } = req.body;

        if (!text) {
          return res
            .status(400)
            .json({ success: false, message: "Missing text." });
        }

        if (text.length > 200) {
          return res.status(400).json({
            success: false,
            message: "Comment cannot exceed 200 characters.",
          });
        }

        const comment = await commentCollection.findOne({
          _id: new ObjectId(id),
        });
        if (!comment) {
          return res
            .status(404)
            .json({ success: false, message: "Comment not found." });
        }

        if (comment.userId !== userId) {
          return res
            .status(403)
            .json({ success: false, message: "Unauthorized." });
        }

        await commentCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { text, updatedAt: new Date() } },
        );

        res.json({ success: true });
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .json({ success: false, message: "Internal server error." });
      }
    });

    app.delete("/api/comments/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const { userId } = req.query;

        const comment = await commentCollection.findOne({
          _id: new ObjectId(id),
        });
        if (!comment) {
          return res
            .status(404)
            .json({ success: false, message: "Comment not found." });
        }

        if (comment.userId !== userId) {
          return res
            .status(403)
            .json({ success: false, message: "Unauthorized." });
        }

        await commentCollection.deleteOne({ _id: new ObjectId(id) });
        res.json({ success: true });
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .json({ success: false, message: "Internal server error." });
      }
    });

    app.get("/api/comments/user", async (req, res) => {
      try {
        const { userId } = req.query;
        if (!userId) {
          return res
            .status(400)
            .json({ success: false, message: "Missing userId." });
        }

        const comments = await commentCollection
          .find({ userId })
          .sort({ createdAt: -1 })
          .toArray();

        const commentsWithLawyer = await Promise.all(
          comments.map(async (c) => {
            try {
              const lawyer = await lawyerCollection.findOne({
                _id: new ObjectId(c.lawyerId),
              });
              return {
                ...c,
                lawyerName: lawyer?.name || "—",
                lawyerSpecialization: lawyer?.specialization || "—",
              };
            } catch {
              return { ...c, lawyerName: "—", lawyerSpecialization: "—" };
            }
          }),
        );

        res.json({ success: true, data: commentsWithLawyer });
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .json({ success: false, message: "Internal server error." });
      }
    });

    // users
    app.get("/api/users", async (req, res) => {
      try {
        const users = await userCollection
          .find({})
          .sort({ createdAt: -1 })
          .toArray();
        res.json({ success: true, data: users });
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .json({ success: false, message: "Internal server error." });
      }
    });

    app.patch("/api/users/:id/role", async (req, res) => {
      try {
        const { id } = req.params;
        const { role } = req.body;

        if (!["user", "lawyer", "admin"].includes(role)) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid role." });
        }

        await userCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { role } },
        );

        res.json({ success: true });
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .json({ success: false, message: "Internal server error." });
      }
    });

    app.delete("/api/users/:id", async (req, res) => {
      try {
        const { id } = req.params;

        const user = await userCollection.findOne({ _id: new ObjectId(id) });
        if (!user) {
          return res
            .status(404)
            .json({ success: false, message: "User not found." });
        }

        await userCollection.deleteOne({ _id: new ObjectId(id) });
        res.json({ success: true });
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .json({ success: false, message: "Internal server error." });
      }
    });

    // transaction

    app.get("/api/transactions", async (req, res) => {
      try {
        const transactions = await transactionCollection
          .find({})
          .sort({ createdAt: -1 })
          .toArray();

        res.json({ success: true, data: transactions });
      } catch (error) {
        console.error(error);
        res
          .status(500)
          .json({ success: false, message: "Internal server error." });
      }
    });


  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("LegalEase Server is running smoothly!");
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

module.exports = app;
