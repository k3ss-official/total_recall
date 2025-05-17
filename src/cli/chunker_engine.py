#!/usr/bin/env python3
"""
Chunker Engine - CLI tool for processing and chunking conversations

This module provides CLI commands for processing conversations into optimal chunks
for memory injection, with various chunking strategies and token counting.
"""

import os
import json
import argparse
import re
from pathlib import Path
from typing import Dict, Any, List, Optional
import numpy as np
from tqdm import tqdm

# Constants
DEFAULT_OUTPUT_DIR = os.path.expanduser("~/.total_recall/memory/processed")
CONFIG_DIR = os.path.dirname(DEFAULT_OUTPUT_DIR)
MAX_TOKENS_PER_CHUNK = 1500  # Default max tokens per chunk

class ChunkerEngine:
    """Processes conversations into optimal chunks for memory injection"""
    
    def __init__(self, output_dir: str = DEFAULT_OUTPUT_DIR):
        """Initialize the chunker engine"""
        self.output_dir = output_dir
        self._ensure_output_dir()
        
    def _ensure_output_dir(self):
        """Ensure the output directory exists"""
        os.makedirs(self.output_dir, exist_ok=True)
    
    def count_tokens(self, text: str) -> int:
        """
        Count the approximate number of tokens in a text
        
        This is a simple approximation. For production use,
        consider using tiktoken or a similar library.
        """
        # Simple approximation: 1 token ≈ 4 characters
        return len(text) // 4
    
    def chunk_by_size(self, conversations: List[Dict[str, Any]], 
                     max_tokens: int = MAX_TOKENS_PER_CHUNK) -> List[Dict[str, Any]]:
        """Chunk conversations based on token size"""
        chunks = []
        current_chunk = []
        current_tokens = 0
        
        for conv in conversations:
            # Estimate tokens in this conversation
            conv_text = json.dumps(conv)
            conv_tokens = self.count_tokens(conv_text)
            
            # If this conversation alone exceeds max tokens, it needs to be split
            if conv_tokens > max_tokens:
                # If we have content in the current chunk, finalize it
                if current_chunk:
                    chunks.append({
                        "conversations": current_chunk,
                        "token_count": current_tokens,
                        "chunk_strategy": "size"
                    })
                    current_chunk = []
                    current_tokens = 0
                
                # Split this large conversation (simplified approach)
                # In a real implementation, this would be more sophisticated
                # to ensure semantic coherence
                messages = conv.get("messages", [])
                temp_messages = []
                temp_tokens = 0
                
                for msg in messages:
                    msg_text = json.dumps(msg)
                    msg_tokens = self.count_tokens(msg_text)
                    
                    if temp_tokens + msg_tokens > max_tokens:
                        # This message would exceed the limit, finalize current temp chunk
                        if temp_messages:
                            new_conv = conv.copy()
                            new_conv["messages"] = temp_messages
                            new_conv["_chunked"] = True
                            chunks.append({
                                "conversations": [new_conv],
                                "token_count": temp_tokens,
                                "chunk_strategy": "size"
                            })
                            temp_messages = [msg]
                            temp_tokens = msg_tokens
                    else:
                        # Add this message to the temp chunk
                        temp_messages.append(msg)
                        temp_tokens += msg_tokens
                
                # Don't forget the last temp chunk
                if temp_messages:
                    new_conv = conv.copy()
                    new_conv["messages"] = temp_messages
                    new_conv["_chunked"] = True
                    chunks.append({
                        "conversations": [new_conv],
                        "token_count": temp_tokens,
                        "chunk_strategy": "size"
                    })
            
            # Normal case: conversation fits in a chunk
            elif current_tokens + conv_tokens <= max_tokens:
                current_chunk.append(conv)
                current_tokens += conv_tokens
            else:
                # Finalize current chunk and start a new one
                chunks.append({
                    "conversations": current_chunk,
                    "token_count": current_tokens,
                    "chunk_strategy": "size"
                })
                current_chunk = [conv]
                current_tokens = conv_tokens
        
        # Don't forget the last chunk
        if current_chunk:
            chunks.append({
                "conversations": current_chunk,
                "token_count": current_tokens,
                "chunk_strategy": "size"
            })
        
        return chunks
    
    def chunk_by_topic(self, conversations: List[Dict[str, Any]], 
                      max_tokens: int = MAX_TOKENS_PER_CHUNK) -> List[Dict[str, Any]]:
        """
        Chunk conversations based on topic similarity
        
        This is a simplified implementation. For production use,
        consider using embeddings or more sophisticated NLP.
        """
        # Extract titles or first messages as topic indicators
        topics = []
        for conv in conversations:
            title = conv.get("title", "")
            if title:
                topics.append(title)
            elif conv.get("messages") and len(conv["messages"]) > 0:
                # Use first message as fallback
                topics.append(conv["messages"][0].get("content", ""))
            else:
                topics.append("")
        
        # Simple topic clustering (in production, use embeddings or proper NLP)
        # This is just a placeholder implementation
        clusters = []
        assigned = [False] * len(conversations)
        
        for i in range(len(conversations)):
            if assigned[i]:
                continue
                
            cluster = [i]
            assigned[i] = True
            cluster_tokens = self.count_tokens(json.dumps(conversations[i]))
            
            # Find similar topics
            for j in range(i + 1, len(conversations)):
                if assigned[j]:
                    continue
                    
                # Simple similarity check (in production, use proper similarity metrics)
                # Just checking for common words as a placeholder
                common_words = set(re.findall(r'\w+', topics[i].lower())) & \
                              set(re.findall(r'\w+', topics[j].lower()))
                
                similarity = len(common_words) / max(1, len(set(re.findall(r'\w+', topics[i].lower()))))
                
                if similarity > 0.3:  # Arbitrary threshold
                    conv_tokens = self.count_tokens(json.dumps(conversations[j]))
                    if cluster_tokens + conv_tokens <= max_tokens:
                        cluster.append(j)
                        assigned[j] = True
                        cluster_tokens += conv_tokens
            
            clusters.append({
                "indices": cluster,
                "token_count": cluster_tokens
            })
        
        # Convert clusters to chunks
        chunks = []
        for cluster in clusters:
            chunk_convs = [conversations[i] for i in cluster["indices"]]
            chunks.append({
                "conversations": chunk_convs,
                "token_count": cluster["token_count"],
                "chunk_strategy": "topic"
            })
        
        return chunks
    
    def chunk_by_role(self, conversations: List[Dict[str, Any]], 
                     max_tokens: int = MAX_TOKENS_PER_CHUNK) -> List[Dict[str, Any]]:
        """Chunk conversations based on user/assistant role patterns"""
        chunks = []
        current_chunk = []
        current_tokens = 0
        
        for conv in conversations:
            messages = conv.get("messages", [])
            
            # Group by consecutive same-role messages
            role_groups = []
            current_role = None
            current_group = []
            
            for msg in messages:
                role = msg.get("role")
                if role != current_role and current_group:
                    role_groups.append(current_group)
                    current_group = [msg]
                    current_role = role
                else:
                    current_group.append(msg)
                    current_role = role
            
            # Don't forget the last group
            if current_group:
                role_groups.append(current_group)
            
            # Process each role group
            for group in role_groups:
                group_conv = conv.copy()
                group_conv["messages"] = group
                group_conv["_chunked_by_role"] = True
                
                group_text = json.dumps(group_conv)
                group_tokens = self.count_tokens(group_text)
                
                # If this group alone exceeds max tokens, it needs further splitting
                if group_tokens > max_tokens:
                    # Simplified approach: just split into smaller pieces
                    # In production, this would be more sophisticated
                    temp_messages = []
                    temp_tokens = 0
                    
                    for msg in group:
                        msg_text = json.dumps(msg)
                        msg_tokens = self.count_tokens(msg_text)
                        
                        if temp_tokens + msg_tokens > max_tokens:
                            # Finalize current temp chunk
                            if temp_messages:
                                temp_conv = conv.copy()
                                temp_conv["messages"] = temp_messages
                                temp_conv["_chunked_by_role"] = True
                                chunks.append({
                                    "conversations": [temp_conv],
                                    "token_count": temp_tokens,
                                    "chunk_strategy": "role"
                                })
                                temp_messages = [msg]
                                temp_tokens = msg_tokens
                        else:
                            # Add this message to the temp chunk
                            temp_messages.append(msg)
                            temp_tokens += msg_tokens
                    
                    # Don't forget the last temp chunk
                    if temp_messages:
                        temp_conv = conv.copy()
                        temp_conv["messages"] = temp_messages
                        temp_conv["_chunked_by_role"] = True
                        chunks.append({
                            "conversations": [temp_conv],
                            "token_count": temp_tokens,
                            "chunk_strategy": "role"
                        })
                
                # Normal case: group fits in a chunk
                elif current_tokens + group_tokens <= max_tokens:
                    current_chunk.append(group_conv)
                    current_tokens += group_tokens
                else:
                    # Finalize current chunk and start a new one
                    if current_chunk:
                        chunks.append({
                            "conversations": current_chunk,
                            "token_count": current_tokens,
                            "chunk_strategy": "role"
                        })
                    current_chunk = [group_conv]
                    current_tokens = group_tokens
        
        # Don't forget the last chunk
        if current_chunk:
            chunks.append({
                "conversations": current_chunk,
                "token_count": current_tokens,
                "chunk_strategy": "role"
            })
        
        return chunks
    
    def process_file(self, file_path: str, strategy: str = "size", 
                    max_tokens: int = MAX_TOKENS_PER_CHUNK) -> str:
        """Process a conversation file using the specified chunking strategy"""
        # Load conversations
        try:
            with open(file_path, 'r') as f:
                data = json.load(f)
                
            if isinstance(data, dict) and "conversations" in data:
                conversations = data["conversations"]
            elif isinstance(data, list):
                conversations = data
            else:
                raise ValueError("Invalid conversation format")
        except Exception as e:
            print(f"Error loading conversations: {e}")
            return None
        
        # Apply chunking strategy
        if strategy == "size":
            chunks = self.chunk_by_size(conversations, max_tokens)
        elif strategy == "topic":
            chunks = self.chunk_by_topic(conversations, max_tokens)
        elif strategy == "role":
            chunks = self.chunk_by_role(conversations, max_tokens)
        else:
            print(f"Unknown chunking strategy: {strategy}")
            return None
        
        # Generate output filename
        base_name = os.path.basename(file_path)
        name_parts = os.path.splitext(base_name)
        output_file = os.path.join(self.output_dir, 
                                  f"{name_parts[0]}_chunked_{strategy}{name_parts[1]}")
        
        # Save chunked conversations
        with open(output_file, 'w') as f:
            json.dump({
                "chunks": chunks,
                "original_file": file_path,
                "chunking_strategy": strategy,
                "max_tokens_per_chunk": max_tokens,
                "total_chunks": len(chunks),
                "total_conversations": sum(len(chunk["conversations"]) for chunk in chunks)
            }, f, indent=2)
            
        return output_file


def process_command(args):
    """Process a conversation file"""
    chunker = ChunkerEngine(args.output_dir)
    output_file = chunker.process_file(args.file, args.strategy, args.max_tokens)
    
    if output_file:
        print(f"Processed file saved to: {output_file}")
        
        # Display summary
        with open(output_file, 'r') as f:
            result = json.load(f)
            
        print("\n=== Processing Summary ===")
        print(f"Chunking Strategy: {result['chunking_strategy']}")
        print(f"Max Tokens Per Chunk: {result['max_tokens_per_chunk']}")
        print(f"Total Chunks: {result['total_chunks']}")
        print(f"Total Conversations: {result['total_conversations']}")
        
        # Display chunk details
        print("\n=== Chunk Details ===")
        for i, chunk in enumerate(result['chunks']):
            print(f"Chunk {i+1}: {len(chunk['conversations'])} conversations, "
                 f"{chunk['token_count']} tokens")


def main():
    """Main entry point for the chunker engine CLI"""
    parser = argparse.ArgumentParser(description="Conversation Chunker Engine")
    parser.add_argument('--output-dir', default=DEFAULT_OUTPUT_DIR, 
                        help=f"Output directory (default: {DEFAULT_OUTPUT_DIR})")
    
    subparsers = parser.add_subparsers(dest='command', help='Command to execute')
    
    # process command
    process_parser = subparsers.add_parser('process', help='Process a conversation file')
    process_parser.add_argument('--file', required=True, 
                              help='Path to conversation file (JSON)')
    process_parser.add_argument('--strategy', default='size', 
                              choices=['size', 'topic', 'role'],
                              help='Chunking strategy (default: size)')
    process_parser.add_argument('--max-tokens', type=int, default=MAX_TOKENS_PER_CHUNK,
                              help=f'Maximum tokens per chunk (default: {MAX_TOKENS_PER_CHUNK})')
    process_parser.set_defaults(func=process_command)
    
    args = parser.parse_args()
    
    if args.command is None:
        parser.print_help()
        return
    
    args.func(args)


if __name__ == "__main__":
    main()
