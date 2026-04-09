(function() {
    // Hàm khởi tạo toàn bộ Widget
    function initChatbotWidget() {
        // 1. Cấu hình API Stream
        const API_URL = 'http://103.170.123.35:5100/widget-chat/stream'; 
        const senderId = 'guest_' + Math.random().toString(36).substring(7);

        // 2. Nhúng CSS
        const style = document.createElement('style');
        style.innerHTML = `
            #rasa-chat-widget { position: fixed; bottom: 20px; right: 20px; font-family: Arial, sans-serif; z-index: 99999; }
            #rasa-chat-btn { width: 60px; height: 60px; border-radius: 50%; background-color: #007bff; color: white; border: none; cursor: pointer; font-size: 24px; box-shadow: 0 4px 8px rgba(0,0,0,0.2); transition: transform 0.2s; display: flex; align-items: center; justify-content: center; }
            #rasa-chat-btn:hover { transform: scale(1.1); }
            #rasa-chat-window { display: none; width: 350px; height: 500px; background: white; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.2); flex-direction: column; overflow: hidden; margin-bottom: 10px; border: 1px solid #ddd; }
            #rasa-chat-header { background: #007bff; color: white; padding: 15px; font-weight: bold; display: flex; justify-content: space-between; align-items: center; }
            #rasa-chat-messages { flex: 1; padding: 15px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; background: #f9f9f9; scroll-behavior: smooth; }
            .msg { max-width: 85%; padding: 10px 15px; border-radius: 15px; font-size: 14px; word-wrap: break-word; line-height: 1.5; }
            .msg.bot { background: #e9ecef; color: #333; align-self: flex-start; border-bottom-left-radius: 2px; }
            .msg.user { background: #007bff; color: white; align-self: flex-end; border-bottom-right-radius: 2px; }
            .msg a { color: #0056b3; text-decoration: none; font-weight: bold; }
            .msg a:hover { text-decoration: underline; }
            .msg-refs { margin-top: 8px; font-size: 12px; color: #555; background: #fff; padding: 8px; border-radius: 5px; border: 1px dashed #ccc; }
            #rasa-chat-input-area { display: flex; border-top: 1px solid #ddd; padding: 10px; background: white; }
            #rasa-chat-input { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 20px; outline: none; font-size: 14px; }
            #rasa-chat-send { background: none; border: none; color: #007bff; font-weight: bold; cursor: pointer; padding: 0 15px; font-size: 14px; }
            #rasa-chat-send:disabled { color: #aaa; cursor: not-allowed; }
        `;
        document.head.appendChild(style);

        // 3. Tạo cấu trúc HTML
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

        // 4. Các Elements
        const chatWindow = document.getElementById('rasa-chat-window');
        const inputField = document.getElementById('rasa-chat-input');
        const btnSend = document.getElementById('rasa-chat-send');
        const messagesArea = document.getElementById('rasa-chat-messages');

        // Toggle Chat
        document.getElementById('rasa-chat-btn').addEventListener('click', () => {
            chatWindow.style.display = chatWindow.style.display === 'flex' ? 'none' : 'flex';
            if (chatWindow.style.display === 'flex') inputField.focus();
        });
        document.getElementById('rasa-chat-close').addEventListener('click', () => chatWindow.style.display = 'none');

        // Hàm format Markdown
        function formatMarkdown(text) {
            return text
                .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
                .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')
                .replace(/\n/g, '<br>');
        }

        // Hàm gọi API Stream
        async function sendStreamMessage(message) {
            const userMsgDiv = document.createElement('div');
            userMsgDiv.className = 'msg user';
            userMsgDiv.innerText = message;
            messagesArea.appendChild(userMsgDiv);
            
            inputField.value = '';
            btnSend.disabled = true;
            messagesArea.scrollTop = messagesArea.scrollHeight;

            const botMsgDiv = document.createElement('div');
            botMsgDiv.className = 'msg bot';
            botMsgDiv.innerHTML = '<span style="color:#aaa">Đang trả lời...</span>';
            messagesArea.appendChild(botMsgDiv);

            let botAccumulatedText = "";

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
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop(); // Giữ lại phần chưa hoàn chỉnh

                    for (const line of lines) {
                        if (!line.trim()) continue;
                        
                        try {
                            const data = JSON.parse(line);

                            if (data.type === 'start') {
                                botMsgDiv.innerHTML = '';
                            } else if (data.type === 'token' && data.text) {
                                botAccumulatedText += data.text;
                                botMsgDiv.innerHTML = formatMarkdown(botAccumulatedText);
                                messagesArea.scrollTop = messagesArea.scrollHeight;
                            } else if (data.type === 'references' && data.items && data.items.length > 0) {
                                let refsHtml = '<div class="msg-refs"><b>Tài liệu tham khảo:</b><ul>';
                                data.items.forEach(item => {
                                    refsHtml += `<li>${item}</li>`;
                                });
                                refsHtml += '</ul></div>';
                                botMsgDiv.innerHTML += refsHtml;
                                messagesArea.scrollTop = messagesArea.scrollHeight;
                            }
                        } catch (e) {
                            console.error('Lỗi parse JSON dòng:', line, e);
                        }
                    }
                }
            } catch (error) {
                console.error('Lỗi kết nối Stream:', error);
                botMsgDiv.innerText = "Lỗi kết nối đến máy chủ. Vui lòng thử lại.";
            } finally {
                btnSend.disabled = false;
                inputField.focus();
            }
        }

        // Bắt sự kiện gửi
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

    // Đảm bảo DOM đã tải xong mới khởi tạo Widget
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initChatbotWidget);
    } else {
        initChatbotWidget();
    }
})();
