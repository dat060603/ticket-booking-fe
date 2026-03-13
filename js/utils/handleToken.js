import CONFIG from "/js/utils/settings.js";
const BASE_URL = CONFIG.BASE_URL;

export function getToken() {
  // Hỗ trợ cả 2 key 'access' và 'access_token'
  return localStorage.getItem('access') || localStorage.getItem('access_token');
}

export function fetchWithToken(url, options = {}) {
    // Lấy access token từ localStorage (hỗ trợ cả 'access' và 'access_token')
    const accessToken = getToken();

    options.headers = options.headers || {};
    if (accessToken) {
        options.headers['Authorization'] = `Bearer ${accessToken}`;
    }

    return fetch(url, options)
        .then(response => {
            if (response.status === 401) {
                return refreshAccessToken().then(newAccessToken => {
                    if (newAccessToken) {
                        options.headers['Authorization'] = `Bearer ${newAccessToken}`;
                        return fetch(url, options);
                    }
                    return Promise.reject('Failed to refresh token');
                });
            }
            console.log('Response Status:', response);
            return response;
        });
}

// Hàm làm mới access token sử dụng refresh token
function refreshAccessToken() {
    const refreshToken = localStorage.getItem('refresh');
    
    if (!refreshToken) {
        // Nếu không có refresh token, yêu cầu người dùng đăng nhập lại
        window.location.href = '/pages/login_empl1.html';
        return Promise.reject('No refresh token available');
    }

    // Gửi yêu cầu làm mới access token
    return fetch(`${BASE_URL}/api/accounts/auth/token/refresh/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken })
    })
    .then(response => response.json())
    .then(data => {
        // Hỗ trợ response trả về 'access' hoặc 'access_token'
        const newAccessToken = data.access || data.access_token;
        if (newAccessToken) {
            // Lưu access token mới vào cả 2 key để tương thích
            localStorage.setItem('access', newAccessToken);
            localStorage.setItem('access_token', newAccessToken);
            return newAccessToken;
        } else {
            // Nếu làm mới token thất bại, yêu cầu người dùng đăng nhập lại
            localStorage.removeItem('access');
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh');
            window.location.href = '/pages/login_empl1.html';
            return Promise.reject('Failed to refresh token');
        }
    })
    .catch(error => {
        console.error('Error refreshing token:', error);
        // Nếu có lỗi trong quá trình làm mới token, yêu cầu người dùng đăng nhập lại
        localStorage.removeItem('access');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh');
        window.location.href = '/pages/login_empl1.html';
        return Promise.reject('Error refreshing token');
    });
}