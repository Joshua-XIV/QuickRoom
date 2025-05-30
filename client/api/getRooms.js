const BASE_API_URL = import.meta.env.VITE_API_BASE_URL;

export async function getRooms () {
  const res = await fetch(`${BASE_API_URL}/rooms`, 
  {
    method: 'GET',
    headers: {'Content-Type' : 'application/json'},
  })

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed To Get Rooms');
  }

  return res.json()
};