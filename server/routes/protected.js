import express from "express";
import { auth } from "../config/firebase.js";

const router = express.Router();

router.get("/protected", async (req, res) => {
  const idToken = req.headers.authorization?.split("Bearer ")[1];

  if (!idToken) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    res.json({ message: "Protected data accessed", uid: decodedToken.uid });
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
});

export default router;  