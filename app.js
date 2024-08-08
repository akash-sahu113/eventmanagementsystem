require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mysql = require("mysql2");
const app = express();

const Stripe = require("stripe");
const stripe = Stripe("your_stripe_secret_key");
const cors = require("cors");
app.use(
  cors({
    origin: "http://127.0.0.1:5500", // Allow your frontend origin
    methods: "GET,POST,PUT,DELETE", // Allow specific methods
    credentials: true, // If you need to pass cookies or other credentials
  })
);

app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  db.query(
    "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
    [username, email, hashedPassword],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: "Database error" });
      }
      res.status(201).json({ message: "User registered successfully" });
    }
  );
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, result) => {
      if (err || result.length === 0) {
        return res.status(400).json({ message: "Invalid email or password" });
      }

      const user = result[0];
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({ message: "Invalid email or password" });
      }

      const token = jwt.sign({ id: user.id }, "your_jwt_secret", {
        expiresIn: "1h",
      });

      res.status(200).json({ message: "Login successful", token });
    }
  );
});

app.post("/logout", (req, res) => {
  // Handle logout (for example, invalidate JWT token on the client side)
  res.status(200).json({ message: "Logged out successfully" });
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Extract token from Bearer scheme
  if (!token) return res.sendStatus(401); // Unauthorized if no token

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); // Forbidden if token is invalid
    req.user = user;
    next();
  });
};

app.post("/events", authenticateToken, (req, res) => {
  const { title, description, event_date, location } = req.body;

  db.query(
    "INSERT INTO events (user_id, title, description, event_date, location) VALUES (?, ?, ?, ?, ?)",
    [req.user.id, title, description, event_date, location],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Database error" });
      res.status(201).json({ message: "Event created successfully" });
    }
  );
});

app.put("/events/:id", authenticateToken, (req, res) => {
  const { title, description, event_date, location } = req.body;

  db.query(
    "UPDATE events SET title = ?, description = ?, event_date = ?, location = ? WHERE id = ? AND user_id = ?",
    [title, description, event_date, location, req.params.id, req.user.id],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Database error" });
      res.status(200).json({ message: "Event updated successfully" });
    }
  );
});

app.delete("/events/:id", authenticateToken, (req, res) => {
  db.query(
    "DELETE FROM events WHERE id = ? AND user_id = ?",
    [req.params.id, req.user.id],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Database error" });
      res.status(200).json({ message: "Event deleted successfully" });
    }
  );
});

app.get("/events", (req, res) => {
  db.query("SELECT * FROM events", (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.status(200).json(results);
  });
});

app.get("/events/:id", (req, res) => {
  db.query(
    "SELECT * FROM events WHERE id = ?",
    [req.params.id],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });
      res.status(200).json(results[0]);
    }
  );
});

app.get("/search", (req, res) => {
  const { location, date, category } = req.query;

  let query = "SELECT * FROM events WHERE 1=1";
  let queryParams = [];

  if (location) {
    query += " AND location LIKE ?";
    queryParams.push("%" + location + "%");
  }

  if (date) {
    query += " AND DATE(event_date) = ?";
    queryParams.push(date);
  }

  if (category) {
    query += " AND category = ?";
    queryParams.push(category);
  }

  db.query(query, queryParams, (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.status(200).json(results);
  });
});

app.post("/create-checkout-session", authenticateToken, async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Event Ticket",
          },
          unit_amount: 2000,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: "https://yourdomain.com/success",
    cancel_url: "https://yourdomain.com/cancel",
  });

  res.json({ id: session.id });
});

app.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      "your_webhook_secret"
    );
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    // Handle successful checkout session completion here, e.g., save purchase to the database
  }

  res.json({ received: true });
});

app.post("/events/:eventId/forum", authenticateToken, (req, res) => {
  const { content } = req.body;

  db.query(
    "INSERT INTO attendee_interactions (event_id, user_id, interaction_type, content) VALUES (?, ?, ?, ?)",
    [req.params.eventId, req.user.id, "comment", content],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Database error" });
      res.status(201).json({ message: "Comment posted successfully" });
    }
  );
});

app.get("/events/:eventId/forum", authenticateToken, (req, res) => {
  db.query(
    "SELECT * FROM attendee_interactions WHERE event_id = ? AND interaction_type = ?",
    [req.params.eventId, "comment"],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });
      res.status(200).json(results);
    }
  );
});

app.get("/profile", authenticateToken, (req, res) => {
  db.query(
    "SELECT username, email FROM users WHERE id = ?",
    [req.user.id],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });
      if (results.length === 0)
        return res.status(404).json({ message: "Profile not found" });

      // Fetch user's events
      db.query(
        "SELECT * FROM events WHERE user_id = ?",
        [req.user.id],
        (err, events) => {
          if (err) return res.status(500).json({ message: "Database error" });
          res.status(200).json({ ...results[0], events });
        }
      );
    }
  );
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
