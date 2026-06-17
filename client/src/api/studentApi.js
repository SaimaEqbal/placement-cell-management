import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:3000/students",
});

export const getStudents = () => API.get("/");
export const getStudentById = (id) => API.get(`/${id}`);
export const deleteStudent = (id) => API.delete(`/${id}`);
export const createStudent = (data) => API.post("/", data);
export const updateStudent = (id, data) =>API.put(`/${id}`, data);