async function fetchAgents() {
  const response = await fetch('http://localhost:5000/api/agents');
  return response.json();
}

async function fetchData() {
  const response = await fetch('http://localhost:5000/api/data');
  return response.json();
}

async function triggerN8n(url, message, sessionId) {
  console.log("URL:", url);
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, sessionId }),
  };
  console.log("Options:", options);

  try {
    const response = await fetch(url, options);
    console.log("Response Status:", response.status);
    return response.json();
  } catch (error) {
    console.error("Error:", error);
    throw error; // Re-throw the error to be handled by the caller
  }


}

export { fetchAgents, fetchData, triggerN8n };
