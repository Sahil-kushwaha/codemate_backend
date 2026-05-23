import express from "express";
import path from "path";
import cors from "cors";
import axios from "axios";
import { serve } from "inngest/express";
import { clerkMiddleware } from "@clerk/express";

import { ENV } from "./lib/env.js";
import { connectDB } from "./lib/db.js";
import { inngest, functions } from "./lib/inngest.js";

import chatRoutes from "./routes/chatRoutes.js";
import sessionRoutes from "./routes/sessionRoute.js";

const app = express();

const __dirname = path.resolve();

// middleware
app.use(express.json());

// credentials:true => server allows browser to include cookies on requests
app.use(cors({
  origin: ["http://localhost:5173","https://codemate-frontend.vercel.app"],
  credentials: true
}));
app.use(clerkMiddleware()); // this adds auth field to request object: req.auth()

app.use("/api/inngest", serve({
  client: inngest,
  functions,
}));

app.use("/api/chat", chatRoutes);
app.use("/api/sessions", sessionRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ msg: "api is up and running" });
});

app.post("/api/run", async (req, res) => {
  console.log(req.body)
  try {
    const response = await axios.post(
      "http://localhost:2000/api/v2/execute",
      req.body
    );
    console.log(response.data)
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: "Execution failed" });
  }
});

// // make our app ready for deployment
// if (ENV.NODE_ENV === "production") {
//   app.use(express.static(path.join(__dirname, "../frontend/dist")));

//   app.get("/{*any}", (req, res) => {
//     res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
//   });
// }

const startServer = async () => {
  try {
    await connectDB();
    app.listen(ENV.PORT, () => console.log("Server is running on port:", ENV.PORT));
  } catch (error) {
    console.error("💥 Error starting the server", error);
  }
};

startServer();
