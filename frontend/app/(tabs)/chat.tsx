import React, { useState, useEffect, useCallback } from 'react';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import io, { Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../providers/auth';

interface ChatMessage {
  id: string | number;
  userId: string;
  username: string;
  text: string;
  timestamp: string;
}

const API_URL = 'http://localhost:3000';

export default function ChatScreen() {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const { userData, isAuthenticated, signOut } = useAuth();

  useEffect(() => {
    if (!userData) return;

    const setupSocket = async () => {
      const token = await AsyncStorage.getItem('token');
      
      const newSocket = io(API_URL, {
        auth: isAuthenticated ? { token } : undefined,
        query: {
          userId: userData.userId,
          username: userData.username,
          isGuest: !isAuthenticated
        }
      });

      newSocket.on('connect', () => {
        console.log('Connected to socket server');
      });

      newSocket.on('message', (message: ChatMessage) => {
        const newMessage: IMessage = {
          _id: message.id.toString(),
          text: message.text,
          createdAt: new Date(message.timestamp),
          user: {
            _id: message.userId,
            name: message.username
          }
        };
        
        setMessages(previousMessages => GiftedChat.append(previousMessages, [newMessage]));
      });

      newSocket.on('previousMessages', (previousMessages: ChatMessage[]) => {
        const formattedMessages: IMessage[] = previousMessages.map(msg => ({
          _id: msg.id.toString(),
          text: msg.text,
          createdAt: new Date(msg.timestamp),
          user: {
            _id: msg.userId,
            name: msg.username
          }
        }));
        setMessages(formattedMessages.reverse());  // Reverse to show newest messages at bottom
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    };

    setupSocket();
  }, [userData, isAuthenticated]);

  const onSend = useCallback((newMessages: IMessage[] = []) => {
    if (!socket || !userData) return;

    const [message] = newMessages;
    socket.emit('message', {
      text: message.text,
      userId: userData.userId,
      username: userData.username
    });
  }, [socket, userData]);

  if (!userData) {
    return null;
  }

  return (
    <View style={styles.container}>
      {!isAuthenticated && (
        <View style={styles.guestBanner}>
          <Text style={styles.guestText}>You are chatting as a guest</Text>
          <TouchableOpacity onPress={signOut}>
            <Text style={styles.signInButton}>Sign In</Text>
          </TouchableOpacity>
        </View>
      )}
      <GiftedChat
        messages={messages}
        onSend={messages => onSend(messages)}
        user={{
          _id: userData.userId,
          name: userData.username
        }}
        renderAvatar={null}
        inverted={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  guestBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  guestText: {
    color: '#666',
  },
  signInButton: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
});