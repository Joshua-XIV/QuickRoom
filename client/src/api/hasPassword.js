export async function hasPassword ({code, password}) {
  const res = await fetch(`/api/room/${code}/check-password`, {
    method: "POST",
    headers: {"Content-Type": "application/json" },
    body: JSON.stringify({password})
  });

  const result = await res.json();

  if (result.success || result.reason === "No password required") {
    return {success:true}
  }
  else {
    return {success:false, reason: result.reason || "Unknown Error"}
  }
}