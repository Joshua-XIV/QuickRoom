const BASE_API_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE_LOCAL_URL;

export async function createRoom ({username='', password = '', maxUsers = 10, isPrivate = false}) {
  const res = await fetch(`${BASE_API_URL}/rooms`, 
  {
    method: 'POST',
    headers: {'Content-Type' : 'application/json'},
    body: JSON.stringify({username, password, maxUsers, isPrivate })
  })

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed To Create Room');
  }

  return res.json()
};