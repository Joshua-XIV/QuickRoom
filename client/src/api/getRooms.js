export async function getRooms () {
  const res = await fetch('/api/rooms', 
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