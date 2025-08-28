"""
Guardrails system for the AgenticAI BI Platform
Inspired by OpenAI's Customer Service Agents Demo
"""

import re
import json
from typing import Dict, List, Optional, Tuple
from datetime import datetime

class GuardrailsManager:
    """
    Manages conversation guardrails to ensure appropriate and focused interactions
    """
    
    def __init__(self):
        # Define guardrails
        self.guardrails = {
            "relevance": {
                "name": "Relevance Guardrail",
                "description": "Ensures conversations stay focused on business intelligence and data analysis",
                "keywords": ["business", "data", "analysis", "report", "insights", "metrics", "performance", "workflow", "automation", "n8n", "process", "integration"],
                "blocked_patterns": [
                    r"write.*poem",
                    r"tell.*joke", 
                    r"sing.*song",
                    r"play.*game",
                    r"random.*question.*unrelated",
                    r"off.*topic"
                ]
            },
            "jailbreak": {
                "name": "Jailbreak Guardrail", 
                "description": "Prevents attempts to bypass system instructions",
                "blocked_patterns": [
                    r"system.*instructions",
                    r"ignore.*previous",
                    r"act.*as.*different",
                    r"pretend.*to.*be",
                    r"bypass.*rules",
                    r"override.*instructions"
                ]
            },
            "safety": {
                "name": "Safety Guardrail",
                "description": "Prevents harmful or inappropriate requests",
                "blocked_patterns": [
                    r"hack.*system",
                    r"delete.*data",
                    r"unauthorized.*access",
                    r"bypass.*security"
                ]
            }
        }
        
        # Track guardrail violations
        self.violations = []
    
    def check_guardrails(self, message: str, context: Dict = None) -> Dict[str, any]:
        """
        Check if a message violates any guardrails
        
        Args:
            message: User message to check
            context: Current conversation context
            
        Returns:
            Dictionary with guardrail check results
        """
        violations = []
        triggered_guardrails = []
        
        message_lower = message.lower()
        
        # Check each guardrail
        for guardrail_name, guardrail_config in self.guardrails.items():
            is_triggered = False
            violation_reason = ""
            
            # Check blocked patterns
            for pattern in guardrail_config.get("blocked_patterns", []):
                if re.search(pattern, message_lower, re.IGNORECASE):
                    is_triggered = True
                    violation_reason = f"Matched blocked pattern: {pattern}"
                    break
            
            # Check relevance guardrail specifically
            if guardrail_name == "relevance" and not is_triggered:
                # Check if message contains relevant keywords
                relevant_keywords = guardrail_config.get("keywords", [])
                has_relevant_content = any(keyword in message_lower for keyword in relevant_keywords)
                
                # If no relevant content and message is substantial, flag it
                if not has_relevant_content and len(message.split()) > 3:
                    # Allow some common conversational phrases
                    allowed_phrases = [
                        "hello", "hi", "thanks", "thank you", "goodbye", "bye",
                        "help", "what can you do", "capabilities", "workflows", "n8n", "workflow", "automation", "agent", "handoff"
                    ]
                    
                    if not any(phrase in message_lower for phrase in allowed_phrases):
                        is_triggered = True
                        violation_reason = "Message appears unrelated to business intelligence or data analysis"
            
            if is_triggered:
                violations.append({
                    "guardrail": guardrail_name,
                    "name": guardrail_config["name"],
                    "description": guardrail_config["description"],
                    "reason": violation_reason,
                    "timestamp": datetime.now().isoformat()
                })
                triggered_guardrails.append(guardrail_name)
        
        # Record violations
        if violations:
            self.violations.extend(violations)
        
        return {
            "passed": len(violations) == 0,
            "violations": violations,
            "triggered_guardrails": triggered_guardrails,
            "message": self._generate_guardrail_response(violations)
        }
    
    def _generate_guardrail_response(self, violations: List[Dict]) -> str:
        """Generate appropriate response for guardrail violations"""
        if not violations:
            return ""
        
        # Get the first violation for response
        violation = violations[0]
        guardrail_name = violation["guardrail"]
        
        if guardrail_name == "relevance":
            return "I can help with business intelligence, data analysis, workflows, automation, and related topics. Please ask me about data, reports, insights, business analytics, or n8n workflows."
        elif guardrail_name == "jailbreak":
            return "I can only answer questions related to business intelligence and data analysis."
        elif guardrail_name == "safety":
            return "I cannot help with that type of request. Please ask me about business intelligence, data analysis, or related topics."
        else:
            return "I can only help with business intelligence and data analysis topics."
    
    def get_violations_summary(self) -> Dict[str, any]:
        """Get summary of all guardrail violations"""
        return {
            "total_violations": len(self.violations),
            "violations_by_type": self._count_violations_by_type(),
            "recent_violations": self.violations[-10:] if self.violations else []
        }
    
    def _count_violations_by_type(self) -> Dict[str, int]:
        """Count violations by guardrail type"""
        counts = {}
        for violation in self.violations:
            guardrail_type = violation["guardrail"]
            counts[guardrail_type] = counts.get(guardrail_type, 0) + 1
        return counts
    
    def reset_violations(self):
        """Reset violation tracking"""
        self.violations = []

# Global instance
guardrails_manager = GuardrailsManager() 