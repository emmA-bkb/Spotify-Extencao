from app import create_app
import json

app = create_app()

with app.test_client() as client:
    print("=== Testando /health ===")
    r = client.get('/health')
    print(f"Status: {r.status_code}")
    print(f"Response: {r.get_json()}\n")
    
    print("=== Testando /auth/spotify/login ===")
    r = client.get('/auth/spotify/login')
    print(f"Status: {r.status_code}")
    print(f"Response: {r.get_json()}\n")
    
    print("✅ API está funcionando!")
