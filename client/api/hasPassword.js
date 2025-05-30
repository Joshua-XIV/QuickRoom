const BASE_API_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE_LOCAL_URL;

export async function hasPassword({ code }) {
  try {
    const res = await fetch(`${BASE_API_URL}/rooms/${code}/check-password`, {
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