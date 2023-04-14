import fetch from "node-fetch";

const GITHUB_API_URL = "https://api.github.com";
const OWNER = "Sh0ny-IT";
const REPO = "commitRepo";
const BRANCH = "main";
const TOKEN = "";


async function commitToGithub(message, content) {
  const path = "example.txt";
  const encodedContent = Buffer.from(content).toString("base64");

  const getRefUrl = `${GITHUB_API_URL}/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`;
  console.log ("getRefUrl: " + getRefUrl)
  const refResponse = await fetch(getRefUrl, {
    headers: {
      Authorization: `token ${TOKEN}`,
    },
  });

  if (!refResponse.ok) {
    console.error("Error fetching ref:", refResponse.status);
    return;
  }

  const refData = await refResponse.json();
  const latestCommitSha = refData.object.sha;

  const getCommitUrl = `${GITHUB_API_URL}/repos/${OWNER}/${REPO}/git/commits/${latestCommitSha}`;
  const commitResponse = await fetch(getCommitUrl, {
    headers: {
      Authorization: `token ${TOKEN}`,
    },
  });

  const commitData = await commitResponse.json();
  const treeSha = commitData.tree.sha;

  const createTreeUrl = `${GITHUB_API_URL}/repos/${OWNER}/${REPO}/git/trees`;
  const treeResponse = await fetch(createTreeUrl, {
    method: "POST",
    headers: {
      Authorization: `token ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      base_tree: treeSha,
      tree: [
        {
          path,
          mode: "100644",
          type: "blob",
          content,
        },
      ],
    }),
  });

  const treeData = await treeResponse.json();
  const newTreeSha = treeData.sha;

  const createCommitUrl = `${GITHUB_API_URL}/repos/${OWNER}/${REPO}/git/commits`;
  const newCommitResponse = await fetch(createCommitUrl, {
    method: "POST",
    headers: {
      Authorization: `token ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      tree: newTreeSha,
      parents: [latestCommitSha],
    }),
  });

  const newCommitData = await newCommitResponse.json();
  const newCommitSha = newCommitData.sha;

  const updateRefUrl = `${GITHUB_API_URL}/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`;
  await fetch(updateRefUrl, {
    method: "PATCH",
    headers: {
      Authorization: `token ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sha: newCommitSha,
    }),
  });
}

(async () => {
  for (let i = 1; i <= 5; i++) {
    const message = `Commit ${i}`;
    const content = `This is commit ${i}`;
    await commitToGithub(message, content);
    console.log(`Successfully created commit ${i}: ${message}`);
  }
})();
