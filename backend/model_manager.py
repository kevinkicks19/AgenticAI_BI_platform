# backend/model_manager.py

sales_prediction_model = None
customer_segmentation_model = None

def load_sales_prediction_model():
    print("Loading sales prediction model...")
    # Here you would load your actual model
    return "Sales Model"

def load_customer_segmentation_model():
    print("Loading customer segmentation model...")
    # Here you would load your actual model
    return "Customer Segmentation Model"
sales_prediction_model = load_sales_prediction_model()
customer_segmentation_model = load_customer_segmentation_model()