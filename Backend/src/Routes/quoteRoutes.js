import express from "express";
import { getQuotes, addQuote, deleteQuote } from "../Controllers/quoteController.controller.js";

const router = express.Router();

// Get all quotes
router.get("/", getQuotes);

// Add a new quote
router.post("/", addQuote);

// Delete a quote
router.delete("/:id", deleteQuote);

export default router;