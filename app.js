const express = require('express');
const app = express();
app.use(express.json());

const TOKEN = process.env.GITHUB_TOKEN;

app.post('/webhook', async (req, res) => {
  console.log("webhook start....");
   
  const { action, pull_request, repository } = req.body;

  // Check if this is a PR event
  if (!pull_request) {
    console.log("Not a pull request event");
    return res.sendStatus(200);
  }

  const diffurl = `https://github.com/${repository.owner.login}/${repository.name}/pull/${pull_request.number}.diff`;
  console.log("Diff URL:", diffurl);

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
