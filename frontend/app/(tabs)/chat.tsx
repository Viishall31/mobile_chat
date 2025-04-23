import React, { useState, useEffect, useCallback } from 'react';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import { View } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io, { Socket } from 'socket.io-client';

const API_URL = 'http://localhost:3000';

// Define the type for messages from the server
interface ServerMessage {
  id: string;
  text: string;
  timestamp: string | number;
  userId: string;
  username: string;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [userData, setUserData] = useState<{ userId: string; username: string } | null>(null);
  
  useEffect(() => {
    checkAuth();
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);
  
  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('userId');
      const username = await AsyncStorage.getItem('username');
      
      if (!token || !userId || !username) {
        router.replace('/(auth)' as any);
        return;
      }
      
      setUserData({ userId, username });
      initializeSocket(token);
    } catch (error) {
      router.replace('/(auth)' as any);
    }
  };
  
  const initializeSocket = (token: string) => {
    const newSocket = io(API_URL, {
      auth: { token }
    });
    
    newSocket.on('connect', () => {
      console.log('Connected to socket server');
    });
    
    newSocket.on('message', (message: ServerMessage) => {
      setMessages(previousMessages => 
        GiftedChat.append(previousMessages, [{
          _id: message.id,
          text: message.text,
          createdAt: new Date(message.timestamp),
          user: {
            _id: message.userId,
            name: message.username
          }
        }])
      );
    });
    
    newSocket.on('previousMessages', (previousMessages: ServerMessage[]) => {
      const formattedMessages = previousMessages.map(msg => ({
        _id: msg.id,
        text: msg.text,
        createdAt: new Date(msg.timestamp),
        user: {
          _id: msg.userId,
          name: msg.username
        }
      }));
      setMessages(formattedMessages);
    });
    
    newSocket.on('connect_error', (error) => {
      if (error.message === 'Authentication error') {
        router.replace('/(auth)' as any);
      }
    });
    
    setSocket(newSocket);
  };
  
  const onSend = useCallback((newMessages: IMessage[] = []) => {
    if (!socket || !userData) return;
    
    const [message] = newMessages;
    socket.emit('message', {
      text: message.text
    });
  }, [socket, userData]);
  
  if (!userData) {
    return null;
  }
  
  return (
    <View style={{ flex: 1 }}>
      <GiftedChat
        messages={messages}
        onSend={messages => onSend(messages)}
        user={{
          _id: userData.userId,
          name: userData.username
        }}
      />
    </View>
  );
}