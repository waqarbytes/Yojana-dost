from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import openai
import os
import json
from dotenv import load_dotenv
from fastapi import FastAPI




app = FastAPI()

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")
cd

 
# ✅ Load OpenAI API key (recommended to use environment variable)
openai.api_key = os.getenv("OPENAI_API_KEY", "OPENAI_API_KEY")

# ✅ Create FastAPI app
app = FastAPI()

# ✅ Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your domain here
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Load schemes from schemes.json (must be in the same directory)
try:
    with open("schemes.json", "r", encoding="utf-8") as f:
        SCHEMES = json.load(f)
except FileNotFoundError:
    SCHEMES = []

# ✅ Category keyword mapping
CATEGORY_ALIASES = {
    "women": "Women & Child",
    "ladies": "Women & Child",
    "mahila": "Women & Child",
    "farmer": "Agriculture",
    "kisan": "Agriculture",
    "krishi": "Agriculture",
    "agriculture": "Agriculture",
    "education": "Education",
    "scholarship": "Education",
    "student": "Education",
    "health": "Health",
    "insurance": "Health",
    "hospital": "Health",
    "housing": "Housing",
    "home": "Housing",
    "pmay": "Housing",
    "awas": "Housing",
    "business": "Business & Employment",
    "startup": "Business & Employment",
    "employment": "Business & Employment",
    "loan": "Business & Employment",
    "pension": "Social Welfare",
    "tribal": "Tribal Affairs",
    "rural": "Rural Development"
}


@app.post("/")
async def get_response(request: Request):
    data = await request.json()
    message = data.get("message", "").lower().strip()

    matched_category = None
    for keyword, category in CATEGORY_ALIASES.items():
        if keyword in message:
            matched_category = category
            break

    if matched_category:
        filtered = [s for s in SCHEMES if s.get("category") == matched_category]
        if not filtered:
            return {"response": f"🚫 No schemes found for {matched_category}."}

        # Create response
        reply = f"📚 Schemes under {matched_category}:\n"
        for scheme in filtered:  # limit to 5
            reply += f"""
🔹 <strong>{scheme['title']}</strong><br>
{scheme['description']}<br>
<a href="{scheme.get('url', '#')}" target="_blank" style="color:#007bff;">Apply Now</a><br><br>
"""
        return {"response": reply}

    # ✅ Fallback to GPT if no matching category
    gpt_reply = get_gpt_response(message)
    return {"response": gpt_reply}


# ✅ GPT fallback logic
def get_gpt_response(message):
    try:
        completion = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant that explains Indian government schemes clearly and briefly."
                },
                {
                    "role": "user",
                    "content": message
                }
            ]
        )
        return completion.choices[0].message.content.strip()
    except Exception as e:
        print("GPT Error:", e)
        return "⚠️ Smart assistant is currently unavailable. Please try again later."
    
    

@app.get("/")
def read_root():
    return {"message": "Welcome to Yojana Dost backend API!"}
