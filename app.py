from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import time
from fuzzywuzzy import fuzz

app = Flask(__name__)
CORS(app)

# Load schemes data
with open('data/schemes.json', 'r') as f:
    SCHEMES = json.load(f)

def find_matches(message):
    """Improved matching with fuzzy logic and synonyms"""
    message = message.lower()
    synonyms = {
        'health': ['medical', 'hospital', 'ayushman'],
        'pmkisan': ['farmer', 'kisan', 'income support'],
        'housing': ['home', 'awas', 'pradhan mantri awas yojana' ]
    }
    
    matches = []
    for scheme in SCHEMES:
        # Check name, description, category
        fields_to_check = [
            scheme['name'].lower(),
            scheme['description'].lower(),
            scheme['category'].lower()
        ] + scheme['keywords']
        
        # Check synonyms
        for word, syns in synonyms.items():
            if word in message:
                fields_to_check.extend(syns)
        
        # Fuzzy match
        for field in fields_to_check:
            if fuzz.partial_ratio(message, field) > 70:
                matches.append(scheme)
                break
                
    return matches

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    message = data.get('message', '').strip()
    
    if not message:
        return jsonify({"response": "Please enter a query."})
    
    matches = find_matches(message)
    
    if not matches:
        # Suggest categories
        categories = list({s['category'] for s in SCHEMES})
        return jsonify({
            "response": (
                f"I couldn't find exact matches for '{message}'. "
                f"Try these categories: {', '.join(categories)}. "
                "Or ask about specific schemes like 'Ayushman Bharat'."
            )
        })
    
    # Format response with proper HTML links
    response = f"<strong>Found {len(matches)} scheme{'s' if len(matches)>1 else ''}:</strong><br><br>"
    for i, scheme in enumerate(matches[:3], 1):
        response += (
            f"<strong>{i}. {scheme['name']}</strong><br>"
            f"{scheme['description']}<br>"
            f"<em>Eligibility: {scheme.get('eligibility', 'Not specified')}</em><br>"
            f"<a href='{scheme['url']}' target='_blank'>Official Website</a><br><br>"
        )
    
    return jsonify({"response": response})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
