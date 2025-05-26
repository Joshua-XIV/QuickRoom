export async function createRoom ({password = '', maxUsers = 10, isPrivate = false}) {
  const res = await fetch('/api/rooms', 
  {
    method: 'POST',
    headers: {'Content-Type' : 'application/json'},
    body: JSON.stringify({password, maxUsers, isPrivate })
  })

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed To Create Room');
  }

  return res.json()
};