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

    chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
            if (sender.tab) {
            	// from content script

				var okMark = "copy success";
				var badMark = "copy fail:";
                if (request == okMark) {
                	showCopySuccessNotice().then(id => {setTimeout(() => {chrome.notifications.clear(id)}, 1500);});
                } else if (request.startsWith(badMark)) {
                	showCopyFailNotice(request.substr(badMark.length)).then(id => {setTimeout(() => {chrome.notifications.clear(id)}, 3000);});
                }
             } else {
                 // from service worker (the extension)
             }
         }
     );

    async function showCopySuccessNotice() {
        return await chrome.notifications.create(null, {
            "type": "basic", 
            "title": "Copy OK", 
            "message": "Copy OK", 
            "iconUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAhCAIAAAA3RD4GAAAACXBIWXMAABJ0AAASdAHeZh94AAAAEXRFWHRTb2Z0d2FyZQBTbmlwYXN0ZV0Xzt0AAANJSURBVEiJ1ZZNTBNBFMcfxGOHO917d2uCB7a7BkygfBhJ/AIDRhpoTEwwiImJN0E+TIwfURMTS6EkGEXFRI2IeDARsBcPdLfn7nJmpveZ3tfDkG2Z7m7rByb+T03nzfu9mdn3n2lwHAcOU42Hmv1fAI7UE4QJIaRo2buUsqYmpMiRcLhZCof/AmDl9eqnz18sy64eUhS5pyueHBlGCAVkaAg45JyRv3xlDABkOdLbHQcALRYzTJMPGWYeABBCyZHExPiYL8EJ1E7O3MPYc4hSmkov6m0d0ZbWyduzlFLPsBqAmtrDuH/wUrSldWBo2JMhAu49eLSTM3+JQSm9NTXD11EDsLn1PdrSemtq5pcAnMHXkUovBgF6Tp2OtrQWCpZfokLB8juSPYz1tg69vVPYqHKjra1vEFLsP3dGUWThQ8CEXL4ydvSYeuFi4mTf2eMn4vMLS0KMFA4nRxOMsZXXq96faW/fGUKK375uCB20tZ2dnJ5jjGkxVQo3Y1K0LJuVSrqmvlg+gGGMHT8RVxT547syo9xohBS1mCpkZ4xNTs8hFHq5nHFXxhi7//CxJImdjBDSYqph5jEhbp59AO9VKdwszEmlM4yxZ0+fVO4bQuje3TvgJV1TDTOPcdEF7J8BJkUAqC7Ksnf5NM90frLssrU0Vv6lyOLxGmY+2GoEabEYADDGRADPggmpmqBWRtcUd6rKmvYBvPbqXIocAYD5hUz9DDi4E/sASWoGgJyRF0KvX7uKQqH5haVXb966fzLGpqbnPKmb21k3G5fYBzs/ssKmb21nJ2/PslJJUeSoHMGEFKxd3hYvn3v0gSxH1t6Xqyl38sD5swAg9CEA9HTHP354290Vtyx7bX0jZ+TBcSbGx4Ts7lx+c5RVaVjcTPzcprYXtXfqbR2CFx0wu1R6McDZA0QpHRgaru2mjuO4zl4/g1J6/cZNP58XAa6zDwwNB+yVqz2Mee39g5fqutGcihtKb+9MpTN+S6GUptIZvb2T1+4X5vuqmF/IrLxaZaUSAOiayj1A11TeK4Zp8h8oFEqOJibGr3omgeBnC789Nreztr1bPcrfMsmRxO+/i1xhQjAuWrbNGEMIKbIsSfW+7OoC/In+/9f1T/y6c8c550FJAAAAAElFTkSuQmCC", 
            "silent": true
        });
    }

    async function showCopyFailNotice(message) {
        return await chrome.notifications.create(null, {
            "type": "basic", 
            "title": "Copy FAIL", 
            "message": message, 
            "iconUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAhCAIAAAA3RD4GAAAACXBIWXMAABJ0AAASdAHeZh94AAAAEXRFWHRTb2Z0d2FyZQBTbmlwYXN0ZV0Xzt0AAANJSURBVEiJ1ZZNTBNBFMcfxGOHO917d2uCB7a7BkygfBhJ/AIDRhpoTEwwiImJN0E+TIwfURMTS6EkGEXFRI2IeDARsBcPdLfn7nJmpveZ3tfDkG2Z7m7rByb+T03nzfu9mdn3n2lwHAcOU42Hmv1fAI7UE4QJIaRo2buUsqYmpMiRcLhZCof/AmDl9eqnz18sy64eUhS5pyueHBlGCAVkaAg45JyRv3xlDABkOdLbHQcALRYzTJMPGWYeABBCyZHExPiYL8EJ1E7O3MPYc4hSmkov6m0d0ZbWyduzlFLPsBqAmtrDuH/wUrSldWBo2JMhAu49eLSTM3+JQSm9NTXD11EDsLn1PdrSemtq5pcAnMHXkUovBgF6Tp2OtrQWCpZfokLB8juSPYz1tg69vVPYqHKjra1vEFLsP3dGUWThQ8CEXL4ydvSYeuFi4mTf2eMn4vMLS0KMFA4nRxOMsZXXq96faW/fGUKK375uCB20tZ2dnJ5jjGkxVQo3Y1K0LJuVSrqmvlg+gGGMHT8RVxT547syo9xohBS1mCpkZ4xNTs8hFHq5nHFXxhi7//CxJImdjBDSYqph5jEhbp59AO9VKdwszEmlM4yxZ0+fVO4bQuje3TvgJV1TDTOPcdEF7J8BJkUAqC7Ksnf5NM90frLssrU0Vv6lyOLxGmY+2GoEabEYADDGRADPggmpmqBWRtcUd6rKmvYBvPbqXIocAYD5hUz9DDi4E/sASWoGgJyRF0KvX7uKQqH5haVXb966fzLGpqbnPKmb21k3G5fYBzs/ssKmb21nJ2/PslJJUeSoHMGEFKxd3hYvn3v0gSxH1t6Xqyl38sD5swAg9CEA9HTHP354290Vtyx7bX0jZ+TBcSbGx4Ts7lx+c5RVaVjcTPzcprYXtXfqbR2CFx0wu1R6McDZA0QpHRgaru2mjuO4zl4/g1J6/cZNP58XAa6zDwwNB+yVqz2Mee39g5fqutGcihtKb+9MpTN+S6GUptIZvb2T1+4X5vuqmF/IrLxaZaUSAOiayj1A11TeK4Zp8h8oFEqOJibGr3omgeBnC789Nreztr1bPcrfMsmRxO+/i1xhQjAuWrbNGEMIKbIsSfW+7OoC/In+/9f1T/y6c8c550FJAAAAAElFTkSuQmCC", 
            "silent": true
        });
    }
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
