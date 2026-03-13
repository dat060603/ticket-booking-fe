import CONFIG from "/js/utils/settings.js";

/**
 * Customer-facing service for stadium data (public endpoints, no auth required)
 */
const API_BASE_URL = CONFIG.BASE_URL + "/api/";

export async function getStadiumSections(stadiumId) {
  try {
    // Endpoint không yêu cầu authorize → dùng fetch bình thường để tránh thêm header Authorization
    const resp = await fetch(`${API_BASE_URL}events/stadiums/${stadiumId}/sections/`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error(`Error fetching stadium sections: ${resp.status}`, text);
      return [];
    }

    return resp.json();
  } catch (err) {
    console.error('Exception while fetching stadium sections', err);
    return [];
  }
}
