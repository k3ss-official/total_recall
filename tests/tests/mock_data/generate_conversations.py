import json
import random
import datetime
import uuid
import argparse
from faker import Faker

# Initialize Faker
fake = Faker()

def generate_timestamp(start_date=None, end_date=None):
    """Generate a random timestamp between start_date and end_date"""
    if start_date is None:
        start_date = datetime.datetime.now() - datetime.timedelta(days=30)
    if end_date is None:
        end_date = datetime.datetime.now()
    
    time_between_dates = end_date - start_date
    days_between_dates = time_between_dates.days
    random_days = random.randrange(days_between_dates)
    random_seconds = random.randrange(86400)  # Seconds in a day
    
    random_date = start_date + datetime.timedelta(days=random_days, seconds=random_seconds)
    return int(random_date.timestamp())

def generate_conversation_id():
    """Generate a unique conversation ID"""
    return f"conv_{uuid.uuid4().hex[:12]}"

def generate_user_message(topics=None):
    """Generate a realistic user message"""
    if topics and random.random() < 0.7:  # 70% chance to use a topic-specific message
        topic = random.choice(topics)
        templates = [
            f"Tell me about {topic}.",
            f"What can you tell me about {topic}?",
            f"I'm interested in learning more about {topic}.",
            f"How does {topic} work?",
            f"Can you explain {topic} to me?",
            f"What are the key aspects of {topic}?",
            f"I need information about {topic}.",
            f"What's the latest on {topic}?",
            f"Give me a summary of {topic}.",
            f"What should I know about {topic}?"
        ]
        return random.choice(templates)
    else:
        # General questions or statements
        templates = [
            "Hello, how are you today?",
            "Can you help me with something?",
            "I have a question for you.",
            "What's the weather like today?",
            "Tell me a joke.",
            "What's your favorite book?",
            "How do you handle this kind of situation?",
            "I'm trying to understand this concept.",
            "Can you recommend some resources?",
            "What do you think about this idea?",
            "I'm working on a project and need advice.",
            "What's the best approach for this problem?",
            "I'm curious about your opinion on this.",
            "How would you solve this issue?",
            "Can you explain this in simpler terms?"
        ]
        return random.choice(templates)

def generate_assistant_message(user_message):
    """Generate a realistic assistant response based on the user message"""
    # Check for specific question types and respond accordingly
    if "weather" in user_message.lower():
        weathers = ["sunny", "cloudy", "rainy", "snowy", "windy", "clear", "partly cloudy", "stormy"]
        temps = [f"{random.randint(60, 95)}°F" if random.random() > 0.5 else f"{random.randint(15, 35)}°C"]
        return f"It's currently {random.choice(weathers)} with a temperature of {random.choice(temps)}. The forecast for today shows {random.choice(weathers)} conditions later."
    
    elif "joke" in user_message.lower():
        jokes = [
            "Why don't scientists trust atoms? Because they make up everything!",
            "Why did the scarecrow win an award? Because he was outstanding in his field!",
            "What do you call a fake noodle? An impasta!",
            "How does a penguin build its house? Igloos it together!",
            "Why don't eggs tell jokes? They'd crack each other up!",
            "What do you call a bear with no teeth? A gummy bear!"
        ]
        return random.choice(jokes)
    
    elif "hello" in user_message.lower() or "how are you" in user_message.lower():
        greetings = [
            "Hello! I'm doing well, thank you for asking. How can I assist you today?",
            "Hi there! I'm functioning perfectly. What can I help you with?",
            "Greetings! I'm ready to assist you with any questions or tasks you have.",
            "Hello! I'm here and ready to help. What's on your mind today?"
        ]
        return random.choice(greetings)
    
    elif "help" in user_message.lower() or "can you" in user_message.lower():
        responses = [
            "I'd be happy to help you with that. Could you provide more details about what you need?",
            "Of course I can assist with that. What specific information are you looking for?",
            "I'm here to help! Please let me know more about what you're trying to accomplish.",
            "I'd be glad to help. Can you elaborate on your question so I can provide the most relevant information?"
        ]
        return random.choice(responses)
    
    else:
        # Generic informative responses
        templates = [
            f"That's an interesting question. {fake.paragraph(nb_sentences=3)}",
            f"I'd be happy to discuss that. {fake.paragraph(nb_sentences=2)}",
            f"Great question! {fake.paragraph(nb_sentences=3)}",
            f"Let me explain. {fake.paragraph(nb_sentences=4)}",
            f"Here's what I know about that: {fake.paragraph(nb_sentences=3)}",
            f"That's a fascinating topic. {fake.paragraph(nb_sentences=3)}",
            f"I can help with that. {fake.paragraph(nb_sentences=2)}",
            f"Let me share some information on this. {fake.paragraph(nb_sentences=3)}"
        ]
        return random.choice(templates)

def generate_conversation(num_messages=None, topics=None, start_date=None, end_date=None):
    """Generate a complete conversation with user and assistant messages"""
    if num_messages is None:
        num_messages = random.randint(4, 15)  # Random number of messages between 4 and 15
    
    if start_date is None:
        start_date = datetime.datetime.now() - datetime.timedelta(days=30)
    
    if end_date is None:
        end_date = datetime.datetime.now()
    
    # Generate conversation metadata
    conversation_id = generate_conversation_id()
    create_time = generate_timestamp(start_date, end_date)
    
    # Generate a title based on the first user message or a random topic
    if topics:
        title_topic = random.choice(topics)
        title = f"Conversation about {title_topic}"
    else:
        title = f"Conversation on {fake.date()}"
    
    # Generate messages
    messages = []
    current_time = create_time
    
    for i in range(num_messages):
        # Alternate between user and assistant messages
        if i % 2 == 0:  # User message
            content = generate_user_message(topics)
            role = "user"
        else:  # Assistant message
            # Get the previous user message to generate a relevant response
            prev_message = messages[-1]["content"] if messages else "Hello"
            content = generate_assistant_message(prev_message)
            role = "assistant"
        
        # Add some time between messages (30 seconds to 5 minutes)
        current_time += random.randint(30, 300)
        
        message = {
            "role": role,
            "content": content,
            "timestamp": current_time
        }
        messages.append(message)
    
    # Create the conversation object
    conversation = {
        "id": conversation_id,
        "title": title,
        "create_time": create_time,
        "update_time": current_time,
        "messages": messages
    }
    
    return conversation

def generate_conversations(num_conversations=10, min_messages=4, max_messages=15, topics=None, output_file=None):
    """Generate multiple conversations and save to a file if specified"""
    conversations = []
    
    for _ in range(num_conversations):
        num_messages = random.randint(min_messages, max_messages)
        conversation = generate_conversation(num_messages, topics)
        conversations.append(conversation)
    
    # Sort conversations by create_time (newest first)
    conversations.sort(key=lambda x: x["create_time"], reverse=True)
    
    if output_file:
        with open(output_file, 'w') as f:
            json.dump(conversations, f, indent=2)
        print(f"Generated {num_conversations} conversations and saved to {output_file}")
    
    return conversations

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Generate mock conversation data for testing')
    parser.add_argument('--num', type=int, default=10, help='Number of conversations to generate')
    parser.add_argument('--min-messages', type=int, default=4, help='Minimum number of messages per conversation')
    parser.add_argument('--max-messages', type=int, default=15, help='Maximum number of messages per conversation')
    parser.add_argument('--output', type=str, default='mock_conversations.json', help='Output file path')
    parser.add_argument('--topics', type=str, help='Comma-separated list of topics to include in conversations')
    
    args = parser.parse_args()
    
    topics_list = None
    if args.topics:
        topics_list = [topic.strip() for topic in args.topics.split(',')]
    
    generate_conversations(
        num_conversations=args.num,
        min_messages=args.min_messages,
        max_messages=args.max_messages,
        topics=topics_list,
        output_file=args.output
    )
