async function getSubtitles() {
    console.log('Getting subtitles...');

    // Get video ID from URL
    const videoId = new URLSearchParams(window.location.search).get('v');
    if (!videoId) {
        console.log('No video ID found');
        return null;
    }

    try {
        // First, get video info with proper headers
        const videoInfoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const response = await fetch(videoInfoUrl, {
            headers: {
                'Origin': 'https://www.youtube.com',
                'Referer': 'https://www.youtube.com'
            }
        });

        const html = await response.text();
        
        // Find the captionTracks in the ytInitialPlayerResponse
        const match = html.match(/"captionTracks":\s*(\[[^\]]*(?:\[.*?\])*[^\]]*\])/);
        if (!match) {
            console.log('No caption tracks found');
            return null;
        }

        const captionTracks = JSON.parse(match[1]);
        console.log('Caption tracks:', captionTracks);

        // Try to find Russian track first, then fall back to English
        const preferredTrack = captionTracks.find(track =>
            track.languageCode === 'ru' || track.languageCode.startsWith('ru-')) ||
            captionTracks.find(track =>
            track.languageCode === 'en' || track.languageCode.startsWith('en-'));

        if (!preferredTrack?.baseUrl) {
            console.log('No suitable track found');
            return null;
        }

        // Get the language for display
        const subtitleLanguage = preferredTrack.languageCode.startsWith('ru') ? 'Russian' : 'English';
        console.log('Found track in language:', subtitleLanguage);

        // Fetch subtitle content with proper headers
        const subtitleResponse = await fetch(preferredTrack.baseUrl, {
            headers: {
                'Origin': 'https://www.youtube.com',
                'Referer': 'https://www.youtube.com'
            }
        });

        const subtitleXml = await subtitleResponse.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(subtitleXml, 'text/xml');

        // Extract text content
        const textContent = Array.from(doc.getElementsByTagName('text'))
            .map(node => node.textContent)
            .join(' ');

        return {
            text: textContent,
            language: subtitleLanguage
        };

    } catch (error) {
        console.error('Error fetching subtitles:', error);
        return null;
    }
}

// Confirm content script is loaded
console.log('Content script loaded for YouTube subtitles');

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Message received in content script:', request);
    if (request.action === 'downloadSubtitles') {
        getSubtitles().then(subtitles => {
            console.log('Subtitles retrieved:', subtitles);
            if (subtitles) {
                chrome.runtime.sendMessage({
                    action: 'sendToClaude',
                    subtitles
                });
                
                // Show which language was found
                const statusElement = document.createElement('div');
                statusElement.textContent = `Found ${subtitles.language} subtitles`;
                statusElement.style.position = 'fixed';
                statusElement.style.top = '10px';
                statusElement.style.right = '10px';
                statusElement.style.padding = '10px';
                statusElement.style.backgroundColor = '#4CAF50';
                statusElement.style.color = 'white';
                statusElement.style.borderRadius = '5px';
                statusElement.style.zIndex = '9999';
                document.body.appendChild(statusElement);
                
                setTimeout(() => {
                    statusElement.remove();
                }, 3000);
            }
        });
        // Important: Return true to indicate we will send response asynchronously
        return true;
    }
});
