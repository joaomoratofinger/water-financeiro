import axios from "axios";
import { cookies } from "next/headers";

export async function makeRequest(
  type: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "UPLOAD",
  url: string,
  data: any = null,
) {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Cookie: "session=" + session,
    };

    switch (type) {
      case "GET":
        return await axios.get(url, { headers });
      case "POST":
        return await axios.post(url, data, { headers });
      case "PUT":
        return await axios.put(url, data, { headers });
      case "PATCH":
        return await axios.patch(url, data, { headers });
      case "DELETE":
        return await axios.delete(url, { headers });
      case "UPLOAD":
        return await axios.post(url, data, {
          headers: { Cookie: "session=" + session },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        });
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const resData = error.response?.data;
      const apiError: any = new Error(
        resData?.message || resData?.error || error.message || "Request failed",
      );
      apiError.status = status;
      apiError.data = resData;
      apiError.isApiError = true;
      throw apiError;
    }
    throw error;
  }
}
