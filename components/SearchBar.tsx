import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface SearchBarProps {
  darkMode: boolean;
  onSearch: (text: string) => void;
  searchText: string;
}

const SearchBar = ({ darkMode, onSearch, searchText }: SearchBarProps) => {
  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <Feather name="search" size={20} color={darkMode ? '#aaa' : '#666'} />
      <TextInput
        style={[styles.input, darkMode && styles.darkInput]}
        placeholder="Search chats..."
        placeholderTextColor={darkMode ? '#aaa' : '#999'}
        value={searchText}
        onChangeText={onSearch}
      />
      {searchText.length > 0 && (
        <TouchableOpacity onPress={() => onSearch('')}>
          <Feather name="x" size={20} color={darkMode ? '#aaa' : '#666'} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  darkContainer: {
    backgroundColor: '#333',
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#000',
  },
  darkInput: {
    color: '#fff',
  },
});

export default SearchBar;