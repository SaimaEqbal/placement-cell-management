import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createStudent } from "../../api/studentApi";

export default function AddStudent() {
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

    const payload = {
      ...formData,

      cgpa: Number(formData.cgpa),
      graduation_year: Number(
        formData.graduation_year
      ),
      active_backlogs: Number(
        formData.active_backlogs
      ),
      passive_backlogs: Number(
        formData.passive_backlogs
      ),
    };

    console.log("Creating:", payload);

    await createStudent(payload);

    alert("Student Added Successfully");

    navigate("/students");
  } catch (err) {
    console.error(
      "CREATE ERROR:",
      err.response?.data
    );

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
          Add Student
        </h1>

        <form
          onSubmit={handleSubmit}
          className="space-y-8"
        >

          {/* Personal Information */}
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
                className="border p-3 rounded"
                required
              />

              <input
                name="name"
                placeholder="Name"
                value={formData.name}
                onChange={handleChange}
                className="border p-3 rounded"
                required
              />

              <input
                name="email"
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className="border p-3 rounded"
                required
              />

              <input
                name="phone"
                placeholder="Phone"
                value={formData.phone}
                onChange={handleChange}
                className="border p-3 rounded"
                required
              />

              <select
  name="gender"
  value={formData.gender}
  onChange={handleChange}
  className="w-full border border-gray-300 rounded-lg p-3"
  required
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
                name="region"
                placeholder="Region"
                value={formData.region}
                onChange={handleChange}
                className="border p-3 rounded"
                required
              />

              <input
                name="religion"
                placeholder="Religion"
                value={formData.religion}
                onChange={handleChange}
                className="border p-3 rounded"
                required
              />

              <input
                name="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={handleChange}
                className="border p-3 rounded"
                required
              />

            </div>
          </div>

          {/* Academic Information */}
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
                className="border p-3 rounded"
                required
              />

              <input
                name="graduation_year"
                type="number"
                placeholder="Graduation Year"
                value={formData.graduation_year}
                onChange={handleChange}
                className="border p-3 rounded"
                required
              />
            
              <input
                name="cgpa"
                type="number"
                placeholder="CGPA"
                step="0.01"
                placeholder="CGPA"
                value={formData.cgpa}
                onChange={handleChange}
                className="border p-3 rounded"
                required
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

    <div>
  <label className="block mb-2 font-medium">
    Active Backlogs
  </label>

  <input
    type="number"
    name="active_backlogs"
    placeholder="Enter Active Backlogs"
    value={formData.active_backlogs}
    onChange={handleChange}
    className="w-full border border-gray-300 rounded-lg p-3"
  />
</div>

    <div>
  <label className="block mb-2 font-medium">
    Passive Backlogs
  </label>

  <input
    type="number"
    name="passive_backlogs"
    placeholder="Enter Passive Backlogs"
    value={formData.passive_backlogs}
    onChange={handleChange}
    className="w-full border border-gray-300 rounded-lg p-3"
  />
</div>

  </div>
</div>

          {/* Documents */}
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Document URLs
            </h2>

            <div className="grid grid-cols-1 gap-4">

              <input
                name="resume_url"
                placeholder="Resume URL"
                value={formData.resume_url}
                onChange={handleChange}
                className="border p-3 rounded"
                required
              />

              <input
                name="tenth_marksheet_url"
                placeholder="10th Marksheet URL"
                value={formData.tenth_marksheet_url}
                onChange={handleChange}
                className="border p-3 rounded"
                required
              />

              <input
                name="twelfth_marksheet_url"
                placeholder="12th Marksheet URL"
                value={formData.twelfth_marksheet_url}
                onChange={handleChange}
                className="border p-3 rounded"
                required
              />

              <input
                name="last_sem_marksheet_url"
                placeholder="Last Semester Marksheet URL"
                value={formData.last_sem_marksheet_url}
                onChange={handleChange}
                className="border p-3 rounded"
                required
              />

            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold"
          >
            {loading
              ? "Creating..."
              : "Create Student"}
          </button>

        </form>
      </div>
    </div>
  );
}