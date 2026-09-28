const express = require("express");

const app = express();
const PORT = 3000;

// Middleware to parse JSON request body
app.use(express.json());

// Webhook endpoint
app.post("/webhook/", (req, res) => {

    const data = req.body;

    console.log("Webhook data:");
    console.log(data);

    const repository = data.repository;
    const pullRequest = data.pullrequest;

    console.log("Repository:", repository);
    console.log("PR:", pullRequest);

    res.sendStatus(200);
});



app.use("/health", (req, res) => {
    res.status(200).send("sunil kumar");
});

app.use("/", (req, res) => {
    res.status(200).send("hello from home");
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

