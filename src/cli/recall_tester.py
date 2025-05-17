#!/usr/bin/env python3
"""
Recall Tester - CLI tool for testing memory recall functionality

This module provides CLI commands for testing memory recall by asking questions
against processed memory chunks to verify retrieval accuracy.
"""

import os
import json
import argparse
import re
from pathlib import Path
from typing import Dict, Any, List, Optional
import numpy as np

# Constants
DEFAULT_MEMORY_DIR = os.path.expanduser("~/.total_recall/memory/processed")
CONFIG_DIR = os.path.dirname(DEFAULT_MEMORY_DIR)

class RecallTester:
    """Tests memory recall functionality against processed chunks"""
    
    def __init__(self, memory_dir: str = DEFAULT_MEMORY_DIR):
        """Initialize the recall tester"""
        self.memory_dir = memory_dir
        self._ensure_memory_dir()
        
    def _ensure_memory_dir(self):
        """Ensure the memory directory exists"""
        os.makedirs(self.memory_dir, exist_ok=True)
    
    def list_memory_files(self) -> List[str]:
        """List all available memory files"""
        if not os.path.exists(self.memory_dir):
            return []
            
        return [f for f in os.listdir(self.memory_dir) 
                if f.endswith('.json') and os.path.isfile(os.path.join(self.memory_dir, f))]
    
    def load_memory_file(self, file_name: str) -> Dict[str, Any]:
        """Load a memory file"""
        file_path = os.path.join(self.memory_dir, file_name)
        if not os.path.exists(file_path):
            print(f"Memory file not found: {file_path}")
            return None
            
        try:
            with open(file_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading memory file: {e}")
            return None
    
    def simple_similarity(self, text1: str, text2: str) -> float:
        """
        Calculate a simple similarity score between two texts
        
        This is a simplified implementation. For production use,
        consider using embeddings or more sophisticated NLP.
        """
        # Convert to lowercase and tokenize
        tokens1 = set(re.findall(r'\w+', text1.lower()))
        tokens2 = set(re.findall(r'\w+', text2.lower()))
        
        # Calculate Jaccard similarity
        intersection = len(tokens1.intersection(tokens2))
        union = len(tokens1.union(tokens2))
        
        return intersection / max(1, union)
    
    def find_relevant_chunks(self, query: str, memory_data: Dict[str, Any], 
                           top_k: int = 3) -> List[Dict[str, Any]]:
        """Find chunks relevant to the query"""
        chunks = memory_data.get("chunks", [])
        if not chunks:
            return []
            
        # Calculate similarity scores
        scores = []
        for i, chunk in enumerate(chunks):
            # Concatenate all text in the chunk for comparison
            chunk_text = ""
            for conv in chunk.get("conversations", []):
                for msg in conv.get("messages", []):
                    chunk_text += msg.get("content", "") + " "
            
            score = self.simple_similarity(query, chunk_text)
            scores.append((i, score))
        
        # Sort by score and get top_k
        scores.sort(key=lambda x: x[1], reverse=True)
        top_indices = [idx for idx, _ in scores[:top_k]]
        
        return [chunks[idx] for idx in top_indices]
    
    def ask_question(self, query: str, memory_file: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """Ask a question against a memory file"""
        memory_data = self.load_memory_file(memory_file)
        if not memory_data:
            return []
            
        return self.find_relevant_chunks(query, memory_data, top_k)


def list_memories_command(args):
    """List all available memory files"""
    tester = RecallTester(args.memory_dir)
    memory_files = tester.list_memory_files()
    
    if not memory_files:
        print("No memory files found.")
        return
    
    print("\n=== Available Memory Files ===")
    for i, file_name in enumerate(memory_files, 1):
        print(f"{i}. {file_name}")


def ask_question_command(args):
    """Ask a question against a memory file"""
    tester = RecallTester(args.memory_dir)
    relevant_chunks = tester.ask_question(args.query, args.file, args.top_k)
    
    if not relevant_chunks:
        print("No relevant chunks found.")
        return
    
    print("\n=== Relevant Memory Chunks ===")
    for i, chunk in enumerate(relevant_chunks, 1):
        print(f"\n--- Chunk {i} (Score: {chunk.get('similarity_score', 'N/A')}) ---")
        print(f"Strategy: {chunk.get('chunk_strategy', 'unknown')}")
        print(f"Token Count: {chunk.get('token_count', 'unknown')}")
        print(f"Conversations: {len(chunk.get('conversations', []))}")
        
        if args.verbose:
            print("\nContent Preview:")
            for j, conv in enumerate(chunk.get("conversations", [])[:2], 1):  # Show at most 2 conversations
                print(f"\nConversation {j}:")
                for msg in conv.get("messages", [])[:3]:  # Show at most 3 messages
                    role = msg.get("role", "unknown")
                    content = msg.get("content", "")
                    # Truncate content if too long
                    if len(content) > 100:
                        content = content[:100] + "..."
                    print(f"  {role}: {content}")
                
                if len(conv.get("messages", [])) > 3:
                    print("  ... (more messages)")
            
            if len(chunk.get("conversations", [])) > 2:
                print("\n... (more conversations)")


def main():
    """Main entry point for the recall tester CLI"""
    parser = argparse.ArgumentParser(description="Memory Recall Tester")
    parser.add_argument('--memory-dir', default=DEFAULT_MEMORY_DIR, 
                        help=f"Memory directory (default: {DEFAULT_MEMORY_DIR})")
    
    subparsers = parser.add_subparsers(dest='command', help='Command to execute')
    
    # list-memories command
    list_parser = subparsers.add_parser('list-memories', 
                                      help='List all available memory files')
    list_parser.set_defaults(func=list_memories_command)
    
    # ask-question command
    ask_parser = subparsers.add_parser('ask-question', 
                                     help='Ask a question against a memory file')
    ask_parser.add_argument('--query', required=True, 
                          help='Question to ask')
    ask_parser.add_argument('--file', required=True, 
                          help='Memory file to query')
    ask_parser.add_argument('--top-k', type=int, default=3,
                          help='Number of top chunks to return (default: 3)')
    ask_parser.add_argument('--verbose', action='store_true',
                          help='Show detailed chunk content')
    ask_parser.set_defaults(func=ask_question_command)
    
    args = parser.parse_args()
    
    if args.command is None:
        parser.print_help()
        return
    
    args.func(args)


if __name__ == "__main__":
    main()
