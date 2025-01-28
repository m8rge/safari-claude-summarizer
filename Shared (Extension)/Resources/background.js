chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('1. Message listener triggered', request); // Debug point 1

    if (request.action === 'sendToClaude' && request.subtitles) {
        console.log('2. Correct action and subtitles present:', {
            action: request.action,
            subtitles: request.subtitles
        }); // Debug point 2

        chrome.tabs.create({
            url: 'https://claude.ai',
            active: true
        }, async (tab) => {
            console.log('3. Tab created with ID:', tab.id); // Debug point 3

            // Wait for page to load
            await new Promise(resolve => setTimeout(resolve, 2000));
            console.log('4. After initial wait'); // Debug point 4

            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: (subtitles) => {
                        console.log('5. Injection script started', subtitles); // Debug point 5

                        const waitForElement = setInterval(() => {
                            const input = document.querySelector('fieldset p');
                            console.log('6. Looking for textbox, found:', input); // Debug point 6

                            if (input) {
                                clearInterval(waitForElement);
                                console.log('7. Found input, attempting to set text'); // Debug point 7

                                try {
                                    input.textContent = `Сделай выжимку из субтитров:\n\n${subtitles.text}`;
                                    
                                    const waitForButton = setInterval(() => {
                                        const sendButton = document.querySelector('fieldset button');
                                        
                                        if (sendButton) {
                                            clearInterval(waitForButton);
                                            // Click the send button
                                            sendButton.click();
                                            console.log("Message sent successfully");
                                            return true;
                                        } else {
                                            console.error("Could not find send button");
                                            // Log all buttons for debugging
                                            const allButtons = document.querySelectorAll('button');
                                            console.log("Available buttons:", allButtons);
                                        }
                                    }, 100);

                                } catch (err) {
                                    console.error('Error setting text:', err); // Debug error point
                                }
                            }
                        }, 100);
                    },
                    args: [request.subtitles]
                });
                console.log('9. Script injection completed'); // Debug point 9
            } catch (err) {
                console.error('Error during script injection:', err); // Debug error point
            }
        });
    }
});

// Add error handling for the message listener itself
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.error('Runtime error:', chrome.runtime.lastError);
});
