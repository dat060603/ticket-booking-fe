import CONFIG from "/js/utils/settings.js";
import { fetchWithToken } from '/js/utils/handleToken.js';

const API_BASE_URL = CONFIG.BASE_URL + "/api/";

// Sửa đổi: Bỏ tham số 'token' ở đây. 
// fetchWithToken sẽ tự động lấy localStorage.getItem('access_token') bên trong nó.
export async function getStadiumSections(stadiumId) {
  try {
    const resp = await fetchWithToken(`${API_BASE_URL}events/stadiums/${stadiumId}/sections/`, {
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

export async function updateSectionMapPosition(stadiumId, sectionId, mapPosition) {
  try {
    const resp = await fetchWithToken(`${API_BASE_URL}events/stadiums/${stadiumId}/sections/${sectionId}/update/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ map_position: mapPosition })
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error(`Error updating map_position for section ${sectionId}:`, resp.status, text);
      throw new Error('Failed to update section map_position');
    }

    return resp.json();
  } catch (err) {
    console.error('Exception while updating section map_position', err);
    throw err;
  }
}