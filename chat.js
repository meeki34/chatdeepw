const API_KEY = "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";
const MODEL = "deepseek/deepseek-r1:free";

const chatForm = document.getElementById('chat-form');
const messages = document.getElementById('messages');
const userInput = document.getElementById('user-input');

// Load portfolio data
fetch('portfolio.json')
  .then(response => response.json())
  .then(portfolio => {
    const portfolioContent = document.querySelector('.portfolio-content');
    if (portfolioContent) {
      // Already loaded in HTML, no need to duplicate
    }
  })
  .catch(error => {
    console.error('Error loading portfolio:', error);
  });

// Dark mode toggle functionality
const darkModeToggle = document.querySelector('.dark-mode-toggle');

darkModeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  darkModeToggle.innerHTML = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
});

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const userMessage = userInput.value.trim();
  if (!userMessage) return;

  // Add user message to chat
  const userMessageElement = document.createElement('div');
  userMessageElement.className = 'message user-message';
  userMessageElement.innerHTML = `<p>${userMessage}</p>`;
  messages.appendChild(userMessageElement);
  userInput.value = '';
  messages.scrollTop = messages.scrollHeight;

  // Get bot response
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
  { role: "system", content: "You are a helpful assistant. When responding to user queries, use # Header1 for main points, ### Header3 for subheadings, **bold** for emphasis, *italic* for italics, and - for bullet points. For tabular data, use markdown tables with pipes and dashes. You can reference the portfolio information about the BCA student who built this chatbot." },
          { role: "user", content: userMessage }
        ],
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Create bot message container
    const botMessageElement = document.createElement('div');
    botMessageElement.className = 'message bot-message';
    botMessageElement.innerHTML = `<div class="message-content"></div>`;
    messages.appendChild(botMessageElement);
    messages.scrollTop = messages.scrollHeight;

    // Stream response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    
    while (!done) {
      const { value, done: streamDone } = await reader.read();
      done = streamDone;
      
      if (value) {
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim().startsWith('data:'));
        
        for (const line of lines) {
          try {
            const json = JSON.parse(line.replace('data: ', ''));
            const text = json.choices[0]?.delta?.content || '';
            
            
            const processedText = text
              .replace(/^# (.*?)$/gm, '<h1>$1</h1>')          // # Header -> h1
              .replace(/^### (.*?)$/gm, '<h3>$1</h3>')        // ### Header -> h3
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // **bold** -> strong
              .replace(/_(.*?)_/g, '<em>$1</em>')              // _italic_ -> em
              .replace(/^\- (.*?)(\n|$)/gm, '<li>$1</li>')    // - list -> li
              .replace(/<li>/g, '<ul><li>')                   // Wrap list items in ul
              .replace(/<\/li>/g, '<\/li><\/ul>');             // Close ul after list items
            
            
            botMessageElement.querySelector('.message-content').innerHTML += processedText;
            
          
            if (done) {
              const signature = document.createElement('div');
              signature.className = 'creator-signature';
              signature.innerHTML = `<p>Created by: Syed Zahid</p>`;
              messages.appendChild(signature);
            }
          } catch (e) {
            console.error('Error parsing stream:', e);
          }
        }
      
      }
    }
  } catch (error) {
    console.error('Chat error:', error);
    const errorElement = document.createElement('div');
    errorElement.className = 'message bot-message';
    errorElement.innerHTML = `<p>Chatbot error: ${error.message}</p>`;
    messages.appendChild(errorElement);
  }
});
