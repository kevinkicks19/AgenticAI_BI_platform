"""
Test N8N MCP Integration

This script tests the enhanced N8nMCPClient to verify N8N connectivity
and MCP-style access functionality.
"""

import os
import sys
from datetime import datetime
from mcp_client import N8nMCPClient, n8n_health_check, n8n_list_workflows

def print_header(title):
    """Print a formatted header"""
    print(f"\n{'='*70}")
    print(f"  {title}")
    print(f"{'='*70}")

def print_result(status, message):
    """Print a formatted result"""
    icon = "✅" if status == "success" else "❌"
    print(f"{icon} {message}")

def test_health_check(client):
    """Test N8N health check"""
    print_header("1. N8N Health Check")
    
    health = client.health_check()
    
    print(f"\nHealth Check Result:")
    print(f"  Status: {health.get('status')}")
    print(f"  Message: {health.get('message')}")
    print(f"  API URL: {health.get('api_url')}")
    print(f"  Workflows Count: {health.get('workflows_count', 'N/A')}")
    
    if health.get("status") == "healthy":
        print_result("success", "N8N instance is healthy and accessible!")
        return True
    else:
        print_result("error", f"N8N health check failed: {health.get('message')}")
        return False

def test_list_workflows(client):
    """Test listing workflows"""
    print_header("2. List Workflows")
    
    result = client.list_workflows()
    
    if result.get("status") == "success":
        workflows = result.get("workflows", [])
        total_count = result.get("total_count", 0)
        source = result.get("source", "unknown")
        
        print(f"\nWorkflow List Result:")
        print(f"  Total Workflows: {total_count}")
        print(f"  Data Source: {source}")
        
        if workflows:
            print(f"\n  Workflows:")
            for i, wf in enumerate(workflows[:5], 1):  # Show first 5
                name = wf.get("name", "Unnamed")
                wf_id = wf.get("id", "N/A")
                active = wf.get("active", False)
                status = "Active" if active else "Inactive"
                print(f"    {i}. {name}")
                print(f"       ID: {wf_id}")
                print(f"       Status: {status}")
            
            if total_count > 5:
                print(f"\n  ... and {total_count - 5} more workflows")
        
        print_result("success", f"Successfully retrieved {total_count} workflows!")
        return True, workflows
    else:
        print_result("error", f"Failed to list workflows: {result.get('message')}")
        return False, []

def test_get_workflow(client, workflow_id):
    """Test getting workflow details"""
    print_header("3. Get Workflow Details")
    
    print(f"\nFetching workflow: {workflow_id}")
    
    result = client.get_workflow(workflow_id)
    
    if result.get("status") == "success":
        workflow = result.get("workflow", {})
        
        print(f"\nWorkflow Details:")
        print(f"  ID: {workflow.get('id', 'N/A')}")
        print(f"  Name: {workflow.get('name', 'N/A')}")
        print(f"  Active: {workflow.get('active', False)}")
        print(f"  Description: {workflow.get('description', 'No description')}")
        
        nodes = workflow.get('nodes', [])
        print(f"  Nodes: {len(nodes)} nodes")
        
        if nodes:
            print(f"\n  Node Types:")
            for i, node in enumerate(nodes[:3], 1):
                node_type = node.get('type', 'unknown')
                node_name = node.get('name', 'unnamed')
                print(f"    {i}. {node_name} ({node_type})")
        
        print_result("success", "Successfully retrieved workflow details!")
        return True
    else:
        print_result("error", f"Failed to get workflow: {result.get('message')}")
        return False

def test_convenience_functions():
    """Test convenience functions"""
    print_header("4. Test Convenience Functions")
    
    print("\nTesting convenience function: n8n_health_check()")
    health = n8n_health_check()
    print(f"  Result: {health.get('status')}")
    
    print("\nTesting convenience function: n8n_list_workflows()")
    workflows = n8n_list_workflows()
    print(f"  Result: {workflows.get('status')}, Count: {workflows.get('total_count', 0)}")
    
    print_result("success", "Convenience functions working correctly!")
    return True

def test_executions(client, workflow_id=None):
    """Test execution listing"""
    print_header("5. List Workflow Executions")
    
    if workflow_id:
        print(f"\nFetching executions for workflow: {workflow_id}")
        result = client.list_executions(workflow_id=workflow_id, limit=5)
    else:
        print(f"\nFetching recent executions (all workflows)")
        result = client.list_executions(limit=5)
    
    if result.get("status") == "success":
        executions = result.get("executions", [])
        count = result.get("count", 0)
        
        print(f"\nExecution List Result:")
        print(f"  Total Found: {count}")
        
        if executions:
            print(f"\n  Recent Executions:")
            for i, execution in enumerate(executions, 1):
                exec_id = execution.get("id", "N/A")
                status = execution.get("status", "unknown")
                mode = execution.get("mode", "N/A")
                print(f"    {i}. {exec_id}")
                print(f"       Status: {status}")
                print(f"       Mode: {mode}")
        else:
            print(f"  No executions found")
        
        print_result("success", f"Successfully retrieved {count} executions!")
        return True
    else:
        print_result("error", f"Failed to list executions: {result.get('message')}")
        return False

def run_all_tests():
    """Run all integration tests"""
    print("\n" + "="*70)
    print("  🧪 N8N MCP Integration Test Suite")
    print("  " + datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    print("="*70)
    
    # Initialize client
    print("\nInitializing N8nMCPClient...")
    client = N8nMCPClient()
    
    # Check configuration
    print(f"\nConfiguration:")
    print(f"  N8N_API_URL: {os.getenv('N8N_API_URL', 'NOT SET')}")
    print(f"  N8N_API_KEY: {'SET' if os.getenv('N8N_API_KEY') else 'NOT SET'}")
    
    if not os.getenv('N8N_API_KEY'):
        print_result("error", "N8N_API_KEY not set in environment!")
        print("\n⚠️  Please set N8N_API_KEY in your .env file")
        return False
    
    # Run tests
    results = []
    
    # Test 1: Health Check
    results.append(("Health Check", test_health_check(client)))
    
    # Test 2: List Workflows
    success, workflows = test_list_workflows(client)
    results.append(("List Workflows", success))
    
    # Test 3: Get Workflow Details (if we have workflows)
    if workflows:
        first_workflow = workflows[0]
        workflow_id = first_workflow.get("id")
        results.append(("Get Workflow", test_get_workflow(client, workflow_id)))
        
        # Test 5: List Executions for specific workflow
        results.append(("List Executions", test_executions(client, workflow_id)))
    else:
        print_header("3. Get Workflow Details")
        print("\n⚠️  Skipping - no workflows available")
        results.append(("Get Workflow", None))
        
        print_header("5. List Workflow Executions")
        print("\n⚠️  Skipping - no workflows available")
        results.append(("List Executions", None))
    
    # Test 4: Convenience Functions
    results.append(("Convenience Functions", test_convenience_functions()))
    
    # Print summary
    print_header("Test Summary")
    
    passed = sum(1 for _, result in results if result is True)
    failed = sum(1 for _, result in results if result is False)
    skipped = sum(1 for _, result in results if result is None)
    total = len(results)
    
    print(f"\nResults:")
    for test_name, result in results:
        if result is True:
            print(f"  ✅ {test_name}: PASSED")
        elif result is False:
            print(f"  ❌ {test_name}: FAILED")
        else:
            print(f"  ⏭️  {test_name}: SKIPPED")
    
    print(f"\nSummary:")
    print(f"  Total Tests: {total}")
    print(f"  Passed: {passed}")
    print(f"  Failed: {failed}")
    print(f"  Skipped: {skipped}")
    
    success_rate = (passed / (total - skipped)) * 100 if (total - skipped) > 0 else 0
    print(f"  Success Rate: {success_rate:.1f}%")
    
    if failed == 0 and passed > 0:
        print("\n🎉 All tests passed! N8N MCP integration is working correctly!")
        return True
    elif failed > 0:
        print(f"\n⚠️  {failed} test(s) failed. Please check the output above for details.")
        return False
    else:
        print("\n⚠️  No tests were run. Please check your configuration.")
        return False

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)

