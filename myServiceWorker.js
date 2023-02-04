// console.log("my service worker is running");

try {
    chrome.commands.onCommand.addListener((command, tab) => {
        try {
            if (command == "copyAsMarkdownLink") {
                if (tab != undefined && tab.id != undefined) {
                    console.log(command);
                    chrome.scripting.executeScript({target: {tabId: tab.id}, files: ['myContentScript.js']});
                }
            }
        } catch (e) {console.log('service worker error'); console.log(e);}
    });
} catch (e) {console.log('content script error'); console.log(e);}

// chrome.commands.onCommand.addListener((command) => {
//     const tabPromised = getCurrentTab();
//     if (command == "copyAsMarkdownLink") {
//         tabPromised.then((tab) => {
//             if (tab != undefined && tab.id != undefined) {
//                 console.log(command);
//                 chrome.scripting.executeScript({target: {tabId: tab.id}, files: ['myContentScript.js']});
//             }
//         });
//     }
// });

// async function getCurrentTab() {
//     let queryOptions = { active: true, lastFocusedWindow: true };
//     // `tab` will either be a `tabs.Tab` instance or `undefined`.
//     let [tab] = await chrome.tabs.query(queryOptions);
//     return tab;
// }
