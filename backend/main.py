import os
from app import create_app

if __name__ == '__main__':
    app = create_app()
    port = int(os.environ.get('PORT', 5000))
    # DEBUG é controlado por settings.py (via .env)
    # Nunca rode com debug=True em produção
    debug_mode = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    print(f'Starting Spoti Backend on port {port} (Debug: {debug_mode})')
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
