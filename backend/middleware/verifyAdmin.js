import jwt from "jsonwebtoken";

export const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1]; // <-- splits "Bearer <token>"

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin") return res.status(403).json({ message: "Not an admin" });
    req.admin = decoded; // optional, store admin info
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};
