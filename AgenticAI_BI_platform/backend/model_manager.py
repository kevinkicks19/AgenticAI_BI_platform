# backend/model_manager.py

sales_prediction_model = None
customer_segmentation_model = None

def load_sales_prediction_model():
    try:
        print("Loading sales prediction model...")
        # Here you would load your actual model
        return "Sales Model"
    except Exception as e:
        print(f"Error loading sales prediction model: {e}")
        return None

def load_customer_segmentation_model():
    try:
        print("Loading customer segmentation model...")
        # Here you would load your actual model
        return "Customer Segmentation Model"
    except Exception as e:
        print(f"Error loading customer segmentation model: {e}")
        return None

def initialize_models():
    global sales_prediction_model, customer_segmentation_model
    sales_prediction_model = load_sales_prediction_model()
    customer_segmentation_model = load_customer_segmentation_model()
    return sales_prediction_model is not None and customer_segmentation_model is not None

# Don't initialize at module import time
# Instead, we'll call initialize_models() when the FastAPI app starts