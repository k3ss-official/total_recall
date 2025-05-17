import json
import random
import argparse
import os
import sys
from faker import Faker

# Add parent directory to path to import the conversation generator
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from mock_data.generate_conversations import generate_conversation, generate_conversations

# Initialize Faker
fake = Faker()

def chunk_conversation(conversation, chunk_size=2):
    """Split a conversation into memory chunks"""
    messages = conversation["messages"]
    chunks = []
    
    # Process messages in pairs (or specified chunk size)
    for i in range(0, len(messages), chunk_size):
        chunk_messages = messages[i:i+chunk_size]
        
        # Format the chunk as a string
        chunk_text = ""
        for msg in chunk_messages:
            chunk_text += f"{msg['role'].capitalize()}: {msg['content']}\n"
        
        chunks.append(chunk_text.strip())
    
    return chunks

def generate_memory_chunks(conversation):
    """Generate memory chunks from a conversation"""
    # Extract basic conversation metadata
    conversation_id = conversation["id"]
    title = conversation["title"]
    
    # Generate chunks from the conversation
    chunks = chunk_conversation(conversation)
    
    # Add metadata to each chunk
    memory_chunks = []
    for i, chunk in enumerate(chunks):
        memory_chunk = {
            "id": f"chunk_{conversation_id}_{i}",
            "conversation_id": conversation_id,
            "conversation_title": title,
            "content": chunk,
            "index": i,
            "embedding": [random.random() for _ in range(10)],  # Mock embedding vector
            "created_at": conversation["create_time"] + i * 60  # Add 1 minute per chunk
        }
        memory_chunks.append(memory_chunk)
    
    return memory_chunks

def generate_processed_conversation(conversation):
    """Generate a processed version of a conversation with memory chunks"""
    # Create a copy of the conversation to avoid modifying the original
    processed = conversation.copy()
    
    # Generate memory chunks
    memory_chunks = generate_memory_chunks(conversation)
    
    # Add processing metadata
    processed["processed"] = True
    processed["processed_at"] = conversation["update_time"] + 60  # 1 minute after last update
    processed["memory_chunks"] = memory_chunks
    processed["processing_stats"] = {
        "num_messages": len(conversation["messages"]),
        "num_chunks": len(memory_chunks),
        "processing_time_ms": random.randint(100, 2000),
        "embedding_model": "mock-embedding-model-001",
        "chunk_strategy": "pair_messages"
    }
    
    # Add summary and keywords
    processed["summary"] = fake.paragraph(nb_sentences=2)
    processed["keywords"] = [fake.word() for _ in range(random.randint(3, 8))]
    
    return processed

def generate_processed_conversations(conversations=None, num_conversations=5, output_file=None):
    """Generate processed conversations with memory chunks"""
    processed_conversations = []
    
    # If no conversations provided, generate new ones
    if conversations is None:
        conversations = generate_conversations(num_conversations=num_conversations)
    
    # Process each conversation
    for conversation in conversations:
        processed = generate_processed_conversation(conversation)
        processed_conversations.append(processed)
    
    if output_file:
        with open(output_file, 'w') as f:
            json.dump(processed_conversations, f, indent=2)
        print(f"Generated {len(processed_conversations)} processed conversations and saved to {output_file}")
    
    return processed_conversations

def extract_all_memory_chunks(processed_conversations, output_file=None):
    """Extract all memory chunks from processed conversations into a separate file"""
    all_chunks = []
    
    for conversation in processed_conversations:
        if "memory_chunks" in conversation:
            all_chunks.extend(conversation["memory_chunks"])
    
    if output_file:
        with open(output_file, 'w') as f:
            json.dump(all_chunks, f, indent=2)
        print(f"Extracted {len(all_chunks)} memory chunks and saved to {output_file}")
    
    return all_chunks

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Generate mock processed conversations and memory chunks for testing')
    parser.add_argument('--input', type=str, help='Input file with raw conversations (optional)')
    parser.add_argument('--num', type=int, default=5, help='Number of conversations to generate if no input file')
    parser.add_argument('--output', type=str, default='mock_processed_conversations.json', help='Output file for processed conversations')
    parser.add_argument('--chunks', type=str, default='mock_memory_chunks.json', help='Output file for memory chunks')
    
    args = parser.parse_args()
    
    # Load conversations from file if provided
    input_conversations = None
    if args.input:
        with open(args.input, 'r') as f:
            input_conversations = json.load(f)
    
    # Generate processed conversations
    processed = generate_processed_conversations(
        conversations=input_conversations,
        num_conversations=args.num,
        output_file=args.output
    )
    
    # Extract memory chunks
    extract_all_memory_chunks(processed, output_file=args.chunks)
