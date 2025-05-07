import React, { useState, useEffect } from 'react';
import { fetchData } from '../utils/api';

function Home() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData()
      .then(response => {
        setData(response);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching data:", error);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h1>Welcome to the Agentic AI Business Intelligence Platform!</h1>
      {loading ? (
        <p>Loading data...</p>
      ) : (
        <pre>{JSON.stringify(data, null, 2)}</pre>
      )}
    </div>
  );
}

export default Home;