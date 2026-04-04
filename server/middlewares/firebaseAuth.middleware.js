import admin from "../config/firebase.js";

const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = await admin.auth().verifyIdToken(token);

    req.user = {
      firebaseUID: decoded.uid, // ✅ important fix
      email: decoded.email || "",
      name: decoded.name || "User"
    };

    next();
  } catch (error) {
    console.log(error.message); // helpful for debugging
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export default verifyFirebaseToken;