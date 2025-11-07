// Background service worker for Kipit

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getProblemInfo') {
    handleGetProblemInfo(request, sendResponse);
    return true; // Keep channel open for async response
  } else if (request.action === 'checkSolvedStatus') {
    handleCheckSolvedStatus(request, sendResponse);
    return true;
  }
});

// Get problem information from the current tab
async function handleGetProblemInfo(request, sendResponse) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      sendResponse({ success: false, error: 'No active tab' });
      return;
    }

    // Send message to content script to extract problem info
    chrome.tabs.sendMessage(tab.id, { action: 'extractProblemInfo' }, (response) => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse(response);
      }
    });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Check if a problem is solved by the user
async function handleCheckSolvedStatus(request, sendResponse) {
  const { judge, problemUrl, handle } = request;

  if (!handle) {
    sendResponse({ success: false, solved: false, error: 'No handle provided' });
    return;
  }

  try {
    let solved = false;

    switch (judge) {
      case 'Codeforces':
        solved = await checkCodeforcesSolved(problemUrl, handle);
        break;
      case 'LeetCode':
        solved = await checkLeetCodeSolved(problemUrl, handle);
        break;
      case 'AtCoder':
        solved = await checkAtCoderSolved(problemUrl, handle);
        break;
      case 'CodeChef':
        solved = await checkCodeChefSolved(problemUrl, handle);
        break;
      default:
        solved = false;
    }

    sendResponse({ success: true, solved });
  } catch (error) {
    sendResponse({ success: false, solved: false, error: error.message });
  }
}

// Check Codeforces solved status using API
async function checkCodeforcesSolved(problemUrl, handle) {
  try {
    // Extract contest ID and problem index from URL
    const match = problemUrl.match(/problemset\/problem\/(\d+)\/([A-Z]\d?)|contest\/(\d+)\/problem\/([A-Z]\d?)/);
    if (!match) return false;

    const contestId = match[1] || match[3];
    const problemIndex = match[2] || match[4];

    // Fetch user's submissions
    const response = await fetch(
      `https://codeforces.com/api/user.status?handle=${handle}&from=1&count=1000`
    );
    
    if (!response.ok) return false;
    
    const data = await response.json();
    
    if (data.status !== 'OK') return false;

    // Check if any submission is accepted for this problem
    const solved = data.result.some(submission => 
      submission.problem.contestId === parseInt(contestId) &&
      submission.problem.index === problemIndex &&
      submission.verdict === 'OK'
    );

    return solved;
  } catch (error) {
    console.error('Error checking Codeforces status:', error);
    return false;
  }
}

// Check LeetCode solved status
async function checkLeetCodeSolved(problemUrl, handle) {
  try {
    // Extract problem slug from URL
    const match = problemUrl.match(/problems\/([^\/]+)/);
    if (!match) return false;

    const problemSlug = match[1];

    // LeetCode API requires authentication, so this is a simplified version
    // In practice, you'd need to use LeetCode's GraphQL API with proper auth
    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query getUserProfile($username: String!) {
            matchedUser(username: $username) {
              submitStats {
                acSubmissionNum {
                  difficulty
                  count
                }
              }
              recentSubmissionList(limit: 100) {
                titleSlug
                statusDisplay
              }
            }
          }
        `,
        variables: { username: handle }
      })
    });

    if (!response.ok) return false;

    const data = await response.json();
    
    if (!data.data || !data.data.matchedUser) return false;

    // Check if problem is in recent submissions with accepted status
    const solved = data.data.matchedUser.recentSubmissionList.some(
      submission => submission.titleSlug === problemSlug && submission.statusDisplay === 'Accepted'
    );

    return solved;
  } catch (error) {
    console.error('Error checking LeetCode status:', error);
    return false;
  }
}

// Check AtCoder solved status
async function checkAtCoderSolved(problemUrl, handle) {
  try {
    // AtCoder doesn't have a public API, so we'd need to scrape the user's submission page
    // This is a placeholder - you'd need to implement actual scraping or use unofficial APIs
    console.log('AtCoder status check not fully implemented');
    return false;
  } catch (error) {
    console.error('Error checking AtCoder status:', error);
    return false;
  }
}

// Check CodeChef solved status
async function checkCodeChefSolved(problemUrl, handle) {
  try {
    // CodeChef API implementation
    // This is a placeholder - you'd need to use CodeChef's official API
    console.log('CodeChef status check not fully implemented');
    return false;
  } catch (error) {
    console.error('Error checking CodeChef status:', error);
    return false;
  }
}

// Context menu for adding problems
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'addProblem',
    title: 'Add to Kipit',
    contexts: ['page'],
    documentUrlPatterns: [
      'https://codeforces.com/*',
      'https://leetcode.com/*',
      'https://atcoder.jp/*',
      'https://www.codechef.com/*',
      'https://cses.fi/*'
    ]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'addProblem') {
    chrome.tabs.sendMessage(tab.id, { action: "openSaveUI" });
  }
});