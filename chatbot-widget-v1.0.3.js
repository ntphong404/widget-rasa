(function() {
    function initChatbotWidget() {
        // 1. Tải thư viện marked.js
        const markedScript = document.createElement('script');
        markedScript.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
        document.head.appendChild(markedScript);

        // 2. Cấu hình API Stream
        const API_URL = 'http://103.170.123.35:5100/widget-chat/stream'; 
        const senderId = 'guest_' + Math.random().toString(36).substring(7);

        // 3. Nhúng CSS (Đã fix lỗi tràn viền và thêm style cho nút Copy)
        const style = document.createElement('style');
        style.innerHTML = `
            #rasa-chat-widget { position: fixed; bottom: 20px; right: 20px; font-family: Arial, sans-serif; z-index: 99999; }
            #rasa-chat-btn { width: 60px; height: 60px; border-radius: 50%; background-color: #007bff; color: white; border: none; cursor: pointer; font-size: 24px; box-shadow: 0 4px 8px rgba(0,0,0,0.2); transition: transform 0.2s; display: flex; align-items: center; justify-content: center; }
            #rasa-chat-btn:hover { transform: scale(1.1); }
            #rasa-chat-window { display: none; width: 380px; height: 550px; background: white; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.2); flex-direction: column; overflow: hidden; margin-bottom: 10px; border: 1px solid #ddd; }
            #rasa-chat-header { background: #007bff; color: white; padding: 15px; font-weight: bold; display: flex; justify-content: space-between; align-items: center; }
            #rasa-chat-messages { flex: 1; padding: 15px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; background: #f9f9f9; scroll-behavior: smooth; }
            
            /* CSS Bong bóng chat */
            .msg { max-width: 85%; padding: 10px 15px; border-radius: 15px; font-size: 14px; line-height: 1.5; word-wrap: break-word; overflow-wrap: break-word; }
            .msg.bot { background: #e9ecef; color: #333; align-self: flex-start; border-bottom-left-radius: 2px; }
            .msg.user { background: #007bff; color: white; align-self: flex-end; border-bottom-right-radius: 2px; }
            .msg a { color: #0056b3; text-decoration: none; font-weight: bold; }
            .msg a:hover { text-decoration: underline; }
            
            /* CSS Render Markdown An Toàn (Chống tràn) */
            .msg-content { width: 100%; overflow: hidden; }
            .msg-content h1, .msg-content h2, .msg-content h3 { margin-top: 5px; margin-bottom: 10px; font-size: 16px; }
            .msg-content p { margin: 0 0 8px 0; }
            .msg-content p:last-child { margin-bottom: 0; }
            .msg-content ul, .msg-content ol { padding-left: 20px; margin: 5px 0; }
            .msg-content table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 13px; }
            .msg-content th, .msg-content td { border: 1px solid #ccc; padding: 6px; text-align: left; }
            .msg-content th { background-color: #d6d8db; }
            .msg-content pre { background: #2b2b2b; color: #f8f8f2; padding: 10px; border-radius: 5px; overflow-x: auto; font-size: 12px; }
            .msg-content code { font-family: monospace; background: rgba(0,0,0,0.05); padding: 2px 4px; border-radius: 3px; }
            
            /* CSS Thanh Công Cụ (Copy) */
            .msg-actions { margin-top: 8px; border-top: 1px solid #ccc; padding-top: 6px; text-align: right; display: none; }
            .copy-btn { font-size: 12px; color: #666; background: none; border: none; cursor: pointer; font-weight: bold; display: inline-flex; align-items: center; gap: 4px; padding: 0; }
            .copy-btn:hover { color: #007bff; }
            
            #rasa-chat-input-area { display: flex; border-top: 1px solid #ddd; padding: 10px; background: white; }
            #rasa-chat-input { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 20px; outline: none; font-size: 14px; }
            #rasa-chat-send { background: none; border: none; color: #007bff; font-weight: bold; cursor: pointer; padding: 0 15px; font-size: 14px; }
            #rasa-chat-send:disabled { color: #aaa; cursor: not-allowed; }

            /* Hiệu ứng Typing */
            .typing-indicator { display: flex; align-items: center; gap: 4px; height: 24px; padding: 0 5px; }
            .typing-indicator span { width: 6px; height: 6px; background-color: #888; border-radius: 50%; animation: blink 1.4s infinite both; }
            .typing-indicator span:nth-child(1) { animation-delay: 0.2s; }
            .typing-indicator span:nth-child(2) { animation-delay: 0.4s; }
            .typing-indicator span:nth-child(3) { animation-delay: 0.6s; }
            @keyframes blink { 0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1.2); } }
        `;
        document.head.appendChild(style);

        // 4. Tạo cấu trúc HTML
        const widgetContainer = document.createElement('div');
        widgetContainer.id = 'rasa-chat-widget';
        widgetContainer.innerHTML = `
            <div id="rasa-chat-window">
                <div id="rasa-chat-header">
                    <span>Hỗ trợ trực tuyến</span>
                    <span id="rasa-chat-close" style="cursor:pointer; font-size: 18px;">✖</span>
                </div>
                <div id="rasa-chat-messages">
                    <div class="msg bot">Xin chào! Mình có thể giúp gì cho bạn?</div>
                </div>
                <div id="rasa-chat-input-area">
                    <input type="text" id="rasa-chat-input" placeholder="Nhập câu hỏi..." autocomplete="off">
                    <button id="rasa-chat-send">Gửi</button>
                </div>
            </div>
            <button id="rasa-chat-btn">💬</button>
        `;
        document.body.appendChild(widgetContainer);

        // 5. Các Elements
        const chatWindow = document.getElementById('rasa-chat-window');
        const inputField = document.getElementById('rasa-chat-input');
        const btnSend = document.getElementById('rasa-chat-send');
        const messagesArea = document.getElementById('rasa-chat-messages');

        document.getElementById('rasa-chat-btn').addEventListener('click', () => {
            chatWindow.style.display = chatWindow.style.display === 'flex' ? 'none' : 'flex';
            if (chatWindow.style.display === 'flex') inputField.focus();
        });
        document.getElementById('rasa-chat-close').addEventListener('click', () => chatWindow.style.display = 'none');

        async function sendStreamMessage(message) {
            // Xử lý UI phần User Gửi
            const userMsgDiv = document.createElement('div');
            userMsgDiv.className = 'msg user';
            userMsgDiv.innerText = message;
            messagesArea.appendChild(userMsgDiv);
            
            inputField.value = '';
            btnSend.disabled = true;
            messagesArea.scrollTop = messagesArea.scrollHeight;

            // Xây dựng Cấu trúc UI cho Bot (Có tách biệt Content và Copy Button)
            const botMsgDiv = document.createElement('div');
            botMsgDiv.className = 'msg bot';
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'msg-content';
            contentDiv.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
            
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'msg-actions';
            
            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-btn';
            copyBtn.innerHTML = '📋 Copy';
            
            actionsDiv.appendChild(copyBtn);
            botMsgDiv.appendChild(contentDiv);
            botMsgDiv.appendChild(actionsDiv);
            messagesArea.appendChild(botMsgDiv);

            let botAccumulatedText = "";
            let isTyping = false;
            let fullTextToType = "";
            let charIndex = 0;
            let streamDone = false;

            // Hàm kích hoạt nút Copy khi đã hoàn tất
            function checkDoneAndAddCopy() {
                if (streamDone && !isTyping && botAccumulatedText.trim().length > 0) {
                    actionsDiv.style.display = 'block';
                    messagesArea.scrollTop = messagesArea.scrollHeight;
                }
            }

            // Xử lý sự kiện Copy
            copyBtn.onclick = () => {
                const cleanText = botAccumulatedText.split(/###\s*References|\*\*References\*\*/i)[0].trim();
                navigator.clipboard.writeText(cleanText);
                copyBtn.innerHTML = '✅ Đã Copy';
                setTimeout(() => copyBtn.innerHTML = '📋 Copy', 2000);
            };

            const renderMarkdown = (text) => {
                let cleanText = text.split(/###\s*References|\*\*References\*\*/i)[0].trim();
                try {
                    if (window.marked) {
                        marked.setOptions({ gfm: true, breaks: true });
                        contentDiv.innerHTML = marked.parse(cleanText); 
                    } else {
                        contentDiv.innerText = cleanText; 
                    }
                } catch (e) {
                    contentDiv.innerText = cleanText; // Fallback an toàn nếu lỗi parse markdown
                }
                messagesArea.scrollTop = messagesArea.scrollHeight;
            };

            const processJsonData = (data) => {
                if (data.type === 'start') {
                    botAccumulatedText = '';
                } 
                else if (data.type === 'token' && data.text) {
                    botAccumulatedText += data.text;
                    renderMarkdown(botAccumulatedText);
                }
                else if (data.type === 'message' && data.text) {
                    fullTextToType += data.text;
                    if (!isTyping) {
                        isTyping = true;
                        function typeNextChar() {
                            if (charIndex < fullTextToType.length) {
                                botAccumulatedText += fullTextToType.charAt(charIndex);
                                renderMarkdown(botAccumulatedText);
                                charIndex++;
                                setTimeout(typeNextChar, 10); // Tốc độ gõ 10ms
                            } else {
                                isTyping = false;
                                checkDoneAndAddCopy(); // Hiện nút Copy khi gõ xong
                            }
                        }
                        typeNextChar();
                    }
                }
            };

            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: message, sender_id: senderId })
                });

                const reader = response.body.getReader();
                const decoder = new TextDecoder('utf-8');
                let buffer = '';

                while (true) {
                    const { done, value } = await reader.read();
                    
                    if (value) {
                        buffer += decoder.decode(value, { stream: true });
                        buffer = buffer.replace(/\}\{/g, '}\n{'); // Tách các json dính nhau
                        
                        // FIX LỖI STREAM: Dùng indexOf chia tách an toàn hơn thay vì split('\n')
                        let boundary = buffer.indexOf('\n');
                        while (boundary !== -1) {
                            let line = buffer.slice(0, boundary).trim();
                            buffer = buffer.slice(boundary + 1);
                            
                            if (line) {
                                try {
                                    processJsonData(JSON.parse(line));
                                } catch (e) {
                                    console.error('Bỏ qua chunk lỗi:', line);
                                }
                            }
                            boundary = buffer.indexOf('\n');
                        }
                    }

                    if (done) {
                        if (buffer.trim()) {
                            try { processJsonData(JSON.parse(buffer.trim())); } catch (e) {}
                        }
                        streamDone = true;
                        checkDoneAndAddCopy(); // Kích hoạt nút Copy nếu stream kết thúc
                        break;
                    }
                }
            } catch (error) {
                contentDiv.innerText = "Lỗi kết nối đến máy chủ.";
            } finally {
                btnSend.disabled = false;
                inputField.focus();
            }
        }

        btnSend.addEventListener('click', () => {
            const text = inputField.value.trim();
            if (text && !btnSend.disabled) sendStreamMessage(text);
        });

        inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const text = inputField.value.trim();
                if (text && !btnSend.disabled) sendStreamMessage(text);
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initChatbotWidget);
    } else {
        initChatbotWidget();
    }
})();
