/**
 * KMA Chatbot Widget
 * Embeddable chatbot widget for guest users
 * Usage: <script src="http://your-server:5000/widget.js"></script>
 */

(function() {
  'use strict';
  
  // Configuration
  const config = window.CHATBOT_CONFIG || {
    enableStreaming: true
  };
  const API_URL = 'http://103.170.123.35:5100'; 

  
  const BOT_NAME = config.botName || 'Trợ lý KMA';
  const PRIMARY_COLOR = config.primaryColor || '#0066cc';
  const POSITION = config.position || 'bottom-right';
  const AUTO_OPEN = config.autoOpen || false;
  const SHOW_SUGGESTIONS = config.showSuggestions !== false;
  const ENABLE_STREAMING = config.enableStreaming === true;
  const STYLE_ELEMENT_ID = 'kma-chatbot-inline-styles';
  const FAKE_TYPING_MIN_LENGTH = 20;
  const FAKE_TYPING_WORD_DELAY = 55;
  
  // Generate unique sender ID
  function generateSenderId() {
    let senderId = localStorage.getItem('kma_chatbot_sender_id');
    if (!senderId) {
      senderId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('kma_chatbot_sender_id', senderId);
    }
    return senderId;
  }
  
  const SENDER_ID = generateSenderId();

  function injectStyles() {
    if (document.getElementById(STYLE_ELEMENT_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ELEMENT_ID;
    style.textContent = `
      #kma-chatbot-widget {
        position: fixed;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      }

      .kma-chatbot-bottom-right {
        bottom: 20px;
        right: 20px;
      }

      .kma-chatbot-bottom-left {
        bottom: 20px;
        left: 20px;
      }

      .kma-chat-button {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background-color: ${PRIMARY_COLOR};
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transition: transform 0.2s, box-shadow 0.2s;
      }

      .kma-chat-button:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
      }

      .kma-chat-container {
        position: absolute;
        bottom: 80px;
        right: 0;
        width: 380px;
        height: 600px;
        max-height: 80vh;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .kma-chat-header {
        background-color: ${PRIMARY_COLOR};
        color: white;
        padding: 16px 20px;
        font-weight: 600;
        font-size: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .kma-close-btn {
        background: none;
        border: none;
        color: white;
        font-size: 28px;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        transition: background-color 0.2s;
      }

      .kma-close-btn:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }

      .kma-chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        background-color: #f5f5f5;
      }

      .kma-message {
        margin-bottom: 16px;
        display: flex;
      }

      .kma-user-message {
        justify-content: flex-end;
      }

      .kma-bot-message {
        justify-content: flex-start;
      }

      .kma-message-content {
        max-width: 75%;
        padding: 12px 16px;
        border-radius: 12px;
        word-wrap: break-word;
        white-space: pre-wrap;
      }

      .kma-message-content p,
      .kma-message-content ul,
      .kma-message-content ol,
      .kma-message-content pre,
      .kma-message-content h1,
      .kma-message-content h2,
      .kma-message-content h3,
      .kma-message-content h4,
      .kma-message-content h5,
      .kma-message-content h6 {
        margin: 0 0 10px;
      }

      .kma-message-content p:last-child,
      .kma-message-content ul:last-child,
      .kma-message-content ol:last-child,
      .kma-message-content pre:last-child,
      .kma-message-content h1:last-child,
      .kma-message-content h2:last-child,
      .kma-message-content h3:last-child,
      .kma-message-content h4:last-child,
      .kma-message-content h5:last-child,
      .kma-message-content h6:last-child {
        margin-bottom: 0;
      }

      .kma-message-content ul,
      .kma-message-content ol {
        padding-left: 20px;
      }

      .kma-message-content li + li {
        margin-top: 4px;
      }

      .kma-message-content a {
        text-decoration: underline;
      }

      .kma-message-content pre {
        overflow-x: auto;
        padding: 10px 12px;
        border-radius: 8px;
        background: #f1f5f9;
        white-space: pre-wrap;
      }

      .kma-user-message .kma-message-content pre {
        background: rgba(255, 255, 255, 0.18);
      }

      .kma-message-content code {
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      }

      .kma-message-content :not(pre) > code {
        padding: 1px 5px;
        border-radius: 5px;
        background: rgba(15, 23, 42, 0.08);
      }

      .kma-user-message .kma-message-content :not(pre) > code {
        background: rgba(255, 255, 255, 0.18);
      }

      .kma-md-heading {
        font-size: 15px;
        font-weight: 700;
        line-height: 1.4;
      }

      .kma-md-paragraph {
        line-height: 1.55;
      }

      .kma-user-message .kma-message-content {
        background-color: ${PRIMARY_COLOR};
        color: white;
        border-bottom-right-radius: 4px;
      }

      .kma-user-message .kma-message-content,
      .kma-user-message .kma-message-content p,
      .kma-user-message .kma-message-content li,
      .kma-user-message .kma-message-content strong,
      .kma-user-message .kma-message-content em,
      .kma-user-message .kma-message-content h1,
      .kma-user-message .kma-message-content h2,
      .kma-user-message .kma-message-content h3,
      .kma-user-message .kma-message-content h4,
      .kma-user-message .kma-message-content h5,
      .kma-user-message .kma-message-content h6,
      .kma-user-message .kma-message-content a {
        color: #ffffff;
      }

      .kma-bot-message .kma-message-content {
        background-color: white;
        color: #1f2937;
        border-bottom-left-radius: 4px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      }

      .kma-bot-message .kma-message-content,
      .kma-bot-message .kma-message-content p,
      .kma-bot-message .kma-message-content li,
      .kma-bot-message .kma-message-content strong,
      .kma-bot-message .kma-message-content em,
      .kma-bot-message .kma-message-content h1,
      .kma-bot-message .kma-message-content h2,
      .kma-bot-message .kma-message-content h3,
      .kma-bot-message .kma-message-content h4,
      .kma-bot-message .kma-message-content h5,
      .kma-bot-message .kma-message-content h6 {
        color: #1f2937;
      }

      .kma-bot-message .kma-message-content a {
        color: #0b57d0;
      }

      .kma-typing-indicator {
        display: flex;
        gap: 4px;
        padding: 12px 16px;
      }

      .kma-typing-indicator span {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: #999;
        animation: kma-typing 1.4s infinite;
      }

      .kma-typing-indicator span:nth-child(2) {
        animation-delay: 0.2s;
      }

      .kma-typing-indicator span:nth-child(3) {
        animation-delay: 0.4s;
      }

      @keyframes kma-typing {
        0%, 60%, 100% {
          opacity: 0.3;
          transform: translateY(0);
        }
        30% {
          opacity: 1;
          transform: translateY(-4px);
        }
      }

      .kma-message-buttons {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 16px;
      }

      .kma-response-button {
        background: white;
        border: 1px solid #ddd;
        padding: 10px 16px;
        border-radius: 8px;
        cursor: pointer;
        text-align: left;
        font-size: 14px;
        transition: all 0.2s;
      }

      .kma-response-button:hover {
        background-color: #f0f0f0;
        border-color: ${PRIMARY_COLOR};
      }

      .kma-suggested-questions {
        padding: 12px 20px;
        border-top: 1px solid #e0e0e0;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        background: white;
      }

      .kma-suggested-question {
        color: black;
        background: white;
        border: 1px solid #ddd;
        padding: 8px 12px;
        border-radius: 16px;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s;
        white-space: nowrap;
      }

      .kma-suggested-question:hover {
        border-color: ${PRIMARY_COLOR};
        color: ${PRIMARY_COLOR};
        background-color: #f0f7ff;
      }

      .kma-chat-input-container {
        display: flex;
        padding: 16px 20px;
        border-top: 1px solid #e0e0e0;
        background: white;
        gap: 8px;
      }

      .kma-chat-input {
        flex: 1;
        border: 1px solid #ddd;
        border-radius: 20px;
        padding: 10px 16px;
        font-size: 14px;
        outline: none;
        transition: border-color 0.2s;
        background: white;
        color: black;
      }

      .kma-chat-input:focus {
        border-color: ${PRIMARY_COLOR};
      }

      .kma-send-btn {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: #f0f0f0;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s;
      }

      .kma-send-btn:hover {
        background-color: ${PRIMARY_COLOR};
      }

      .kma-send-btn:hover svg {
        stroke: white;
      }

      @media (max-width: 480px) {
        .kma-chat-container {
          width: calc(100vw - 40px);
          height: calc(100vh - 100px);
          max-height: none;
        }

        .kma-chatbot-bottom-right,
        .kma-chatbot-bottom-left {
          left: 20px;
          right: 20px;
        }
      }

      .kma-chat-messages::-webkit-scrollbar {
        width: 6px;
      }

      .kma-chat-messages::-webkit-scrollbar-track {
        background: transparent;
      }

      .kma-chat-messages::-webkit-scrollbar-thumb {
        background: #ccc;
        border-radius: 3px;
      }

      .kma-chat-messages::-webkit-scrollbar-thumb:hover {
        background: #999;
      }
    `;

    document.head.appendChild(style);
  }
  
  // Create widget HTML
  function createWidget() {
    const widget = document.createElement('div');
    widget.id = 'kma-chatbot-widget';
    widget.className = `kma-chatbot-${POSITION}`;
    
    widget.innerHTML = `
      <div class="kma-chat-button" id="kma-chat-button">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </div>
      
      <div class="kma-chat-container" id="kma-chat-container" style="display: ${AUTO_OPEN ? 'flex' : 'none'}">
        <div class="kma-chat-header">
          <span>${BOT_NAME}</span>
          <button class="kma-close-btn" id="kma-close-btn">×</button>
        </div>
        
        <div class="kma-chat-messages" id="kma-chat-messages">
          <div class="kma-message kma-bot-message">
            <div class="kma-message-content">Xin chào! Tôi có thể giúp gì cho bạn?</div>
          </div>
        </div>
        
        ${SHOW_SUGGESTIONS ? '<div class="kma-suggested-questions" id="kma-suggested-questions"></div>' : ''}
        
        <div class="kma-chat-input-container">
          <input type="text" class="kma-chat-input" id="kma-chat-input" placeholder="Nhập câu hỏi...">
          <button class="kma-send-btn" id="kma-send-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(widget);
  }
  
  // Load suggested questions
  async function loadSuggestedQuestions() {
    if (!SHOW_SUGGESTIONS) return;
    
    try {
      const response = await fetch(`${API_URL}/suggested-questions`);
      const data = await response.json();
      const questions = extractSuggestedQuestions(data);
      
      if (response.ok && questions.length) {
        const container = document.getElementById('kma-suggested-questions');
        container.innerHTML = questions.slice(0, 4).map(q => 
          `<button class="kma-suggested-question">${q}</button>`
        ).join('');
        
        // Add click handlers
        container.querySelectorAll('.kma-suggested-question').forEach(btn => {
          btn.addEventListener('click', () => {
            sendMessage(btn.textContent);
            container.style.display = 'none';
          });
        });
      }
    } catch (error) {
      console.error('Failed to load suggested questions:', error);
    }
  }
  
  // Send message to API
  async function sendMessage(message) {
    if (!message.trim()) return;

    hideSuggestedQuestions();
    
    // Add user message to chat
    addMessage(message, 'user');
    
    // Clear input
    const input = document.getElementById('kma-chat-input');
    input.value = '';
    
    // Show typing indicator
    const typingId = addTypingIndicator();
    
    try {
      if (ENABLE_STREAMING) {
        await sendMessageStream(message, typingId);
        return;
      }

      const response = await fetch(`${API_URL}/widget-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, sender_id: SENDER_ID })
      });
      
      const data = await response.json();
      
      // Remove typing indicator
      removeTypingIndicator(typingId);
      
      const responses = extractResponses(data);

      if (response.ok && responses.length) {
        const textParts = [];
        const buttonGroups = [];

        responses.forEach(resp => {
          if (resp.text) {
            textParts.push(resp.text);
          }
          if (Array.isArray(resp.buttons) && resp.buttons.length) {
            buttonGroups.push(resp.buttons);
          }
        });

        if (textParts.length) {
          await addBotMessageWithFakeTyping(textParts.join('\n\n'));
        }

        buttonGroups.forEach(addButtons);
      } else {
        addMessage(extractErrorMessage(data) || 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.', 'bot');
      }
    } catch (error) {
      removeTypingIndicator(typingId);
      addMessage('Không thể kết nối đến server. Vui lòng thử lại sau.', 'bot');
      console.error('Chat error:', error);
    }
  }

  async function sendMessageStream(message, typingId) {
    const response = await fetch(`${API_URL}/widget-chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, sender_id: SENDER_ID })
    });

    if (!response.ok || !response.body) {
      throw new Error(`Streaming request failed with status ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let streamMessageContent = null;
    let streamMessageTextParts = [];
    let shouldFakeTypeMessageEvents = false;
    let hasTokenStream = false;

    const ensureStreamBubble = () => {
      if (!streamMessageContent) {
        removeTypingIndicator(typingId);
        streamMessageContent = addMessage('', 'bot');
      }
      return streamMessageContent;
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;

        let event;
        try {
          event = JSON.parse(line);
        } catch (error) {
          console.error('Failed to parse stream event:', error, line);
          continue;
        }

        if (event.type === 'token') {
          hasTokenStream = true;
          const bubble = ensureStreamBubble();
          bubble.dataset.rawText = (bubble.dataset.rawText || '') + (event.text || '');
          bubble.innerHTML = renderMarkdown(bubble.dataset.rawText);
          scrollMessagesToBottom();
          continue;
        }

        if (event.type === 'meta') {
          shouldFakeTypeMessageEvents = event.streaming === false;
          continue;
        }

        if (event.type === 'message' && event.text) {
          const bubble = ensureStreamBubble();
          const nextText = streamMessageTextParts.concat(event.text).join('\n\n');

          if (shouldFakeTypeMessageEvents && !hasTokenStream && event.text.length > FAKE_TYPING_MIN_LENGTH) {
            await typeTextIntoBubble(bubble, nextText, bubble.dataset.rawText || '');
          } else {
            bubble.dataset.rawText = nextText;
            bubble.innerHTML = renderMarkdown(nextText);
            scrollMessagesToBottom();
          }

          streamMessageTextParts.push(event.text);
          continue;
        }

        if (event.type === 'buttons' && Array.isArray(event.buttons)) {
          removeTypingIndicator(typingId);
          addButtons(event.buttons);
          continue;
        }

        if (event.type === 'references' && Array.isArray(event.items) && event.items.length) {
          const bubble = ensureStreamBubble();
          const referenceText = `Tài liệu tham khảo:\n- ${event.items.join('\n- ')}`;
          const currentText = bubble.dataset.rawText || '';
          bubble.dataset.rawText = currentText ? `${currentText}\n\n${referenceText}` : referenceText;
          bubble.innerHTML = renderMarkdown(bubble.dataset.rawText);
          scrollMessagesToBottom();
          continue;
        }

        if (event.type === 'error') {
          removeTypingIndicator(typingId);
          addMessage(event.message || 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.', 'bot');
        }
      }
    }

    removeTypingIndicator(typingId);
  }
  
  // Add message to chat
  function addMessage(text, sender) {
    const messagesContainer = document.getElementById('kma-chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `kma-message kma-${sender}-message`;
    messageDiv.innerHTML = `<div class="kma-message-content">${renderMarkdown(text)}</div>`;
    messagesContainer.appendChild(messageDiv);
    scrollMessagesToBottom();
    return messageDiv.querySelector('.kma-message-content');
  }

  async function addBotMessageWithFakeTyping(text) {
    if (!text || text.length <= FAKE_TYPING_MIN_LENGTH) {
      addMessage(text, 'bot');
      return;
    }

    const bubble = addMessage('', 'bot');
    await typeTextIntoBubble(bubble, text);
  }
  
  // Add buttons
  function addButtons(buttons) {
    const messagesContainer = document.getElementById('kma-chat-messages');
    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'kma-message-buttons';
    
    buttons.forEach(btn => {
      const button = document.createElement('button');
      button.className = 'kma-response-button';
      button.textContent = btn.title;
      
      if (btn.type === 'web_url') {
        button.onclick = () => window.open(btn.payload, '_blank');
      } else {
        button.onclick = () => sendMessage(btn.payload);
      }
      
      buttonsDiv.appendChild(button);
    });
    
    messagesContainer.appendChild(buttonsDiv);
    scrollMessagesToBottom();
  }
  
  // Typing indicator
  function addTypingIndicator() {
    const messagesContainer = document.getElementById('kma-chat-messages');
    const typingDiv = document.createElement('div');
    const id = 'typing-' + Date.now();
    typingDiv.id = id;
    typingDiv.className = 'kma-message kma-bot-message';
    typingDiv.innerHTML = '<div class="kma-typing-indicator"><span></span><span></span><span></span></div>';
    messagesContainer.appendChild(typingDiv);
    scrollMessagesToBottom();
    return id;
  }
  
  function removeTypingIndicator(id) {
    const element = document.getElementById(id);
    if (element) element.remove();
  }

  function scrollMessagesToBottom() {
    const messagesContainer = document.getElementById('kma-chat-messages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function hideSuggestedQuestions() {
    const container = document.getElementById('kma-suggested-questions');
    if (container) {
      container.style.display = 'none';
    }
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function typeTextIntoBubble(bubble, fullText, initialText) {
    const baseText = initialText || '';
    const nextText = typeof fullText === 'string' ? fullText : '';

    if (!bubble) return;
    if (nextText.length <= FAKE_TYPING_MIN_LENGTH) {
      bubble.dataset.rawText = nextText;
      bubble.innerHTML = renderMarkdown(nextText);
      scrollMessagesToBottom();
      return;
    }

    const suffix = nextText.startsWith(baseText) ? nextText.slice(baseText.length) : nextText;
    const segments = suffix.split(/(\s+)/).filter(Boolean);
    let currentText = baseText;

    for (const segment of segments) {
      currentText += segment;
      bubble.dataset.rawText = currentText;
      bubble.innerHTML = renderMarkdown(currentText);
      scrollMessagesToBottom();
      if (!/^\s+$/.test(segment)) {
        await delay(FAKE_TYPING_WORD_DELAY);
      }
    }
  }
  
  // Escape HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function extractResponses(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload && payload.result && payload.result.responses)) {
      return payload.result.responses;
    }
    if (Array.isArray(payload && payload.data && payload.data.responses)) {
      return payload.data.responses;
    }
    return [];
  }

  function extractErrorMessage(payload) {
    if (!payload || typeof payload !== 'object') return '';
    return payload.message || payload.error || '';
  }

  function extractSuggestedQuestions(payload) {
    if (Array.isArray(payload && payload.result && payload.result.questions)) {
      return payload.result.questions;
    }
    if (Array.isArray(payload && payload.data && payload.data.questions)) {
      return payload.data.questions;
    }
    return [];
  }

  function renderMarkdown(text) {
    const source = typeof text === 'string' ? text : '';
    if (!source) return '';

    const codeBlocks = [];
    let escaped = escapeHtml(source).replace(/\r\n/g, '\n');

    escaped = escaped.replace(/```([\w-]+)?\n?([\s\S]*?)```/g, function(_, language, code) {
      const index = codeBlocks.push({
        language: language ? ` language-${language}` : '',
        code: code.replace(/^\n+|\n+$/g, '')
      }) - 1;
      return `@@CODEBLOCK_${index}@@`;
    });

    const blocks = escaped.split(/\n{2,}/).map(block => block.trim()).filter(Boolean);
    const html = blocks.map(renderMarkdownBlock).join('');

    return html.replace(/@@CODEBLOCK_(\d+)@@/g, function(_, index) {
      const block = codeBlocks[Number(index)];
      if (!block) return '';
      return `<pre class="kma-md-pre"><code class="kma-md-code${block.language}">${block.code}</code></pre>`;
    });
  }

  function renderMarkdownBlock(block) {
    if (!block) return '';

    if (/^@@CODEBLOCK_\d+@@$/.test(block)) {
      return `<div class="kma-md-block">${block}</div>`;
    }

    const lines = block.split('\n');

    if (lines.every(line => /^\s*[-*+]\s+/.test(line))) {
      const items = lines.map(line => `<li>${renderInlineMarkdown(line.replace(/^\s*[-*+]\s+/, ''))}</li>`).join('');
      return `<ul class="kma-md-list">${items}</ul>`;
    }

    if (lines.every(line => /^\s*\d+\.\s+/.test(line))) {
      const items = lines.map(line => `<li>${renderInlineMarkdown(line.replace(/^\s*\d+\.\s+/, ''))}</li>`).join('');
      return `<ol class="kma-md-list">${items}</ol>`;
    }

    const headingMatch = block.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = Math.min(headingMatch[1].length, 6);
      return `<h${level} class="kma-md-heading">${renderInlineMarkdown(headingMatch[2])}</h${level}>`;
    }

    return `<p class="kma-md-paragraph">${lines.map(renderInlineMarkdown).join('<br>')}</p>`;
  }

  function renderInlineMarkdown(text) {
    let html = text || '';

    html = html.replace(/`([^`]+)`/g, '<code class="kma-md-inline-code">$1</code>');
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,!?:;]|$)/g, '$1<em>$2</em>');
    html = html.replace(/(^|[\s(])_([^_\n]+)_(?=[\s).,!?:;]|$)/g, '$1<em>$2</em>');
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    html = html.replace(/(^|[\s>])(https?:\/\/[^\s<]+)/g, '$1<a href="$2" target="_blank" rel="noopener noreferrer">$2</a>');

    return html;
  }
  
  // Initialize
  function init() {
    injectStyles();
    createWidget();
    loadSuggestedQuestions();
    
    // Event listeners
    document.getElementById('kma-chat-button').addEventListener('click', () => {
      const container = document.getElementById('kma-chat-container');
      container.style.display = container.style.display === 'none' ? 'flex' : 'none';
    });
    
    document.getElementById('kma-close-btn').addEventListener('click', () => {
      document.getElementById('kma-chat-container').style.display = 'none';
    });
    
    document.getElementById('kma-send-btn').addEventListener('click', () => {
      const input = document.getElementById('kma-chat-input');
      sendMessage(input.value);
    });
    
    document.getElementById('kma-chat-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendMessage(e.target.value);
      }
    });
  }
  
  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
