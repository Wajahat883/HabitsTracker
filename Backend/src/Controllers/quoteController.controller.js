import Quote from "../Models/Quote.js";

// Get all quotes
export const getQuotes = async (req, res) => {
    try {
        const quotes = await Quote.find();
        res.json(quotes);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch quotes" });
    }
};

// Add a new quote
export const addQuote = async (req, res) => {
    try {
        const { text, author } = req.body;
        const quote = new Quote({ text, author });
        await quote.save();
        res.status(201).json(quote);
    } catch (error) {
        res.status(500).json({ error: "Failed to add quote" });
    }
};

// Delete a quote
export const deleteQuote = async (req, res) => {
    try {
        const { id } = req.params;
        await Quote.findByIdAndDelete(id);
        res.json({ message: "Quote deleted" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete quote" });
    }
};