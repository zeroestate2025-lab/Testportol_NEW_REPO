
import axios from "axios";

// ✅ Create axios instance
const API = axios.create({
  baseURL: "http://localhost:5000/api",
  // baseURL: "https://testportalserver.onrender.com/api",
  timeout: 10000,
});

// ✅ Attach auth token automatically
API.interceptors.request.use(
  (config) => {
    const adminToken = localStorage.getItem("adminToken");
    const userToken = localStorage.getItem("userToken");
    const token = adminToken || userToken;
    if (token) config.headers.Authorization = token;
    return config;
  },
  (error) => Promise.reject(error)
);

// 🧩 ADMIN AUTH APIS
const adminAuth = {
  login: (credentials) => API.post("/admin/login", credentials),
  register: (data) => API.post("/admin/register", data),
};

// 🧩 USER APIS
const user = {
  register: (data) => API.post("/user/register", data),
  activateAll: () => API.put("/user/activate-all"),
};

// 🧩 QUESTIONS APIS
const questions = {
  getAll: () => API.get("/questions"),
  create: (question) => API.post("/questions", question),
  update: (id, question) => API.put(`/questions/${id}`, question),
  delete: (id) => API.delete(`/questions/${id}`),
  uploadDoc: (formData) =>
    API.post("/questions/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

// 🧩 TEST RESULTS APIS
const tests = {
  getAll: () => API.get("/tests"),
  submit: (testData) => API.post("/tests", testData),
  getById: (id) => API.get(`/tests/${id}`),
  validate: (id, validationData) =>
    API.put(`/tests/${id}/validate`, validationData),
};

// 🧩 TEST CONTROL APIS
const testcontrol = {
  get: () => API.get("/testcontrol"),
  update: (data) => API.put("/testcontrol", data),
};

// 🧩 WAITING USERS APIS — UPDATED WITH DELETE METHODS 🔥
const waitingUsers = {
  getAll: () => API.get("/waiting-users"),
  getCount: () => API.get("/waiting-users/count"),
  activateAll: () => API.put("/waiting-users/activate-all"),
  deleteLast: (status) => API.delete(`/waiting-users/last${status ? `?status=${status}` : ""}`),
  delete: (id) => API.delete(`/waiting-users/${id}`),
 deleteAll: () => API.delete("/waiting-users/delete-all-users"), 
};

// 🧩 Combine all
const combinedAPI = {
  ...API,
  adminAuth,
  user,
  questions,
  tests,
  testcontrol,
  waitingUsers,
};

export default combinedAPI;

// import axios from "axios";

// // ✅ Create axios instance
// const API = axios.create({
//   baseURL: "http://localhost:5000/api",
//  // baseURL: "https://testportalserver.onrender.com/api",
//   timeout: 10000,
// });

// // ✅ Attach auth token automatically
// API.interceptors.request.use(
//   (config) => {
//     const adminToken = localStorage.getItem("adminToken");
//     const userToken = localStorage.getItem("userToken");
//     const token = adminToken || userToken;
//     if (token) config.headers.Authorization = token;
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // 🧩 ADMIN AUTH APIS
// const adminAuth = {
//   login: (credentials) => API.post("/admin/login", credentials),
//   register: (data) => API.post("/admin/register", data),
// };

// // 🧩 USER APIS
// const user = {
//   register: (data) => API.post("/user/register", data),
//   activateAll: () => API.put("/user/activate-all"),
// };

// // 🧩 QUESTIONS APIS
// const questions = {
//   getAll: () => API.get("/questions"),
//   create: (question) => API.post("/questions", question),
//   update: (id, question) => API.put(`/questions/${id}`, question),
//   delete: (id) => API.delete(`/questions/${id}`),
//   uploadDoc: (formData) =>
//     API.post("/questions/upload", formData, {
//       headers: { "Content-Type": "multipart/form-data" },
//     }),
// };

// // 🧩 TEST RESULTS APIS
// const tests = {
//   getAll: () => API.get("/tests"),
//   submit: (testData) => API.post("/tests", testData),
//   getById: (id) => API.get(`/tests/${id}`),
//   validate: (id, validationData) =>
//     API.put(`/tests/${id}/validate`, validationData),
// };

// // 🧩 TEST CONTROL APIS
// const testcontrol = {
//   get: () => API.get("/testcontrol"),
//   update: (data) => API.put("/testcontrol", data),
// };

// // 🧩 WAITING USERS APIS — NEW 🔥
// const waitingUsers = {
//   getAll: () => API.get("/waiting-users"),
//   getCount: () => API.get("/waiting-users/count"),
//   deleteLast: () => API.delete("/waiting-users/last"),
//   activateAll: () => API.put("/waiting-users/activate-all"), // ✅ new
// };

// // 🧩 Combine all
// const combinedAPI = {
//   ...API,
//   adminAuth,
//   user,
//   questions,
//   tests,
//   testcontrol,
//   waitingUsers,
// };

// export default combinedAPI;

// // import axios from "axios";

// // // ✅ Create axios instance
// // const API = axios.create({
// //   baseURL: "http://localhost:5000/api",
// //   // baseURL: "https://testportalserver.onrender.com/api",
// //   timeout: 10000,
// // });

// // // ✅ Attach auth token automatically
// // API.interceptors.request.use(
// //   (config) => {
// //     const adminToken = localStorage.getItem("adminToken");
// //     const userToken = localStorage.getItem("userToken");
// //     const token = adminToken || userToken;
// //     if (token) config.headers.Authorization = token;
// //     return config;
// //   },
// //   (error) => Promise.reject(error)
// // );

// // // 🧩 ADMIN AUTH APIS
// // const adminAuth = {
// //   login: (credentials) => API.post("/admin/login", credentials),
// //   register: (data) => API.post("/admin/register", data),
// // };

// // // 🧩 QUESTIONS APIS
// // const questions = {
// //   getAll: () => API.get("/questions"),
// //   create: (question) => API.post("/questions", question),
// //   update: (id, question) => API.put(`/questions/${id}`, question),
// //   delete: (id) => API.delete(`/questions/${id}`),
// //   uploadDoc: (formData) =>
// //     API.post("/questions/upload", formData, {
// //       headers: { "Content-Type": "multipart/form-data" },
// //     }),
// // };

// // // 🧩 TEST RESULTS APIS
// // const tests = {
// //   getAll: () => API.get("/tests"),
// //   submit: (testData) => API.post("/tests", testData),
// //   getById: (id) => API.get(`/tests/${id}`),
// //   validate: (id, validationData) =>
// //     API.put(`/tests/${id}/validate`, validationData),
// // };

// // // 🧩 TEST CONTROL APIS
// // const testcontrol = {
// //   get: () => API.get("/testcontrol"),
// //   update: (data) => API.put("/testcontrol", data),
// // };

// // // 🧩 WAITING USERS APIS — NEW 🔥
// // const waitingUsers = {
// //   getAll: () => API.get("/waiting-users"), // list of waiting users
// //   getCount: () => API.get("/waiting-users/count"), // count of waiting users
// //   deleteLast: () => API.delete("/waiting-users/last"), // ✅ NEW
// // };

// // // 🧩 Combine all
// // const combinedAPI = {
// //   ...API,
// //   adminAuth,
// //   questions,
// //   tests,
// //   testcontrol,
// //   waitingUsers, // ✅ Added here
// // };

// // export default combinedAPI;

// // // import axios from "axios";

// // // // ✅ Create axios instance
// // // const API = axios.create({
// // // baseURL: "http://localhost:5000/api",
// // // // baseURL: "https://testportalserver.onrender.com/api",
// // // timeout: 10000,
// // // });

// // // // ✅ Attach auth token for admin or user automatically
// // // API.interceptors.request.use(
// // //   (config) => {
// // //     const adminToken = localStorage.getItem("adminToken");
// // //     const userToken = localStorage.getItem("userToken");
// // //     const token = adminToken || userToken;
// // //     if (token) config.headers.Authorization = token;
// // //     return config;
// // //   },
// // //   (error) => Promise.reject(error)
// // // );

// // // // 🧩 ADMIN AUTH APIS
// // // const adminAuth = {
// // //   login: (credentials) => API.post("/admin/login", credentials),
// // //   register: (data) => API.post("/admin/register", data),
// // // };

// // // // 🧩 QUESTIONS APIS
// // // const questions = {
// // //   getAll: () => API.get("/questions"),
// // //   create: (question) => API.post("/questions", question),
// // //   update: (id, question) => API.put(`/questions/${id}`, question),
// // //   delete: (id) => API.delete(`/questions/${id}`),
// // //   uploadDoc: (formData) =>
// // //     API.post("/questions/upload", formData, {
// // //       headers: { "Content-Type": "multipart/form-data" },
// // //     }),
// // // };

// // // // 🧩 TEST RESULTS APIS
// // // const tests = {
// // //   getAll: () => API.get("/tests"),
// // //   submit: (testData) => API.post("/tests", testData),
// // //   getById: (id) => API.get(`/tests/${id}`),
// // //   validate: (id, validationData) =>
// // //     API.put(`/tests/${id}/validate`, validationData),
// // // };

// // // // 🧩 NEW — TEST CONTROL APIS (Admin Test Settings)
// // // const testcontrol = {
// // //   get: () => API.get("/testcontrol"),          // Get current test control state
// // //   update: (data) => API.put("/testcontrol", data), // Update test control (start/stop/time/questions)
// // // };

// // // // 🧩 Combine all modules into one export
// // // const combinedAPI = {
// // //   ...API,
// // //   adminAuth,
// // //   questions,
// // //   tests,
// // //   testcontrol, // ✅ Added testcontrol module here
// // // };

// // // export default combinedAPI;


// // // // import axios from "axios";

// // // // const API = axios.create({
// // // //   baseURL: "http://localhost:5000/api",
// // // //   timeout: 10000,
// // // // });

// // // // API.interceptors.request.use((config) => {
// // // //   const adminToken = localStorage.getItem("adminToken");
// // // //   const userToken = localStorage.getItem("userToken");
// // // //   const token = adminToken || userToken;
// // // //   if (token) config.headers.Authorization = token;
// // // //   return config;
// // // // }, (error) => Promise.reject(error));

// // // // // Admin Authentication APIs
// // // // const adminAuth = {
// // // //   login: (credentials) => API.post("/admin/login", credentials),
// // // //   register: (data) => API.post("/admin/register", data),
// // // // };

// // // // // Questions APIs
// // // // const questions = {
// // // //   getAll: () => API.get("/questions"),
// // // //   create: (question) => API.post("/questions", question),
// // // //   update: (id, question) => API.put(`/questions/${id}`, question),
// // // //   delete: (id) => API.delete(`/questions/${id}`),
// // // //   uploadDoc: (formData) => API.post("/questions/upload", formData, {
// // // //     headers: { "Content-Type": "multipart/form-data" }
// // // //   }),
// // // // };

// // // // // Test Results APIs
// // // // const tests = {
// // // //   getAll: () => API.get("/tests"),
// // // //   submit: (testData) => API.post("/tests", testData),
// // // //   getById: (id) => API.get(`/tests/${id}`),
// // // //   validate: (id, validationData) => API.put(`/tests/${id}/validate`, validationData),
// // // // };

// // // // // Combined API object
// // // // const combinedAPI = {
// // // //   ...API,
// // // //   adminAuth,
// // // //   questions,
// // // //   tests,
// // // // };

// // // // export default combinedAPI;
