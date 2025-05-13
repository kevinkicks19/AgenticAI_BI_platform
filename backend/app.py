from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
import model_manager
import prioritization_manager
import json

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})  # Enable CORS for all routes, accepting requests from our frontend (running on http://localhost:5173)

def predict_sales(data):
    print("Predicting sales...")
    return None

def segment_customers(data):
    print("Segmenting customers...")
    return None

def call_n8n_workflow(url, data):
    """Makes a POST request to the given n8n workflow URL."""
    try:
        print("\n=== N8N Request Details ===")
        print("URL:", url)
        print("Headers:", {
            'Content-Type': 'application/json'
        })
        print("Request Body:", json.dumps(data, indent=2))
        print("========================\n")
        
        response = requests.post(url, json=data)
        print("\n=== N8N Response Details ===")
        print("Status Code:", response.status_code)
        print("Response Headers:", dict(response.headers))
        print("Response Body:", response.text)
        print("===========================\n")
        
        response.raise_for_status()  # Raise an exception for bad status codes
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error calling n8n workflow: {e}")
        # Return a default response when n8n is not available
        return {
            "output": "I apologize, but I'm having trouble connecting to my workflow system. Could you please try again in a moment?",
            "turn": data.get('turn', 0)  # Include turn in response
        }
    return None

@app.route("/")
def hello_world():
    return "Hello from the backend!"

@app.route("/api/chat", methods=['POST'])
def chat():
    try:
        data = request.get_json()
        # Handle both message and chatInput formats
        chat_input = data.get('chatInput') or data.get('message', '')  # Try chatInput first, fall back to message
        session_id = data.get('sessionId', '')

        print("=== Received Chat Request ===")
        print(f"Raw Request Data: {json.dumps(data, indent=2)}")
        print(f"Chat Input: {chat_input}")
        print(f"Session ID: {session_id}")
        print("===========================")

        # In a real app, you would integrate a database (or an auth system) to fetch the user's profile
        dummy_user_response = requests.get("http://localhost:5000/api/user")
        dummy_user_profile = dummy_user_response.json()
        n8n_webhook_url = dummy_user_profile.get("default_workflow", "https://bmccartn.app.n8n.cloud/webhook/b3ddae7d-fffe-4e50-b242-744e822f7b58/chat")

        # Prepare request to n8n using the format expected by @n8n/chat
        n8n_data = { "chat": { "chatInput": chat_input, "sessionId": session_id } }
        print("\n=== Sending to N8N (using dummy user's default workflow) ===")
        print("Request Data:", json.dumps(n8n_data, indent=2))
        print("=====================\n")

        result = call_n8n_workflow(n8n_webhook_url, n8n_data)
        print("\n=== N8N Response ===")
        print("Response:", json.dumps(result, indent=2))
        print("===================\n")
        return jsonify(result)
    except Exception as e:
        print(f"Error in /api/chat (call_n8n_workflow): {e}")
        return jsonify({ "output": "I apologize, but I'm having trouble connecting to my workflow system. Could you please try again in a moment?" }), 500

@app.route("/api/data")
def get_data():
    data = {
        "sales": 1000,
        "customers": 500,
        "products": 200
    }
    return jsonify(data)

@app.route("/api/agents")
def get_agents():
    # Dummy criteria values for demonstration
    criteria_values = {
        "impact": 0.7,
        "urgency": 0.8,
        "effort": 0.3,
        "confidence": 0.9,
        "risk": 0.2,
    }
    agents = [
        {"id": 1, "name": "Agent 1", "status": "active", "priority": prioritization_manager.calculate_priority_score("agent_action_1", criteria_values, prioritization_manager.criteria_weights)},
        {"id": 2, "name": "Agent 2", "status": "idle", "priority": prioritization_manager.calculate_priority_score("agent_action_2", criteria_values, prioritization_manager.criteria_weights)}
    ]
    return jsonify(agents)

@app.route("/api/user", methods=['GET'])
def get_user_profile():
    # In a real app, you would integrate a database (or an auth system) to fetch the user's profile (e.g. via a session token or user id).
    # For now, we return a dummy user profile (with fields for authentication, role, notification preferences, default workflow, persistence parameters, and LLM model preferences) so that our web app can "manage" overall user parameters (including authentication, role-based access control, notification preferences, default workflow selection, persistence parameters, and LLM model preferences) and "support" multiple users and personas.
    dummy_user_profile = {
        "user_id": "user_123",
        "username": "demo_user",
        "role": "admin",
        "notification_preferences": { "email": True, "sms": False },
        "default_workflow": "https://bmccartn.app.n8n.cloud/webhook/b3ddae7d-fffe-4e50-b242-744e822f7b58/chat",
        "persistence_parameters": { "session_timeout": 3600, "persist_conversation": True },
        "llm_model_preferences": { "model": "gpt-4", "temperature": 0.7 }
    }
    return jsonify(dummy_user_profile)

@app.route("/api/triggerN8n", methods=['POST'])
@app.route("/api/triggerN8n", methods=['GET'])
def trigger_n8n():
    data = request.get_json()
    url = data.get("url")
    if not url:
        return jsonify({"error": "URL is required"}), 400
    result = call_n8n_workflow(url, data)
    return jsonify({"result": result})

@app.route("/api/chat/approval", methods=['POST'])
def handle_approval():
    data = request.get_json()
    session_id = data.get('sessionId')
    approved = data.get('approved')
    
    print("\n=== Received Approval Request ===")
    print("Session ID:", session_id)
    print("Approved:", approved)
    print("==============================\n")
    
    # Replace this URL with your actual n8n workflow webhook URL for approvals
    n8n_webhook_url = "https://bmccartn.app.n8n.cloud/webhook-test/1ca71fb5-6b71-4a82-9376-a5105df7a345"
    
    try:
        result = call_n8n_workflow(n8n_webhook_url, {
            'body': {
                'type': 'approval',
                'sessionId': session_id,
                'approved': approved
            }
        })
        print("\n=== N8N Approval Response ===")
        print("Response:", json.dumps(result, indent=2))
        print("===========================\n")
        return jsonify(result)
    except Exception as e:
        print(f"Error in handle_approval: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)