const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
app.use(express.json());

const TOKEN = process.env.GITHUB_TOKEN;

app.post('/webhook', async (req, res) => {
  console.log("webhook start....");
   
  // smee.io wraps the payload in a "payload" field
  const payload = req.body.payload ? JSON.parse(req.body.payload) : req.body;
  const { action, pull_request, repository } = payload;


  // Check if this is a PR event
  if (!pull_request) {
    console.log("Not a pull request event");
    return res.sendStatus(200);
  }

  // Only process merged PRs
  if (action !== 'closed' || !pull_request.merged) {
    console.log("Not a merged PR");
    return res.sendStatus(200);
  }

  const diffurl = `https://github.com/${repository.owner.login}/${repository.name}/pull/${pull_request.number}.diff`;
  console.log("Diff URL:", diffurl);

  // Fetch the diff
  const diffRes = await fetch(diffurl);
  const diff = await diffRes.text();
  console.log(`=== Diff for PR #${pull_request.number} (${pull_request.title}) ===`);

//   Save diff to file
  const diffsDir = path.join(__dirname, 'diffs');
  if (!fs.existsSync(diffsDir)) {
    fs.mkdirSync(diffsDir);
  }
  const filename = `pr-${pull_request.number}-${Date.now()}.diff`;
  const filepath = path.join(diffsDir, filename);
  fs.writeFileSync(filepath, diff);
  console.log(`Diff saved to: ${filepath}`);

  console.log("----------Diff started processing successfully----------");
  console.log(diff);
  console.log("----------Diff processing completed----------");

  res.sendStatus(200);
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
