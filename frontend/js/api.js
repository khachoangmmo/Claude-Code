/**
 * Mrbo Ads E-Learning — API Client
 * Handles all communication with the backend REST API
 */
const API_BASE = '/api';

const API = {
  async _request(method, endpoint, body, useAuth = false) {
    const headers = { 'Content-Type': 'application/json' };

    if (useAuth) {
      const token = localStorage.getItem('mrbo_token');
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();

    // Auto-logout on 401
    if (response.status === 401 && useAuth) {
      Auth.logout(false);
    }

    return data;
  },

  get(endpoint)                   { return this._request('GET',    endpoint, null,  false); },
  post(endpoint, body)            { return this._request('POST',   endpoint, body,  false); },
  authGet(endpoint)               { return this._request('GET',    endpoint, null,  true);  },
  authPost(endpoint, body)        { return this._request('POST',   endpoint, body,  true);  },
  authPut(endpoint, body)         { return this._request('PUT',    endpoint, body,  true);  },
  authDelete(endpoint)            { return this._request('DELETE', endpoint, null,  true);  },
};
