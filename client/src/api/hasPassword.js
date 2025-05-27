export async function hasPassword({ code }) {
  try {
    const res = await fetch(`/api/rooms/${code}/check-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const result = await res.json();

    if (res.ok && result.success) {
      return { success: true, hasPassword: result.hasPassword };
    }else {
      return { success: false, reason: result.reason || "Room does not exist" };
    }
  } catch (err) {
    console.error("Error in hasPassword:", err);
    return { success: false, reason: "Network error or invalid response" };
  }
}