#!/usr/bin/env python3
"""
Token Debugger - CLI tool for OAuth token management and debugging

This module provides CLI commands for viewing, decoding, and validating OAuth tokens
used for authentication with OpenAI services.
"""

import os
import json
import time
import base64
import argparse
import datetime
from pathlib import Path
from typing import Dict, Any, Optional
import jwt  # For JWT token decoding
import requests
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

# Constants
TOKEN_FILE = os.path.expanduser("~/.total_recall/auth/token.json")
CONFIG_DIR = os.path.dirname(TOKEN_FILE)
SALT_FILE = os.path.join(CONFIG_DIR, ".salt")
DEFAULT_EXPIRY_WARNING = 300  # 5 minutes


class TokenManager:
    """Manages OAuth tokens for OpenAI authentication"""
    
    def __init__(self, token_file: str = TOKEN_FILE):
        """Initialize the token manager"""
        self.token_file = token_file
        self._ensure_config_dir()
        self.encryption_key = self._get_encryption_key()
        
    def _ensure_config_dir(self):
        """Ensure the configuration directory exists"""
        os.makedirs(os.path.dirname(self.token_file), exist_ok=True)
        
    def _get_encryption_key(self) -> bytes:
        """Get or create the encryption key"""
        if not os.path.exists(SALT_FILE):
            salt = os.urandom(16)
            with open(SALT_FILE, 'wb') as f:
                f.write(salt)
        else:
            with open(SALT_FILE, 'rb') as f:
                salt = f.read()
                
        # Use machine-specific info as password
        machine_id = self._get_machine_id()
        password = machine_id.encode()
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password))
        return key
    
    def _get_machine_id(self) -> str:
        """Get a unique machine identifier"""
        try:
            with open('/etc/machine-id', 'r') as f:
                return f.read().strip()
        except FileNotFoundError:
            try:
                with open('/var/lib/dbus/machine-id', 'r') as f:
                    return f.read().strip()
            except FileNotFoundError:
                # Fallback for macOS and other systems
                import uuid
                return str(uuid.getnode())
    
    def save_token(self, token_data: Dict[str, Any]) -> None:
        """Save token data to the token file"""
        # Add timestamp for tracking
        token_data['stored_at'] = datetime.datetime.now().isoformat()
        
        # Encrypt the token data
        fernet = Fernet(self.encryption_key)
        encrypted_data = fernet.encrypt(json.dumps(token_data).encode())
        
        with open(self.token_file, 'wb') as f:
            f.write(encrypted_data)
            
        print(f"Token saved to {self.token_file}")
    
    def load_token(self) -> Optional[Dict[str, Any]]:
        """Load token data from the token file"""
        if not os.path.exists(self.token_file):
            print(f"Token file not found: {self.token_file}")
            return None
            
        try:
            with open(self.token_file, 'rb') as f:
                encrypted_data = f.read()
                
            fernet = Fernet(self.encryption_key)
            decrypted_data = fernet.decrypt(encrypted_data)
            token_data = json.loads(decrypted_data.decode())
            return token_data
        except Exception as e:
            print(f"Error loading token: {e}")
            return None
    
    def is_token_expired(self, token_data: Dict[str, Any]) -> bool:
        """Check if the token is expired"""
        if 'expires_at' not in token_data:
            # If no expiry info, assume expired to be safe
            return True
            
        expires_at = datetime.datetime.fromisoformat(token_data['expires_at'])
        now = datetime.datetime.now()
        return now >= expires_at
    
    def is_token_expiring_soon(self, token_data: Dict[str, Any], 
                              warning_seconds: int = DEFAULT_EXPIRY_WARNING) -> bool:
        """Check if the token is expiring soon"""
        if 'expires_at' not in token_data:
            # If no expiry info, assume expiring soon to be safe
            return True
            
        expires_at = datetime.datetime.fromisoformat(token_data['expires_at'])
        warning_time = datetime.datetime.now() + datetime.timedelta(seconds=warning_seconds)
        return warning_time >= expires_at
    
    def get_token_expiry_seconds(self, token_data: Dict[str, Any]) -> Optional[int]:
        """Get the number of seconds until the token expires"""
        if 'expires_at' not in token_data:
            return None
            
        expires_at = datetime.datetime.fromisoformat(token_data['expires_at'])
        now = datetime.datetime.now()
        if now >= expires_at:
            return 0
        
        delta = expires_at - now
        return int(delta.total_seconds())
    
    def decode_token(self, token: str) -> Dict[str, Any]:
        """Decode a JWT token"""
        try:
            # JWT tokens have three parts separated by dots
            if token.count('.') != 2:
                raise ValueError("Not a valid JWT token format")
                
            # Decode without verification (we don't have the secret)
            decoded = jwt.decode(token, options={"verify_signature": False})
            return decoded
        except Exception as e:
            print(f"Error decoding token: {e}")
            # Fallback: manual decoding of the payload part
            try:
                payload_part = token.split('.')[1]
                # Add padding if needed
                payload_part += '=' * (4 - len(payload_part) % 4)
                decoded_bytes = base64.urlsafe_b64decode(payload_part)
                return json.loads(decoded_bytes)
            except Exception as e2:
                print(f"Fallback decoding also failed: {e2}")
                return {"error": "Could not decode token"}


def view_token(args):
    """View the current token information"""
    manager = TokenManager(args.token_file)
    token_data = manager.load_token()
    
    if not token_data:
        print("No token found.")
        return
    
    # Check token status
    is_expired = manager.is_token_expired(token_data)
    expiry_seconds = manager.get_token_expiry_seconds(token_data)
    is_expiring_soon = manager.is_token_expiring_soon(token_data)
    
    # Print token information
    print("\n=== Token Information ===")
    print(f"Token Type: {token_data.get('token_type', 'unknown')}")
    
    # Show access token (partially masked)
    access_token = token_data.get('access_token', '')
    if access_token:
        masked_token = access_token[:10] + '...' + access_token[-5:] if len(access_token) > 15 else access_token
        print(f"Access Token: {masked_token}")
    
    # Show refresh token (partially masked)
    refresh_token = token_data.get('refresh_token', '')
    if refresh_token:
        masked_refresh = refresh_token[:5] + '...' + refresh_token[-3:] if len(refresh_token) > 8 else refresh_token
        print(f"Refresh Token: {masked_refresh}")
    
    # Show scopes
    scopes = token_data.get('scope', '').split()
    if scopes:
        print("Scopes:")
        for scope in scopes:
            print(f"  - {scope}")
    
    # Show expiry information
    if expiry_seconds is not None:
        if is_expired:
            print("\nStatus: EXPIRED")
        elif is_expiring_soon:
            print(f"\nStatus: EXPIRING SOON (in {expiry_seconds} seconds)")
            print(f"Expires at: {token_data.get('expires_at')}")
        else:
            # Format expiry time in a human-readable way
            hours, remainder = divmod(expiry_seconds, 3600)
            minutes, seconds = divmod(remainder, 60)
            print(f"\nStatus: VALID")
            print(f"Expires in: {hours}h {minutes}m {seconds}s")
            print(f"Expires at: {token_data.get('expires_at')}")
    
    # Show when the token was stored
    if 'stored_at' in token_data:
        print(f"\nStored at: {token_data['stored_at']}")
    
    print("\nUse 'decode-token' to see the full token payload.")


def decode_token(args):
    """Decode and display the token payload"""
    manager = TokenManager(args.token_file)
    token_data = manager.load_token()
    
    if not token_data:
        print("No token found.")
        return
    
    token = token_data.get('access_token')
    if not token:
        print("No access token found in the token data.")
        return
    
    decoded = manager.decode_token(token)
    
    print("\n=== Decoded Token Payload ===")
    print(json.dumps(decoded, indent=2))
    
    # Show important fields with explanations
    print("\n=== Key Fields ===")
    if 'exp' in decoded:
        exp_time = datetime.datetime.fromtimestamp(decoded['exp'])
        print(f"Expiration Time (exp): {exp_time.isoformat()}")
    
    if 'iat' in decoded:
        iat_time = datetime.datetime.fromtimestamp(decoded['iat'])
        print(f"Issued At (iat): {iat_time.isoformat()}")
    
    if 'sub' in decoded:
        print(f"Subject (sub): {decoded['sub']}")
    
    if 'iss' in decoded:
        print(f"Issuer (iss): {decoded['iss']}")
    
    if 'aud' in decoded:
        print(f"Audience (aud): {decoded['aud']}")


def token_status(args):
    """Check the status of the current token"""
    manager = TokenManager(args.token_file)
    token_data = manager.load_token()
    
    if not token_data:
        print("No token found.")
        return 1  # Error exit code
    
    # Check token status
    is_expired = manager.is_token_expired(token_data)
    expiry_seconds = manager.get_token_expiry_seconds(token_data)
    is_expiring_soon = manager.is_token_expiring_soon(token_data)
    
    if is_expired:
        print("EXPIRED")
        return 2  # Expired exit code
    elif is_expiring_soon:
        print(f"EXPIRING_SOON {expiry_seconds}")
        return 3  # Expiring soon exit code
    else:
        print(f"VALID {expiry_seconds}")
        return 0  # Success exit code


def main():
    """Main entry point for the token debugger CLI"""
    parser = argparse.ArgumentParser(description="OAuth Token Debugger")
    parser.add_argument('--token-file', default=TOKEN_FILE, 
                        help=f"Path to token file (default: {TOKEN_FILE})")
    
    subparsers = parser.add_subparsers(dest='command', help='Command to execute')
    
    # view-token command
    view_parser = subparsers.add_parser('view-token', help='View current token information')
    view_parser.set_defaults(func=view_token)
    
    # decode-token command
    decode_parser = subparsers.add_parser('decode-token', help='Decode and display token payload')
    decode_parser.set_defaults(func=decode_token)
    
    # token-status command
    status_parser = subparsers.add_parser('token-status', 
                                         help='Check token status (for scripting)')
    status_parser.set_defaults(func=token_status)
    
    args = parser.parse_args()
    
    if args.command is None:
        parser.print_help()
        return
    
    args.func(args)


if __name__ == "__main__":
    main()
