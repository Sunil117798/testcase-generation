const express = require('express');
const app = express();
app.use(express.json());

const TOKEN = process.env.GITHUB_TOKEN;

app.post('/webhook', async (req, res) => {
    console.log("webhook start");
   
  const { action, pull_request: pr, repository } = req.body;

  // Only act on the event you care about
  if (action === 'closed' && pr.merged) {
    console.log("pull request merged start");
    const owner = repository.owner.login;
    const repo  = repository.name;
    const num   = pr.number;

    // Get PR details to compare base and head
    const prDetailsRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${num}`,
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'my-app'
        }
      }
    );
    const prData = await prDetailsRes.json();
    
    const baseSha = prData.base.sha;
    const headSha = prData.head.sha;
    
    console.log(`Base branch: ${prData.base.ref} (${baseSha})`);
    console.log(`Head branch: ${prData.head.ref} (${headSha})`);

    // Get comparison between base and head
    const compareRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/compare/${baseSha}...${headSha}`,
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'User-Agent': 'my-app'
        }
      }
    );
    const comparison = await compareRes.json();
    
    console.log(`Files changed: ${comparison.files?.length || 0}`);
    console.log(`Commits: ${comparison.commits?.length || 0}`);
    console.log(`Additions: ${comparison.stats?.additions || 0}`);
    console.log(`Deletions: ${comparison.stats?.deletions || 0}`);
    
    // List changed files
    if (comparison.files) {
      comparison.files.forEach(file => {
        console.log(`- ${file.filename} (${file.status})`);
      });
    }
    
    console.log("pull request merged end");
  }

  console.log("webhook end");
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
