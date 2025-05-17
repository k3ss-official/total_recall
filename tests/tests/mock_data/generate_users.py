import json
import random
import uuid
import argparse
from faker import Faker

# Initialize Faker
fake = Faker()

def generate_user_id():
    """Generate a unique user ID"""
    return f"user_{uuid.uuid4().hex[:8]}"

def generate_user():
    """Generate a realistic user profile"""
    user_id = generate_user_id()
    first_name = fake.first_name()
    last_name = fake.last_name()
    email = f"{first_name.lower()}.{last_name.lower()}@{fake.domain_name()}"
    
    # Create a secure password with mixed case, numbers, and special characters
    password = f"{fake.word().capitalize()}{random.randint(100, 999)}!{fake.word()}"
    
    user = {
        "id": user_id,
        "first_name": first_name,
        "last_name": last_name,
        "email": email,
        "username": email,  # Using email as username
        "password": password,
        "created_at": fake.date_time_this_year().isoformat(),
        "last_login": fake.date_time_this_month().isoformat(),
        "settings": {
            "theme": random.choice(["light", "dark", "system"]),
            "notifications_enabled": random.choice([True, False]),
            "default_export_format": random.choice(["json", "markdown", "text"]),
            "auto_process": random.choice([True, False])
        }
    }
    
    return user

def generate_users(num_users=10, output_file=None):
    """Generate multiple user profiles and save to a file if specified"""
    users = []
    
    for _ in range(num_users):
        user = generate_user()
        users.append(user)
    
    if output_file:
        with open(output_file, 'w') as f:
            json.dump(users, f, indent=2)
        print(f"Generated {num_users} users and saved to {output_file}")
    
    return users

def generate_auth_tokens(users, output_file=None):
    """Generate authentication tokens for users"""
    tokens = []
    
    for user in users:
        token = {
            "user_id": user["id"],
            "token": f"tk_{uuid.uuid4().hex}",
            "issued_at": fake.date_time_this_month().isoformat(),
            "expires_at": fake.date_time_between(start_date="+1d", end_date="+30d").isoformat(),
            "is_valid": True
        }
        tokens.append(token)
    
    if output_file:
        with open(output_file, 'w') as f:
            json.dump(tokens, f, indent=2)
        print(f"Generated {len(tokens)} tokens and saved to {output_file}")
    
    return tokens

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Generate mock user data for testing')
    parser.add_argument('--num', type=int, default=10, help='Number of users to generate')
    parser.add_argument('--output', type=str, default='mock_users.json', help='Output file path for users')
    parser.add_argument('--tokens', type=str, default='mock_tokens.json', help='Output file path for tokens')
    
    args = parser.parse_args()
    
    users = generate_users(num_users=args.num, output_file=args.output)
    generate_auth_tokens(users, output_file=args.tokens)
