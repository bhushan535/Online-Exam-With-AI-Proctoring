import axios from 'axios';
import { BASE_URL } from '../config';

const getToken = () => localStorage.getItem('token');
const headers = () => ({ Authorization: `Bearer ${getToken()}` });

export const getOrgSettings = () =>
  axios.get(`${BASE_URL}/organization/me`, { headers: headers() });

export const saveOrgSettings = (data) =>
  axios.put(`${BASE_URL}/organization/update`, data, { headers: headers() });
