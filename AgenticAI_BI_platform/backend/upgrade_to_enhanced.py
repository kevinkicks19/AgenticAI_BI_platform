#!/usr/bin/env python3
"""
Script to upgrade from the basic app.py to the enhanced version with OpenAPI documentation.
This script backs up the current app.py and replaces it with the enhanced version.
"""

import os
import shutil
from datetime import datetime

def backup_current_app():
    """Backup the current app.py file."""
    current_app_path = "app.py"
    backup_path = f"app_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.py"
    
    if os.path.exists(current_app_path):
        shutil.copy2(current_app_path, backup_path)
        print(f"✅ Backed up current app.py to {backup_path}")
        return backup_path
    else:
        print("⚠️  No existing app.py found to backup")
        return None

def upgrade_to_enhanced():
    """Replace app.py with the enhanced version."""
    enhanced_app_path = "app_enhanced.py"
    current_app_path = "app.py"
    
    if not os.path.exists(enhanced_app_path):
        print(f"❌ Enhanced app file not found: {enhanced_app_path}")
        return False
    
    # Backup current app.py
    backup_path = backup_current_app()
    
    # Replace with enhanced version
    shutil.copy2(enhanced_app_path, current_app_path)
    print(f"✅ Replaced app.py with enhanced version")
    
    print("\n🎉 Upgrade completed successfully!")
    print("\nNew features available:")
    print("  • Comprehensive OpenAPI/Swagger documentation at /docs")
    print("  • ReDoc documentation at /redoc")
    print("  • Enhanced API endpoints with proper request/response models")
    print("  • Health check endpoints at /health and /api/health")
    print("  • System metrics endpoint at /api/metrics")
    print("  • Improved error handling and logging")
    print("  • Better API organization with tags")
    
    if backup_path:
        print(f"\n💾 Original app.py backed up to: {backup_path}")
    
    return True

if __name__ == "__main__":
    print("🚀 Upgrading Agentic AI BI Platform to Enhanced Version...")
    print("=" * 60)
    
    success = upgrade_to_enhanced()
    
    if success:
        print("\n" + "=" * 60)
        print("✅ Upgrade completed! You can now:")
        print("  1. Start the server: python app.py")
        print("  2. Visit /docs for Swagger UI")
        print("  3. Visit /redoc for ReDoc documentation")
        print("  4. Check /health for system status")
    else:
        print("\n❌ Upgrade failed. Please check the error messages above.")
