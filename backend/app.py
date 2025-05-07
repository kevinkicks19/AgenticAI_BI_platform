from flask import Flask, jsonify, request
import requests
import model_manager
import prioritization_manager

app = Flask(__name__)

def predict_sales(data):
    print("Predicting sales...")
    return None

def segment_customers(data):
    print("Segmenting customers...")
    return None

def call_n8n_workflow(url, data):
    """Makes a POST request to the given n8n workflow URL."""
    try:
        response = requests.post(url, json=data)
        response.raise_for_status()  # Raise an exception for bad status codes
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error calling n8n workflow: {e}")
    return None

@app.route("/")
def hello_world():
    return "Hello from the backend!"


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

@app.route("/api/triggerN8n", methods=['POST'])
@app.route("/api/triggerN8n", methods=['GET'])
def trigger_n8n():
    data = request.get_json()
    url = data.get("url")
    if not url:
        return jsonify({"error": "URL is required"}), 400
    result = call_n8n_workflow(url, data)
    return jsonify({"result": result})

   

if __name__ == "__main__":
    app.run(debug=True)