// the extension script
// console.log("my service worker is running");

try {
    chrome.commands.onCommand.addListener((command, tab) => {
        try {
            if (command == "copyAsMarkdownLink") {
                if (tab != undefined && tab.id != undefined) {
                    console.log(command);
                    chrome.scripting.executeScript({target: {tabId: tab.id}, files: ['copyAsMarkdownLink.js']});
                }
            }
            //else if (command == "copyAsMarkdownLinkAlsoJumpToText") {
            //    if (tab != undefined && tab.id != undefined) {
            //        console.log(command);
            //        chrome.scripting.executeScript({target: {tabId: tab.id}, files: ['copyAsMarkdownLinkAlsoJumpToText.js']});
            //    }
            //}
        } catch (e) {console.log('failed to execute content script'); console.log(e); return;}
    });
    console.log('content script is listening');

    // chrome.runtime.onMessage.addListener(
    //     function(request, sender, sendResponse) {
    //         if (sender.tab) {
    //             // from content script

    //             if (request == "copy success") {
    //                 showCopySuccessNotice();
    //             }
    //         } else {
    //             // from service worker (the extension)
    //         }
    //     }
    // );

    // async function showCopySuccessNotice() {
    //     await chrome.notifications.create('success to copy as markdownlink', {
    //         "type": "basic", 
    //         "title": "Copy Success", 
    //         "message": "success to copy as markdownlink", 
    //         "iconUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAIAAACRXR/mAAAACXBIWXMAABJ0AAASdAHeZh94AAAAEXRFWHRTb2Z0d2FyZQBTbmlwYXN0ZV0Xzt0AAAOASURBVFiF7ZhLTBNBGMc/jccOd7r37tYED2x3CZhAeRhNfIEBAw02JiYYxMTEGy/FxPiImphYCjXByENI1IiKBxMBe/FAd3vuLmdmep/pfT1MssFtcR+Actj/qdnZ+ebXb6b/75sesywLjp6O/2+A2gqx/CjE8qMQy49CLD8KsfzoiGKd2M9kTAghZcPcppTV1SFJjEWj9UI0+t+wFpaWP3/9Zhhm9ZAkiZ3tyfTgAEIoMNaxAI1NQStevzEEAKIY6+pIAoCSSGi6zoc0vQgACKH0YGpkeCgglxVIWwV9B+OaQ5TSTHZWbW6NNzSOTdynlAaIHxDLVTsYd/f2xxsae/oGApB5xXr05NlWQfcVmlI6On6P5+xQsNY3fsYbGkfH7/mNTinlOctkZw8eq/Ps+XhDY6lk7PVCqWTsddR2MFabW9WWNl9b6W6nq1/WCCl3X7ogSaJjCBNy/cbQyVPylaupM+cuNp1OTs+8drwjRKPpaynG2MLSsvcfortBdJ27QEj5x/c1h09ubObHJqcYY0pCFqL1mJQNw2SViqrIb+f+gGOMNZ1OSpL46b1XMnc7JaSsJGQHE2NsbHIKocj8XM7OImPs8dPnguB0eYSQkpA1vYgJ8VgDXLC4jwvResfzTDbHGHv18sXunUUIPXr4oGYcVZE1vYhx2SOWy9nCpAwA1QkwzG2+mJc1ds2qUayCYPFAkug87Jpe9FXylEQCABhjB4PF18aEVC0je18DAHjF9P5NXLB4nqoJJDEGANMzOe9kUCvrAbEEoR4AClrR8fz2rZsoEpmeeb34bsV+yBgbn5yqybq+mbejeZFX39r6lXdswcZmfmziPqtUJEmMizFMSMnY5jY2/6aGb4libPXDCniTu8v3XL4IANUe3dmR/PRxpaM9aRjm6pe1glYEyxoZHnIw2XN5Z+ZVruWJUsqL2l5Vz70mtrSpza2+aqKnUp3JzgbrnCilPX0Dh9VBWJZld07eySilt+/cDdYRecWyO6eevoG/7KatHYx5nrp7+w+xO7V2dZtqS1smm9trMUppJptTW9p4noL18r5vPtMzuYXFZVapAICqyLyqqIrMvU3Tdf4BRSLpa6mR4Zu+gtsKciHjPd36Zt40t6tH+S0tPZj61/dEW5gQjMuGaTLGEEKSKArCwdyq94V1eDqif42EWH4UYvlRiOVHIZYf/QaFm43rUj/iNQAAAABJRU5ErkJggg=="
    //     });
    // }
} catch (e) {console.log('failed to execute service worker\n', e);}

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
