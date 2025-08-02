import { View, Text, StyleSheet } from 'react-native';
import React from 'react';
import { COLORS } from '../colors';

const ApiKeyPage = () => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>No API Key Required! 🎉</Text>
        
        <View style={styles.infoCard}>
          <Text style={styles.emoji}>🤖</Text>
          <Text style={styles.infoTitle}>100% Offline AI</Text>
          <Text style={styles.infoText}>
            Mazu uses Google's Gemma 3n model running entirely on your device. 
            No internet connection, no API keys, no subscriptions needed.
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.emoji}>🔒</Text>
          <Text style={styles.infoTitle}>Your Privacy Protected</Text>
          <Text style={styles.infoText}>
            All conversations stay on your device. Your emergency data is never 
            sent to any server or cloud service.
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.emoji}>⚡</Text>
          <Text style={styles.infoTitle}>Always Ready</Text>
          <Text style={styles.infoText}>
            Works in airplane mode, underground, or anywhere without signal. 
            The 2.3GB AI model is stored directly on your phone.
          </Text>
        </View>

        <Text style={styles.footer}>
          Powered by Gemma 3n • Built for Google Gemma Developer Contest
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background || '#0D0D0D',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#B0B0B0',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 30,
  },
});

export default ApiKeyPage;