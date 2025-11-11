import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const ChatBox = ({ gameId, username, socket }) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('newMessage', (messageData) => {
      setMessages((prev) => [...prev, messageData]);
    });

    return () => {
      socket.off('newMessage');
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !socket) return;

    socket.emit('sendMessage', {
      gameId,
      message: inputMessage,
      username,
    });

    setInputMessage('');
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-2xl p-6" data-testid="chat-box">
      <h3 className="text-xl font-bold text-white mb-4">{t('chat')}</h3>
      
      {/* Messages */}
      <div className="bg-gray-900 rounded p-4 h-64 overflow-y-auto mb-4" data-testid="chat-messages">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center">{t('noMessages')}</p>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className="mb-2" data-testid={`chat-message-${index}`}>
              <span className="text-blue-400 font-semibold">{msg.username}: </span>
              <span className="text-gray-300">{msg.message}</span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} data-testid="chat-form">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={t('typeMessage')}
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-red-500 focus:outline-none"
            data-testid="chat-input"
          />
          <button
            type="submit"
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-semibold transition"
            data-testid="chat-send-button"
          >
            {t('sendMessage')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatBox;
