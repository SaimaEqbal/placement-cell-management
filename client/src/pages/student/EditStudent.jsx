import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getStudentById,
  updateStudent,
} from "../../api/studentApi";

export default function EditStudent() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    roll_no: "",
    name: "",
    email: "",
    phone: "",

    branch: "",
    graduation_year: "",
    cgpa: "",

    gender: "",
    region: "",
    religion: "",

    date_of_birth: "",

    active_backlogs: "",
    passive_backlogs: "",

    resume_url: "",
    tenth_marksheet_url: "",
    twelfth_marksheet_url: "",
    last_sem_marksheet_url: "",

    placement_status: "unplaced",
  });

  useEffect(() => {
    fetchStudent();
  }, []);

  const fetchStudent = async () => {
  try {
    setLoading(true);

    const res = await getStudentById(id);

    const student = res.data;

    setFormData({
      ...student,

      cgpa:
        student.cgpa !== null
          ? Number(student.cgpa)
          : "",

      graduation_year:
        student.graduation_year !== null
          ? Number(student.graduation_year)
          : "",

      active_backlogs:
        student.active_backlogs ?? "",

      passive_backlogs:
        student.passive_backlogs ?? "",

      date_of_birth: student.date_of_birth
        ? student.date_of_birth.split("T")[0]
        : "",
    });
  } catch (err) {
    console.error(err);
    alert("Failed to load student");
  } finally {
    setLoading(false);
  }
};

  const handleChange = (e) => {
  const { name, value } = e.target;

  setFormData((prev) => ({
    ...prev,

    [name]:
      [
        "graduation_year",
        "active_backlogs",
        "passive_backlogs",
      ].includes(name)
        ? value === ""
          ? ""
          : Number(value)
        : name === "cgpa"
        ? value === ""
          ? ""
          : parseFloat(value)
        : value,
  }));
};

 const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    setLoading(true);

    const payload = Object.fromEntries(
      Object.entries({
        ...formData,

        cgpa:
          formData.cgpa === ""
            ? undefined
            : Number(formData.cgpa),

        graduation_year:
          formData.graduation_year === ""
            ? undefined
            : Number(formData.graduation_year),

        active_backlogs:
          formData.active_backlogs === ""
            ? undefined
            : Number(formData.active_backlogs),

        passive_backlogs:
          formData.passive_backlogs === ""
            ? undefined
            : Number(formData.passive_backlogs),
      }).filter(
        ([_, value]) =>
          value !== "" &&
          value !== null &&
          value !== undefined
      )
    );

    console.log("Updating:", payload);

    await updateStudent(id, payload);

    alert("Student Updated Successfully");

    navigate("/students");
  } catch (err) {
    console.error(err);

    alert(
      JSON.stringify(
        err.response?.data,
        null,
        2
      )
    );
  } finally {
    setLoading(false);
  }
};



  return (
    <div className="min-h-screen bg-gray-100 px-3 py-4 sm:px-6 lg:px-8">

      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8">

        <h1 className="text-3xl font-bold mb-6">
          Edit Student
        </h1>

        <form
          onSubmit={handleSubmit}
          className="space-y-8"
        >

          {/* Personal Info */}
          <div>

            <h2 className="text-xl font-semibold mb-4">
              Personal Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <input
                name="roll_no"
                placeholder="Roll Number"
                value={formData.roll_no}
                onChange={handleChange}
                className="border p-3 rounded-lg w-full"
              />

              <input
                name="name"
                placeholder="Name"
                value={formData.name}
                onChange={handleChange}
                className="border p-3 rounded-lg w-full"
              />

              <input
                name="email"
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className="border p-3 rounded-lg w-full"
              />

              <input
                name="phone"
                placeholder="Phone"
                value={formData.phone}
                onChange={handleChange}
                className="border p-3 rounded-lg w-full"
              />

              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="border p-3 rounded-lg w-full"
              >
                <option value="">
                  Select Gender
                </option>
                <option value="Male">
                  Male
                </option>
                <option value="Female">
                  Female
                </option>
                <option value="Other">
                  Other
                </option>
              </select>

              <input
                name="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={handleChange}
                className="border p-3 rounded-lg w-full"
              />

              <input
                name="region"
                placeholder="Region"
                value={formData.region}
                onChange={handleChange}
                className="border p-3 rounded-lg w-full"
              />

              <input
                name="religion"
                placeholder="Religion"
                value={formData.religion}
                onChange={handleChange}
                className="border p-3 rounded-lg w-full"
              />

            </div>
          </div>

          {/* Academic */}
          <div>

            <h2 className="text-xl font-semibold mb-4">
              Academic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <input
                name="branch"
                placeholder="Branch"
                value={formData.branch}
                onChange={handleChange}
                className="border p-3 rounded-lg w-full"
              />

              <input
                name="graduation_year"
                type="number"
                placeholder="Graduation Year"
                value={formData.graduation_year}
                onChange={handleChange}
                className="border p-3 rounded-lg w-full"
              />

              <input
                name="cgpa"
                type="number"
                step="0.01"
                placeholder="CGPA"
                value={formData.cgpa}
                onChange={handleChange}
                className="border p-3 rounded-lg w-full"
              />

              <select
                name="placement_status"
                value={formData.placement_status}
                onChange={handleChange}
                className="border p-3 rounded-lg w-full"
              >
                <option value="unplaced">
                  Unplaced
                </option>
                <option value="shortlisted">
                  Shortlisted
                </option>
                <option value="placed">
                  Placed
                </option>
                <option value="rejected">
                  Rejected
                </option>
              </select>

            </div>
          </div>

          {/* Backlogs */}
          <div>

            <h2 className="text-xl font-semibold mb-4">
              Backlog Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <input
                name="active_backlogs"
                type="number"
                placeholder="Active Backlogs"
                value={formData.active_backlogs}
                onChange={handleChange}
                className="border p-3 rounded-lg w-full"
              />

              <input
                name="passive_backlogs"
                type="number"
                placeholder="Passive Backlogs"
                value={formData.passive_backlogs}
                onChange={handleChange}
                className="border p-3 rounded-lg w-full"
              />

            </div>
          </div>

          {/* Documents */}
          <div>

            <h2 className="text-xl font-semibold mb-4">
              Documents
            </h2>

            <div className="grid grid-cols-1 gap-4">

              <input
                name="resume_url"
                placeholder="Resume URL"
                value={formData.resume_url}
                onChange={handleChange}
                className="border p-3 rounded-lg w-full"
              />

              <input
                name="tenth_marksheet_url"
                placeholder="10th Marksheet URL"
                value={formData.tenth_marksheet_url}
                onChange={handleChange}
                className="border p-3 rounded-lg w-full"
              />

              <input
                name="twelfth_marksheet_url"
                placeholder="12th Marksheet URL"
                value={formData.twelfth_marksheet_url}
                onChange={handleChange}
                className="border p-3 rounded-lg w-full"
              />

              <input
                name="last_sem_marksheet_url"
                placeholder="Last Sem Marksheet URL"
                value={formData.last_sem_marksheet_url}
                onChange={handleChange}
                className="border p-3 rounded-lg w-full"
              />

            </div>

          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold"
          >
            {loading
              ? "Updating..."
              : "Update Student"}
          </button>

        </form>

      </div>
    </div>
  );
}