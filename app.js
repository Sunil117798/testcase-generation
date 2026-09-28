const express = require('express');
const app = express();
app.use(express.json());

const TOKEN = process.env.GITHUB_TOKEN;

app.post('/webhook', async (req, res) => {
  console.log("webhook start");
   
  const { action, pull_request: pr, repository } = req.body;

  // Only process merged PRs
  if (action !== 'closed' || !pr.merged) return;

  const owner = repository.owner.login;   // "Sunil117798"
  const repo  = repository.name;          // "testcase-generation"
  const num   = pr.number;                // 11

  // Fetch the diff
  const diffRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${num}`,
    {
      headers: {
        Accept: 'application/vnd.github.v3.diff',
        'User-Agent': 'webhook-diff-app',
        // Authorization: `Bearer ${process.env.GITHUB_TOKEN}`
      }
    }
  );

  const diff = await diffRes.text();
  console.log(`=== Diff for PR #${num} (${pr.title}) ===`);
  console.log(diff);
});




app.get("/",(req,res)=>{
        res.send("Hello World")
    })

app.get("/test",(req,res)=>{
        res.send("Hello World")
    })



// This defines the port where your server should listen.
// 3000 matches the port that you specified for webhook forwarding. For more information, see [Forward webhooks](#forward-webhooks).
//
// Once you deploy your code to a server, you should change this to match the port where your server is listening.
const port = 3000;

// This starts the server and tells it to listen at the specified port.
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
