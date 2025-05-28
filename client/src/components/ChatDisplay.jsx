import React, { useState, useEffect, useRef } from 'react';

const ChatDisplay = ({socket, username, code}) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [autoScroll, setAutoScroll] = useState(true)
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const sendMessage = () => {
    if (input.trim()) {
      const messageData = {
        username,
        message: input.trim(),
        timestamp: Date.now()
      };

      socket.emit('chat-message', messageData);
      setInput('');
    }
  };

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (data) => {
      setMessages(prev => [...prev, data]);
    };

    socket.on('chat-message', handleMessage);

    return () => {
      socket.off('chat-message', handleMessage);
    };
  }, [socket]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const atBottom = scrollHeight-scrollTop-clientHeight < 200;
      setAutoScroll(atBottom);
    };

    container?.addEventListener('scroll', handleScroll)
    return () => container?.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth'});
    }
  }, [messages, autoScroll]);

  useEffect(() => {
    if (!socket || !username || !code) return;
  
    socket.emit('rejoin-room', { username, code });
  }, [socket, username, code]);

  return (
    <div className="flex flex-col bg-white h-full">
      <p className='text-center text-xl bg-amber-500 border-b'>Code: {code}</p>
      <div ref={messagesContainerRef} className="flex-1 p-2 space-y-2 overflow-y-auto">
        {messages.map((msg, i) => (
          <div key={i} className="bg-gray-100 p-2 rounded shadow-sm">
            <span className="font-semibold">{msg.system ? "System" : msg.username}:</span> {msg.message}
            {msg.timestamp && (
              <div className="text-xs text-gray-500 mt-1">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef}></div>
      </div>

      <div className="flex border-t p-2">
        <input
          type="text"
          className="border rounded px-2 py-1 w-full"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
        />
        <button
          onClick={sendMessage}
          className="ml-2 px-4 py-1 bg-blue-500 text-white rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatDisplay;
