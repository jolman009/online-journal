const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Serve all static files from the project root.
app.use(express.static(path.join(__dirname)));

// Fallback: serve index.html for any unknown route so page refreshes work.
app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
