import { BrowserRouter, Routes, Route } from "react-router-dom";
import StudentPage from "./pages/student/StudentPage";
import StudentDetails from "./pages/student/StudentDetails";
import Dashboard from "./pages/Dashboard";
import AddStudent from "./pages/student/AddStudent";
import EditStudent from "./pages/student/EditStudent";

function App() {
  return (
    <BrowserRouter>
      <Routes>
  <Route path="/" element={<Dashboard />} />

  <Route path="/students" element={<StudentPage />} />

  <Route
    path="/students/add"
    element={<AddStudent />}
  />

  <Route
    path="/students/:id"
    element={<StudentDetails />}
  />

  <Route
    path="/students/edit/:id"
    element={<EditStudent />}
  />
</Routes>
    </BrowserRouter>
  );
}

export default App;