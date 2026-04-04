console.log("Group routes loaded");
import express from "express";
import {
  createGroup,
  getGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  getGroupBalances,
  simplifyExpenses,
  addMemberToGroup
} from "../controllers/groupController.js";

import verifyFirebaseToken from "../middlewares/firebaseAuth.middleware.js";

const router = express.Router();

// 🔐 protect all routes
router.use(verifyFirebaseToken);

// CRUD routes
router.post("/", createGroup);              // create group
router.get("/", getGroups);                 // get all groups for user
// Add member to group
router.post("/:groupId/add-member", addMemberToGroup);
// 🔥 IMPORTANT: specific routes before dynamic ones
router.get("/:groupId/balances", getGroupBalances);
router.get("/:groupId/simplify", simplifyExpenses);

router.get("/:groupId", getGroupById);      // get single group
router.put("/:groupId", updateGroup);      // update group
router.delete("/:groupId", deleteGroup);   // delete group

export default router;