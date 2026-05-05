import axios from 'axios';

function getAuthHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

export async function getUserAddresses(token) {
  const response = await axios.get('/api/user/addresses', {
    headers: getAuthHeader(token),
  });
  return response.data.addresses;
}

export async function addAddress(token, label, address, type) {
  const response = await axios.post(
    '/api/user/addresses',
    { label, address, type },
    { headers: getAuthHeader(token) }
  );
  return response.data.address;
}

export async function deleteAddress(token, id) {
  await axios.delete(`/api/user/addresses/${id}`, {
    headers: getAuthHeader(token),
  });
}

export async function updateAddressLabel(token, id, label) {
  const response = await axios.patch(
    `/api/user/addresses/${id}`,
    { label },
    { headers: getAuthHeader(token) }
  );
  return response.data.address;
}

export async function getUserPreferences(token) {
  const response = await axios.get('/api/user/preferences', {
    headers: getAuthHeader(token),
  });
  return response.data.preferences;
}

export async function updateUserPreferences(token, preferences) {
  const response = await axios.put(
    '/api/user/preferences',
    preferences,
    { headers: getAuthHeader(token) }
  );
  return response.data.preferences;
}
