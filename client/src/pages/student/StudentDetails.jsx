import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getStudentById } from "../../api/studentApi";

function DocumentCard({ title, url }) {
  return (
    <div className="border rounded-lg p-4 bg-gray-50 hover:shadow transition">
      <h3 className="font-semibold mb-2">{title}</h3>

      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 hover:underline"
        >
          View Document
        </a>
      ) : (
        <span className="text-red-500">Not Uploaded</span>
      )}
    </div>
  );
}

export default function StudentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudent();
  }, []);

  const fetchStudent = async () => {
    try {
      const res = await getStudentById(id);
      setStudent(res.data);
    } catch (err) {
      console.error("Error fetching student:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <h2 className="text-xl">Loading Student...</h2>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <h2 className="text-xl text-red-500">
          Student Not Found
        </h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">

      {/* Back Button */}
      <button
        onClick={() => navigate("/students")}
        className="mb-6 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800"
      >
        ← Back
      </button>

      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">

        <div className="flex justify-between items-center">

          <div>
            <h1 className="text-3xl font-bold">
              {student.name}
            </h1>

            <p className="text-gray-500">
              Roll No: {student.roll_no}
            </p>

            <p className="mt-2 text-lg">
              {student.branch}
            </p>
          </div>

          <div>
            <span
              className={`px-4 py-2 rounded-full font-medium ${
                student.placement_status === "placed"
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {student.placement_status}
            </span>
          </div>

        </div>

      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4">
          Personal Information
        </h2>

        <div className="grid grid-cols-2 gap-4">

          <p>
            <strong>Name:</strong> {student.name}
          </p>

          <p>
            <strong>Email:</strong> {student.email}
          </p>

          <p>
            <strong>Phone:</strong> {student.phone}
          </p>

          <p>
            <strong>Gender:</strong>{" "}
            {student.gender || "N/A"}
          </p>

          <p>
            <strong>Region:</strong>{" "}
            {student.region || "N/A"}
          </p>

          <p>
            <strong>Religion:</strong>{" "}
            {student.religion || "N/A"}
          </p>

          <p>
            <strong>Date of Birth:</strong>{" "}
            {student.date_of_birth
              ? new Date(
                  student.date_of_birth
                ).toLocaleDateString()
              : "N/A"}
          </p>

        </div>
      </div>

      {/* Academic Information */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">

        <h2 className="text-2xl font-semibold mb-4">
          Academic Information
        </h2>

        <div className="grid grid-cols-2 gap-4">

          <p>
            <strong>Branch:</strong> {student.branch}
          </p>

          <p>
            <strong>CGPA:</strong> {student.cgpa}
          </p>

          <p>
            <strong>Graduation Year:</strong>{" "}
            {student.graduation_year}
          </p>

          <p>
            <strong>Active Backlogs:</strong>{" "}
            {student.active_backlogs}
          </p>

          <p>
            <strong>Passive Backlogs:</strong>{" "}
            {student.passive_backlogs}
          </p>

        </div>

      </div>

      {/* Placement Information */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">

        <h2 className="text-2xl font-semibold mb-4">
          Placement Information
        </h2>

        <div className="grid grid-cols-2 gap-4">

          <p>
            <strong>Status:</strong>{" "}
            {student.placement_status}
          </p>

          <p>
            <strong>Review Status:</strong>{" "}
            {student.review_status}
          </p>

          <p>
            <strong>Created At:</strong>{" "}
            {new Date(
              student.created_at
            ).toLocaleDateString()}
          </p>

        </div>

      </div>

      {/* Documents */}
      <div className="bg-white rounded-xl shadow p-6">

        <h2 className="text-2xl font-semibold mb-4">
          Documents
        </h2>

        <div className="grid grid-cols-2 gap-4">

          <DocumentCard
            title="Resume"
            url={student.resume_url}
          />

          <DocumentCard
            title="10th Marksheet"
            url={student.tenth_marksheet_url}
          />

          <DocumentCard
            title="12th Marksheet"
            url={student.twelfth_marksheet_url}
          />

          <DocumentCard
            title="Last Semester Marksheet"
            url={student.last_sem_marksheet_url}
          />

        </div>

      </div>

    </div>
  );
}