(function() {
    // Hàm khởi tạo toàn bộ Widget
    function initChatbotWidget() {
        // 1. Tải thư viện marked.js để xử lý Markdown
        const markedScript = document.createElement('script');
        markedScript.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
        document.head.appendChild(markedScript);

        // 2. Cấu hình API Stream
        const API_URL = 'http://103.170.123.35:5100/widget-chat/stream'; 
        const senderId = 'guest_' + Math.random().toString(36).substring(7);

        // 3. Nhúng CSS
        const style = document.createElement('style');
        style.innerHTML = `
            #rasa-chat-widget { position: fixed; bottom: 20px; right: 20px; font-family: Arial, sans-serif; z-index: 99999; }
            #rasa-chat-btn { width: 60px; height: 60px; border-radius: 50%; background-color: #007bff; color: white; border: none; cursor: pointer; font-size: 24px; box-shadow: 0 4px 8px rgba(0,0,0,0.2); transition: transform 0.2s; display: flex; align-items: center; justify-content: center; }
            #rasa-chat-btn:hover { transform: scale(1.1); }
            #rasa-chat-window { display: none; width: 380px; height: 550px; background: white; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.2); flex-direction: column; overflow: hidden; margin-bottom: 10px; border: 1px solid #ddd; }
            #rasa-chat-header { background: #007bff; color: white; padding: 15px; font-weight: bold; display: flex; justify-content: space-between; align-items: center; }
            #rasa-chat-messages { flex: 1; padding: 15px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; background: #f9f9f9; scroll-behavior: smooth; }
            .msg { max-width: 85%; padding: 10px 15px; border-radius: 15px; font-size: 14px; word-wrap: break-word; line-height: 1.5; }
            .msg.bot { background: #e9ecef; color: #333; align-self: flex-start; border-bottom-left-radius: 2px; }
            .msg.user { background: #007bff; color: white; align-self: flex-end; border-bottom-right-radius: 2px; }
            .msg a { color: #0056b3; text-decoration: none; font-weight: bold; }
            .msg a:hover { text-decoration: underline; }
            
            /* CSS Render Markdown */
            .msg h1, .msg h2, .msg h3 { margin-top: 5px; margin-bottom: 10px; font-size: 16px; }
            .msg p { margin: 0 0 8px 0; }
            .msg p:last-child { margin-bottom: 0; }
            .msg table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 13px; }
            .msg th, .msg td { border: 1px solid #ccc; padding: 6px; text-align: left; }
            .msg th { background-color: #d6d8db; }
            .msg pre { background: #2b2b2b; color: #f8f8f2; padding: 10px; border-radius: 5px; overflow-x: auto; font-size: 12px; }
            .msg code { font-family: monospace; background: rgba(0,0,0,0.05); padding: 2px 4px; border-radius: 3px; }
            
            #rasa-chat-input-area { display: flex; border-top: 1px solid #ddd; padding: 10px; background: white; }
            #rasa-chat-input { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 20px; outline: none; font-size: 14px; }
            #rasa-chat-send { background: none; border: none; color: #007bff; font-weight: bold; cursor: pointer; padding: 0 15px; font-size: 14px; }
            #rasa-chat-send:disabled { color: #aaa; cursor: not-allowed; }
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

        // Toggle Chat
        document.getElementById('rasa-chat-btn').addEventListener('click', () => {
            chatWindow.style.display = chatWindow.style.display === 'flex' ? 'none' : 'flex';
            if (chatWindow.style.display === 'flex') inputField.focus();
        });
        document.getElementById('rasa-chat-close').addEventListener('click', () => chatWindow.style.display = 'none');

        // Hàm gọi API Stream
        async function sendStreamMessage(message) {
            // Hiển thị tin nhắn user
            const userMsgDiv = document.createElement('div');
            userMsgDiv.className = 'msg user';
            userMsgDiv.innerText = message;
            messagesArea.appendChild(userMsgDiv);
            
            inputField.value = '';
            btnSend.disabled = true;
            messagesArea.scrollTop = messagesArea.scrollHeight;

            // Tạo khung chứa tin nhắn bot
            const botMsgDiv = document.createElement('div');
            botMsgDiv.className = 'msg bot';
            botMsgDiv.innerHTML = '<span style="color:#aaa">Đang trả lời...</span>';
            messagesArea.appendChild(botMsgDiv);

            let botAccumulatedText = "";

            // Hàm xử lý từng object JSON lấy được
            const processJsonData = (data) => {
                if (data.type === 'start') {
                    botMsgDiv.innerHTML = ''; // Xóa chữ "Đang trả lời..."
                } 
                // NHẬN DIỆN CẢ 2 TYPE: 'message' (Rasa) HOẶC 'token' (RAG)
                else if ((data.type === 'message' || data.type === 'token') && data.text) {
                    botAccumulatedText += data.text;
                    
                    // Xử lý Markdown (Heading, Table, List, Link...)
                    if (window.marked) {
                        marked.setOptions({ gfm: true, breaks: true });
                        botMsgDiv.innerHTML = marked.parse(botAccumulatedText);
                    } else {
                        botMsgDiv.innerText = botAccumulatedText; 
                    }
                    messagesArea.scrollTop = messagesArea.scrollHeight;
                }
                // Các type khác như 'meta', 'references', 'done' sẽ mặc định bị bỏ qua (không render ra UI)
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
                        // Tách các JSON dính chùm của Rasa (}{ -> }\n{)
                        buffer = buffer.replace(/\}\{/g, '}\n{');
                        
                        const lines = buffer.split('\n');
                        buffer = lines.pop(); // Giữ lại dòng cuối (có thể bị cắt ngang do mạng)

                        for (const line of lines) {
                            if (!line.trim()) continue;
                            try {
                                processJsonData(JSON.parse(line));
                            } catch (e) {
                                console.error('Lỗi parse JSON dòng:', line);
                            }
                        }
                    }

                    if (done) {
                        // Xử lý nốt phần buffer cuối cùng (nếu còn sót lại khi ngắt stream)
                        if (buffer.trim()) {
                            try {
                                processJsonData(JSON.parse(buffer));
                            } catch (e) {
                                console.error('Lỗi parse JSON đoạn cuối:', buffer);
                            }
                        }
                        break;
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

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initChatbotWidget);
    } else {
        initChatbotWidget();
    }
})();
