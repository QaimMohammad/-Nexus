import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Phone, Video, Info, Smile } from 'lucide-react';
import toast from 'react-hot-toast';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ChatMessage } from '../../components/chat/ChatMessage';
import { ChatUserList } from '../../components/chat/ChatUserList';
import { useAuth } from '../../context/AuthContext';
import { Message, User } from '../../types';
import { userService } from '../../services/userService';
import { messageService, ApiConversation } from '../../services/messageService';
import { getSocket } from '../../services/socket';
import { MessageCircle } from 'lucide-react';

export const ChatPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversations, setConversations] = useState<ApiConversation[]>([]);
  const [chatPartner, setChatPartner] = useState<User | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const refreshConversations = () => {
    messageService.listConversations().then(setConversations).catch(() => setConversations([]));
  };

  useEffect(() => {
    if (currentUser) {
      refreshConversations();
    }
  }, [currentUser]);

  // Load the chat partner profile and message history
  useEffect(() => {
    if (!userId) {
      setChatPartner(null);
      setMessages([]);
      return;
    }
    userService.getUser(userId).then(setChatPartner).catch(() => setChatPartner(null));
    messageService.getMessagesWith(userId).then(setMessages).catch(() => setMessages([]));
  }, [userId]);

  // Real-time: append messages pushed by the server over Socket.IO
  useEffect(() => {
    if (!currentUser) return;
    const socket = getSocket();
    const onMessage = (message: Message) => {
      if (userId && message.senderId === userId) {
        setMessages((prev) => [...prev, message]);
      }
      refreshConversations();
    };
    socket.on('chat:message', onMessage);
    return () => {
      socket.off('chat:message', onMessage);
    };
  }, [currentUser, userId]);

  useEffect(() => {
    // Scroll to bottom of messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !currentUser || !userId) return;

    const content = newMessage;
    setNewMessage('');
    try {
      const message = await messageService.sendMessage(userId, content);
      setMessages((prev) => [...prev, message]);
      refreshConversations();
    } catch (err) {
      toast.error((err as Error).message);
      setNewMessage(content);
    }
  };

  if (!currentUser) return null;
  
  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white border border-gray-200 rounded-lg overflow-hidden animate-fade-in">
      {/* Conversations sidebar */}
      <div className="hidden md:block w-1/3 lg:w-1/4 border-r border-gray-200">
        <ChatUserList conversations={conversations} />
      </div>
      
      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        {chatPartner ? (
          <>
            <div className="border-b border-gray-200 p-4 flex justify-between items-center">
              <div className="flex items-center">
                <Avatar
                  src={chatPartner.avatarUrl}
                  alt={chatPartner.name}
                  size="md"
                  status={chatPartner.isOnline ? 'online' : 'offline'}
                  className="mr-3"
                />
                
                <div>
                  <h2 className="text-lg font-medium text-gray-900">{chatPartner.name}</h2>
                  <p className="text-sm text-gray-500">
                    {chatPartner.isOnline ? 'Online' : 'Last seen recently'}
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full p-2"
                  aria-label="Voice call"
                  onClick={async () => {
                    if (!userId) return;
                    const roomId = `chat-${[currentUser.id, userId].sort().join('-')}`;
                    try {
                      const msg = await messageService.sendMessage(
                        userId,
                        'Started a voice call - open our chat and click the phone icon to join.'
                      );
                      setMessages((prev) => [...prev, msg]);
                    } catch {
                      /* the call still works without the notification message */
                    }
                    navigate(`/call/${roomId}?mode=audio`);
                  }}
                >
                  <Phone size={18} />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full p-2"
                  aria-label="Video call"
                  onClick={async () => {
                    if (!userId) return;
                    // Deterministic room: both participants land in the same call
                    const roomId = `chat-${[currentUser.id, userId].sort().join('-')}`;
                    try {
                      const msg = await messageService.sendMessage(
                        userId,
                        'Started a video call - open our chat and click the camera icon to join.'
                      );
                      setMessages((prev) => [...prev, msg]);
                    } catch {
                      /* the call still works without the notification message */
                    }
                    navigate(`/call/${roomId}`);
                  }}
                >
                  <Video size={18} />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full p-2"
                  aria-label="Info"
                >
                  <Info size={18} />
                </Button>
              </div>
            </div>
            
            {/* Messages container */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              {messages.length > 0 ? (
                <div className="space-y-4">
                  {messages.map(message => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      isCurrentUser={message.senderId === currentUser.id}
                      sender={message.senderId === currentUser.id ? currentUser : chatPartner}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center">
                  <div className="bg-gray-100 p-4 rounded-full mb-4">
                    <MessageCircle size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-700">No messages yet</h3>
                  <p className="text-gray-500 mt-1">Send a message to start the conversation</p>
                </div>
              )}
            </div>
            
            {/* Message input */}
            <div className="border-t border-gray-200 p-4">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-full p-2"
                  aria-label="Add emoji"
                >
                  <Smile size={20} />
                </Button>
                
                <Input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  fullWidth
                  className="flex-1"
                />
                
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newMessage.trim()}
                  className="rounded-full p-2 w-10 h-10 flex items-center justify-center"
                  aria-label="Send message"
                >
                  <Send size={18} />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-4">
            <div className="bg-gray-100 p-6 rounded-full mb-4">
              <MessageCircle size={48} className="text-gray-400" />
            </div>
            <h2 className="text-xl font-medium text-gray-700">Select a conversation</h2>
            <p className="text-gray-500 mt-2 text-center">
              Choose a contact from the list to start chatting
            </p>
          </div>
        )}
      </div>
    </div>
  );
};