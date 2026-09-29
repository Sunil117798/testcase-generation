const express = require('express');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { HfInference } = require('@huggingface/inference');

const app = express();
app.use(express.json());

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const HF_TOKEN = process.env.HF_TOKEN;
const hf = new HfInference(HF_TOKEN);

// Helper function for retry with exponential backoff
async function fetchWithRetry(url, options = {}, maxRetries = 3, initialDelay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      if (response.ok) {
        return response;
      }
      
      // If rate limited or server unavailable, retry
      if (response.status === 403 || response.status === 503 || response.status === 502) {
        const delay = initialDelay * Math.pow(2, attempt - 1);
        console.log(`Attempt ${attempt} failed with status ${response.status}. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // For other errors, throw immediately
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      const delay = initialDelay * Math.pow(2, attempt - 1);
      console.log(`Attempt ${attempt} failed: ${error.message}. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}

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

  // Fetch the diff with retry logic
  const diffRes = await fetchWithRetry(diffurl);
  const diff = await diffRes.text();
  console.log(`=== Diff for PR #${pull_request.number} (${pull_request.title}) ===`);

  // Save diff to file
  const diffsDir = path.join(__dirname, 'diffs');
  if (!fs.existsSync(diffsDir)) {
    fs.mkdirSync(diffsDir);
  }
  const filename = `pr-${pull_request.number}-${Date.now()}.diff`;
  const filepath = path.join(diffsDir, filename);
  fs.writeFileSync(filepath, diff);
  console.log(`Diff saved to: ${filepath}`);

  // Generate unit test cases using LLM
  console.log("Generating unit test cases from diff...");
  try {
    const systemPrompt = "You are a test case generation expert. Analyze the following git diff and generate comprehensive unit test cases for the code changes. Provide the test cases in a clear, executable format with proper assertions.";
    const userMessage = `PR #${pull_request.number}: ${pull_request.title}\n\nDiff:\n${diff}\n\nGenerate unit test cases for the above code changes.`;
    
    const response = await hf.chatCompletion({
      model: "Qwen/Qwen2.5-72B-Instruct",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      max_tokens: 2000,
    });

    const testCases = response.choices[0].message.content;
    console.log("=== ==Generated Unit Test Cases ========");
    console.log(testCases);

    // Create test directory
    const testDir = path.join(__dirname, 'test');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir);
    }

    // Extract file names from diff to use as test file names
    const changedFiles = diff.match(/a\/(.*?)\s+b\//g);
    const fileNames = changedFiles ? changedFiles.map(f => f.replace(/a\/(.*?)\s+b\//, '').replace(/\//g, '-')) : ['general'];
    
    // Save test cases for each changed file
    fileNames.forEach(fileName => {
      const testFilename = `${fileName}.test.js`;
      const testFilepath = path.join(testDir, testFilename);
      fs.writeFileSync(testFilepath, testCases);
      console.log(`Test cases saved to: ${testFilepath}`);
    });
  } catch (error) {
    console.error("Error generating test cases:", error.message);
  }

  res.sendStatus(200);
});



app.get("/chat", async (req, res) => {
    
  // Process diff with HuggingFace LLM
  console.log("Sending diff to LLM for analysis...");
  try {
    const response = await hf.chatCompletion({
      model: "Qwen/Qwen2.5-72B-Instruct",
      messages: [
        { role: "user", content: "explain docker" },
      ],
      max_tokens: 1000,
    });

    const llmOutput = response.choices[0].message.content;
    console.log("=====LLM Analysis =====");
    console.log(llmOutput);
    
    res.json({ response: llmOutput });
  } catch (error) {
    console.error("Error calling HuggingFace API:", error.message);
    console.error("Full error:", error);
    res.status(500).json({ error: error.message });
  }
});


app.get("/health",(req,res)=>{
        res.send("OK")
    })


app.get("/",(req,res)=>{
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
