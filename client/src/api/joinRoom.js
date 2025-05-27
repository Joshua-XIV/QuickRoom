export async function joinRoom ({code = "", username = "", password = ""}) {
  if (!code.trim()) {
    throw new Error("Room code cannot be empty.");
  }

  const res = await fetch(`/api/rooms/${code}/join`, 
  {
    method: "POST",
    headers: {"Content-Type" : "application/json"},
    body: JSON.stringify({ username, password })
  })

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed To Join Room');
  }

  return res.json();
};