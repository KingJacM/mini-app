import axios from "axios";
import { User } from "firebase/auth";

export function api(user: User | null) {
  const instance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
  });
  instance.interceptors.request.use(async (cfg) => {
    if (user) {
      const token = await user.getIdToken();
      cfg.headers!["Authorization"] = `Bearer ${token}`;
    }
    return cfg;
  });
  return instance;
}