// // Content script for Codeforces

// // Listen for messages from background script
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === 'extractProblemInfo') {
//     const problemInfo = extractCodeforcesProblemInfo();

//     sendResponse({ success: true, data: problemInfo });
//   }
//   return true;
// });

// // Extract problem information from Codeforces page
// function extractCodeforcesProblemInfo() {
//   try {
//     // Get problem name
//     const problemTitleElement = document.querySelector('.problem-statement .title');
//     const problemName = problemTitleElement ? problemTitleElement.textContent.trim() : '';

//     // Get problem rating
//     let rating = '';
//     const ratingElement = document.querySelector('.tag-box');
//     if (ratingElement) {
//       const ratingMatch = ratingElement.textContent.match(/\d+/);
//       if (ratingMatch) {
//         rating = ratingMatch[0];
//       }
//     }

//     //Get problem tags
//     const tags = [];
//     const tagElements = document.querySelectorAll('.tag-box');
//     tagElements.forEach(tagEl => {
//       const tagText = tagEl.textContent.trim();
//       if (tagText && !tagText.includes('*')) {
//         tags.push(tagText.toLowerCase());
//       }
//     });

//     // Get problem URL
//     const url = window.location.href;

//     // Extract contest ID and problem index for the name
//     let displayName = problemName;
//     const urlMatch = url.match(/problemset\/problem\/(\d+)\/([A-Z]\d?)|contest\/(\d+)\/problem\/([A-Z]\d?)/);
//     if (urlMatch) {
//       const contestId = urlMatch[1] || urlMatch[3];
//       const problemIndex = urlMatch[2] || urlMatch[4];
//       displayName = `${contestId}${problemIndex} - ${problemName}`;
//     }

//     return {
//       name: displayName,
//       url: url,
//       judge: 'Codeforces',
//       rating: rating,
//       tags: tags
//     };
//   } catch (error) {
//     console.error('Error extracting Codeforces problem info:', error);
//     return {
//       name: document.title,
//       url: window.location.href,
//       judge: 'Codeforces',
//       rating: '',
//       tags: []
//     };
//   }
// }

// // Auto-detect if user is on a problem page and show indicator
// function showProblemIndicator() {
//   const isProblemPage = /problemset\/problem\/|contest\/\d+\/problem\//.test(window.location.href);
// }

// // Initialize when page loads
// if (document.readyState === 'loading') {
//   document.addEventListener('DOMContentLoaded', showProblemIndicator);
// } else {
//   showProblemIndicator();
// }
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === "openSaveUI") {
//     // Show your save option UI here
//     console.log("Trigger save UI");
//   }
// });

//Content script for Codeforces

//Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractProblemInfo') {
    const problemInfo = extractCodeforcesProblemInfo();
    sendResponse({ success: true, data: problemInfo });
  }
  return true;
});

// Extract problem information from Codeforces page
function extractCodeforcesProblemInfo() {
  try {
    // Get problem name (just the title, without contest ID)
    const problemTitleElement = document.querySelector('.problem-statement .title');
    let problemName = '';
    
    if (problemTitleElement) {
      // Remove the problem index (like "A. ", "B1. ", etc.) from the title
      problemName = problemTitleElement.textContent.trim().replace(/^[A-Z]\d*\.\s*/, '');
    }

    // Get problem rating - Check multiple locations
    let rating = '';
    
    // Method 1: Check the sidebar for rating (works for most problems)
    const sidebarElements = document.querySelectorAll('.sidebar .roundbox');
    for (let sidebar of sidebarElements) {
      const ratingMatch = sidebar.textContent.match(/\*(\d+)/);
      if (ratingMatch) {
        rating = ratingMatch[1];
        break;
      }
    }
    
    // Method 2: Check the problem statement header
    if (!rating) {
      const headerElements = document.querySelectorAll('.header .title');
      for (let header of headerElements) {
        const ratingMatch = header.textContent.match(/\*(\d+)/);
        if (ratingMatch) {
          rating = ratingMatch[1];
          break;
        }
      }
    }

    // Method 3: Check for rating in any element with '*' followed by numbers
    if (!rating) {
      const allText = document.body.textContent;
      const ratingMatch = allText.match(/\*(\d{3,4})\b/);
      if (ratingMatch) {
        rating = ratingMatch[1];
      }
    }

    // Get problem tags
    const tags = [];
    const tagElements = document.querySelectorAll('.tag-box');
    tagElements.forEach(tagEl => {
      const tagText = tagEl.textContent.trim();
      // Filter out the rating and "Click to show tags" text
      if (tagText && !tagText.includes('*') && !tagText.toLowerCase().includes('click')) {
        tags.push(tagText.toLowerCase());
      }
    });

    // Get problem URL
    const url = window.location.href;

    return {
      name: problemName,
      url: url,
      judge: 'Codeforces',
      rating: rating,
      tags: tags
    };
  } catch (error) {
    console.error('Error extracting Codeforces problem info:', error);
    return {
      name: document.title.replace(' - Codeforces', ''),
      url: window.location.href,
      judge: 'Codeforces',
      rating: '',
      tags: []
    };
  }
}

// Auto-detect if user is on a problem page and show indicator
function showProblemIndicator() {
  const isProblemPage = /problemset\/problem\/|contest\/\d+\/problem\//.test(window.location.href);
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', showProblemIndicator);
} else {
  showProblemIndicator();
}