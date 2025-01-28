document.addEventListener('DOMContentLoaded', () => {
    console.log('Popup loaded');
    document.getElementById('download-subtitles').addEventListener('click', () => {
        console.log('Button clicked');
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            console.log('Sending message to tab:', tabs[0].id);
            chrome.tabs.sendMessage(tabs[0].id, {action: 'downloadSubtitles'}, response => {
                if (chrome.runtime.lastError) {
                    console.error('Error:', chrome.runtime.lastError);
                }
                console.log('Message sent');
            });
        });
    });
});
