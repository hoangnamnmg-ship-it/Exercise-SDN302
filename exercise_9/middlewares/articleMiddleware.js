function validateArticle(req, res, next) {
    const { title, content } = req.body;
    if (!title || !content) {
        return res.status(400).json({ error: "Title and content are required." });
    }
    next();
}

function validateDate(req, res, next) {
    const { date } = req.body;
    if (date) {
        // Regex for YYYY-MM-DD
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            return res.status(400).json({ error: "Invalid date format. Expected YYYY-MM-DD." });
        }
    }
    next();
}

function validateTextLength(req, res, next) {
    const { content } = req.body;
    if (content && content.length < 10) {
        return res.status(400).json({ error: "Content must be at least 10 characters long." });
    }
    next();
}

module.exports = {
    validateArticle,
    validateDate,
    validateTextLength
};
